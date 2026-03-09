import * as acme from 'acme-client';
import Alidns, * as $Alidns from '@alicloud/alidns20150109';
import * as $OpenApi from '@alicloud/openapi-client';
import { createPrivateKey, X509Certificate } from 'crypto';
import { createRequire } from 'module';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { homedir } from 'os';
import { Config, ensureSecureDir } from '../utils/config';
import { parseRootAndSubdomain } from '../utils/domain';
import type { Spinner } from '../utils/errors';
import { sleep } from '../utils/runtime';
import { withRetry } from '../utils/retry';
import { resolveSdkCtor } from '../utils/sdk';
import { readLicellEnv } from '../utils/env';
import { getFnCustomDomain, updateFnCustomDomain } from './fc/custom-domain';

const ACME_KEY_PATH = join(homedir(), '.licell-cli', 'acme-account.pem');
const runtimeRequire: NodeJS.Require | undefined = (() => {
  if (typeof require === 'function') return require;
  try {
    const fallbackBase = typeof __filename === 'string'
      ? __filename
      : join(process.cwd(), '__licell_require__.cjs');
    return createRequire(fallbackBase);
  } catch {
    return undefined;
  }
})();
const AlidnsClientCtor = resolveSdkCtor<Alidns>(Alidns, '@alicloud/alidns20150109');
const DAY_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_SSL_RENEW_BEFORE_DAYS = 30;
const DEFAULT_SSL_DNS_PROPAGATION_TIMEOUT_MS = 180_000;
const DEFAULT_SSL_ACME_HTTP_TIMEOUT_MS = 30_000;
const DEFAULT_SSL_ACME_HTTP_RETRY_MAX_ATTEMPTS = 0;
const DEFAULT_SSL_ACME_AUTO_TIMEOUT_MS = 300_000;
const DEFAULT_SSL_CLEANUP_TIMEOUT_MS = 30_000;
const SSL_DNS_PROPAGATION_INTERVAL_MS = 5_000;
const DEFAULT_ACME_TXT_TTL_SECONDS = 600;

interface DnsRecordLike {
  recordId?: string;
  value?: string;
}

export interface ExistingDomainLike {
  protocol?: string;
  certConfig?: {
    certificate?: string;
    privateKey?: string;
  };
}

interface IssueSslOptions {
  forceRenew?: boolean;
  renewBeforeDays?: number;
  bindToFcDomain?: boolean;
}

export interface SslBindingArtifacts {
  url: string;
  certificate?: string;
  privateKey?: string;
  reusedExistingCertificate: boolean;
}

export interface ResolvedIssueSslOptions {
  forceRenew: boolean;
  renewBeforeDays: number;
}

interface AcmeChallengeLike {
  type: string;
  url?: string;
  token?: string;
  status?: string;
}

interface AcmeAuthorizationLike {
  url?: string;
  status?: string;
  identifier: {
    value: string;
  };
  challenges: AcmeChallengeLike[];
}

interface AcmeOrderLike {
  url?: string;
  status?: string;
  finalize?: string;
  certificate?: string;
  authorizations?: string[];
}

interface AcmeClientLike {
  getAccountUrl(): string;
  createAccount(data?: {
    termsOfServiceAgreed?: boolean;
    contact?: string[];
  }): Promise<unknown>;
  createOrder(data: {
    identifiers: Array<{ type: 'dns'; value: string }>;
  }): Promise<AcmeOrderLike>;
  getAuthorizations(order: AcmeOrderLike): Promise<AcmeAuthorizationLike[]>;
  getChallengeKeyAuthorization(challenge: AcmeChallengeLike): Promise<string>;
  verifyChallenge(authz: AcmeAuthorizationLike, challenge: AcmeChallengeLike): Promise<boolean>;
  completeChallenge(challenge: AcmeChallengeLike): Promise<AcmeChallengeLike>;
  waitForValidStatus<T extends AcmeOrderLike | AcmeAuthorizationLike | AcmeChallengeLike>(item: T): Promise<T>;
  deactivateAuthorization(authz: AcmeAuthorizationLike): Promise<AcmeAuthorizationLike>;
  finalizeOrder(order: AcmeOrderLike, csr: Buffer | string): Promise<AcmeOrderLike>;
  getCertificate(order: AcmeOrderLike, preferredChain?: string | null): Promise<string>;
}

interface RunAcmeDns01FlowOptions {
  client: AcmeClientLike;
  domains: string[];
  csr: Buffer | string;
  email?: string;
  preferredChain?: string | null;
  spinner: Spinner;
  skipChallengeVerification: boolean;
  totalTimeoutMs: number;
  labelPrefix?: string;
  onChallengeCreate: (domain: string, txtValue: string) => Promise<void>;
  onChallengeRemove: (domain: string, txtValue: string) => Promise<void>;
}

function parseTimeoutMs(input: string | undefined, fallback: number) {
  if (!input) return fallback;
  const parsed = Number.parseInt(input, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function parseNonNegativeInt(input: string | undefined, fallback: number) {
  if (!input) return fallback;
  const parsed = Number.parseInt(input, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

export function resolveAcmeDirectoryUrl(env: Record<string, string | undefined> = process.env) {
  const value = readLicellEnv(env, 'SSL_ACME_DIRECTORY')?.trim().toLowerCase();
  if (!value || value === 'production' || value === 'prod') return acme.directory.letsencrypt.production;
  if (value === 'staging' || value === 'stage') return acme.directory.letsencrypt.staging;
  if (value.startsWith('https://') || value.startsWith('http://')) return value;
  throw new Error(`无效的 ACME directory 配置: ${value}`);
}

function configureAcmeHttpTimeout() {
  const timeoutMs = parseTimeoutMs(readLicellEnv(process.env, 'SSL_ACME_HTTP_TIMEOUT_MS'), DEFAULT_SSL_ACME_HTTP_TIMEOUT_MS);
  const retryMaxAttempts = parseNonNegativeInt(
    readLicellEnv(process.env, 'SSL_ACME_HTTP_RETRY_MAX_ATTEMPTS'),
    DEFAULT_SSL_ACME_HTTP_RETRY_MAX_ATTEMPTS
  );
  try {
    const acmeAxios = runtimeRequire?.('acme-client/src/axios');
    if (acmeAxios?.defaults) {
      acmeAxios.defaults.timeout = timeoutMs;
      acmeAxios.defaults.acmeSettings = {
        ...(acmeAxios.defaults.acmeSettings || {}),
        retryMaxAttempts
      };
    }
  } catch {
    // best-effort: internal acme-client transport may not be accessible in all bundling modes
  }
  return { timeoutMs, retryMaxAttempts };
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} 超时（>${timeoutMs}ms）`)), timeoutMs);
      })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function formatUnknownError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function readBooleanEnv(value: string | undefined) {
  const normalized = value?.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'on' || normalized === 'yes';
}

function isSslTraceEnabled(env: Record<string, string | undefined> = process.env) {
  return readBooleanEnv(readLicellEnv(env, 'SSL_TRACE'));
}

function traceSsl(message: string, env: Record<string, string | undefined> = process.env) {
  if (!isSslTraceEnabled(env)) return;
  console.error(`[licell][ssl] ${new Date().toISOString()} ${message}`);
}

function createAcmeStageRunner(totalTimeoutMs: number, labelPrefix: string) {
  const startedAt = Date.now();
  return async function runStage<T>(stage: string, task: () => Promise<T>): Promise<T> {
    const remainingMs = totalTimeoutMs - (Date.now() - startedAt);
    const stageLabel = `${labelPrefix}/${stage}`;
    if (remainingMs <= 0) {
      throw new Error(`${stageLabel} 超时（>${totalTimeoutMs}ms）`);
    }
    traceSsl(`${stageLabel}: start`);
    try {
      const result = await withTimeout(Promise.resolve().then(task), remainingMs, stageLabel);
      traceSsl(`${stageLabel}: ok`);
      return result;
    } catch (error) {
      const normalizedError = error instanceof Error && error.message.startsWith(stageLabel)
        ? error
        : new Error(`${stageLabel}: ${formatUnknownError(error)}`);
      traceSsl(`${stageLabel}: failed: ${formatUnknownError(normalizedError)}`);
      throw normalizedError;
    }
  };
}

function toFcPemPrivateKey(key: Buffer) {
  const keyPem = key.toString('utf8');
  try {
    return createPrivateKey(keyPem).export({ format: 'pem', type: 'pkcs1' }).toString();
  } catch {
    return keyPem;
  }
}

async function getOrCreateAccountKey(): Promise<Buffer> {
  if (existsSync(ACME_KEY_PATH)) {
    return readFileSync(ACME_KEY_PATH);
  }
  ensureSecureDir(dirname(ACME_KEY_PATH));
  const key = await acme.crypto.createPrivateKey();
  writeFileSync(ACME_KEY_PATH, key, { mode: 0o600 });
  return key;
}

function hasHttpsProtocol(protocol: unknown) {
  if (typeof protocol !== 'string') return false;
  return protocol
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .includes('HTTPS');
}

export function resolveRenewBeforeDays(input: unknown, fallback = DEFAULT_SSL_RENEW_BEFORE_DAYS) {
  const value = typeof input === 'number'
    ? String(input)
    : typeof input === 'string'
      ? input.trim()
      : '';
  if (!/^\d+$/.test(value)) return fallback;
  const parsed = Number.parseInt(value, 10);
  return parsed > 0 ? parsed : fallback;
}

export function getCertificateDaysRemaining(certificatePem: string, nowMs = Date.now()) {
  try {
    const cert = new X509Certificate(certificatePem);
    const expireAt = Date.parse(cert.validTo);
    if (!Number.isFinite(expireAt)) return null;
    return Math.floor((expireAt - nowMs) / DAY_MS);
  } catch {
    return null;
  }
}

function formatDaysRemaining(daysRemaining: number) {
  if (daysRemaining >= 0) return `剩余 ${daysRemaining} 天`;
  return `已过期 ${Math.abs(daysRemaining)} 天`;
}

function parsePropagationTimeoutMs(input: string | undefined) {
  if (!input) return DEFAULT_SSL_DNS_PROPAGATION_TIMEOUT_MS;
  const parsed = Number(input.trim());
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_SSL_DNS_PROPAGATION_TIMEOUT_MS;
  return Math.floor(parsed);
}

function normalizeTxtValue(value: string) {
  return value.trim().replace(/^"+|"+$/g, '');
}

function normalizeAcmeIdentifierDomain(domain: string) {
  return domain.trim().replace(/^\*\./, '');
}

function resolveAcmeChallengeRecord(domain: string) {
  const normalizedDomain = normalizeAcmeIdentifierDomain(domain);
  const { rootDomain, subDomain } = parseRootAndSubdomain(normalizedDomain);
  return {
    rootDomain,
    challengeRecord: subDomain === '@' ? '_acme-challenge' : `_acme-challenge.${subDomain}`
  };
}

async function listChallengeTxtRecords(
  dnsClient: Alidns,
  rootDomain: string,
  challengeRecord: string
) {
  const candidates = [`${challengeRecord}.${rootDomain}`, challengeRecord];
  const records: DnsRecordLike[] = [];
  for (const candidate of candidates) {
    try {
      const response = await withRetry(() => dnsClient.describeSubDomainRecords(new $Alidns.DescribeSubDomainRecordsRequest({
        domainName: rootDomain,
        subDomain: candidate,
        type: 'TXT',
        pageNumber: 1,
        pageSize: 100
      })));
      records.push(...((response.body?.domainRecords?.record || []) as DnsRecordLike[]));
    } catch {
      // some candidate subDomain formats may not exist, safe to skip
    }
  }
  return records;
}

async function clearChallengeTxtRecords(
  dnsClient: Alidns,
  rootDomain: string,
  challengeRecord: string
) {
  const deleted = new Set<string>();
  const records = await listChallengeTxtRecords(dnsClient, rootDomain, challengeRecord);
  for (const record of records) {
    if (!record.recordId || deleted.has(record.recordId)) continue;
    deleted.add(record.recordId);
    try {
      await withRetry(() => dnsClient.deleteDomainRecord(new $Alidns.DeleteDomainRecordRequest({ recordId: record.recordId })));
    } catch {
      // best-effort cleanup: stale challenge records are harmless
    }
  }
}

async function waitForChallengeTxtReady(
  dnsClient: Alidns,
  rootDomain: string,
  challengeRecord: string,
  expectedValue: string,
  spinner: Spinner
) {
  const timeoutMs = parsePropagationTimeoutMs(readLicellEnv(process.env, 'SSL_DNS_READY_TIMEOUT_MS'));
  const expectedNormalized = normalizeTxtValue(expectedValue);
  const waitStart = Date.now();
  while (true) {
    const records = await listChallengeTxtRecords(dnsClient, rootDomain, challengeRecord);
    const ready = records.some((record) => {
      if (typeof record.value !== 'string') return false;
      return normalizeTxtValue(record.value) === expectedNormalized;
    });
    if (ready) return;
    if (Date.now() - waitStart > timeoutMs) {
      throw new Error(`DNS TXT 记录传播超时: ${challengeRecord}.${rootDomain}`);
    }
    spinner.message(`🌍 正在等待 DNS 生效 (${challengeRecord})...`);
    await sleep(SSL_DNS_PROPAGATION_INTERVAL_MS);
  }
}

type DaysRemainingResolver = (certificatePem: string, nowMs?: number) => number | null;

interface IssueDecision {
  issue: boolean;
  message: string;
}

export function selectPreferredAcmeChallenge<T extends { type?: string }>(
  challenges: T[],
  challengePriority: string[] = ['dns-01']
): T | null {
  for (const preferredType of challengePriority) {
    const challenge = challenges.find((item) => item.type === preferredType);
    if (challenge) return challenge;
  }
  return null;
}

export async function runAcmeDns01Flow({
  client,
  domains,
  csr,
  email,
  preferredChain = null,
  spinner,
  skipChallengeVerification,
  totalTimeoutMs,
  labelPrefix = 'ACME dns-01',
  onChallengeCreate,
  onChallengeRemove
}: RunAcmeDns01FlowOptions) {
  const runStage = createAcmeStageRunner(totalTimeoutMs, labelPrefix);
  const cleanupTimeoutMs = Math.min(DEFAULT_SSL_CLEANUP_TIMEOUT_MS, Math.max(5_000, totalTimeoutMs));
  const accountPayload: {
    termsOfServiceAgreed: true;
    contact?: string[];
  } = { termsOfServiceAgreed: true };

  if (email) {
    accountPayload.contact = [`mailto:${email}`];
  }

  try {
    client.getAccountUrl();
    traceSsl(`${labelPrefix}/getAccountUrl: ok`);
  } catch {
    traceSsl(`${labelPrefix}/getAccountUrl: missing`);
    spinner.message('👤 未发现 ACME 账户，正在注册...');
    await runStage('createAccount', () => client.createAccount(accountPayload));
  }

  spinner.message(`📨 正在创建 ACME 订单（${domains.join(', ')}）...`);
  const order = await runStage('createOrder', () => client.createOrder({
    identifiers: domains.map((value) => ({ type: 'dns' as const, value }))
  }));

  spinner.message('🔎 正在获取域名授权挑战...');
  const authorizations = await runStage('getAuthorizations', () => client.getAuthorizations(order));

  for (const authz of authorizations) {
    const identifier = authz.identifier.value;
    if (authz.status === 'valid') {
      spinner.message(`✅ 域名授权已有效，跳过 challenge（${identifier}）`);
      continue;
    }

    const challenge = selectPreferredAcmeChallenge(authz.challenges, ['dns-01']);
    if (!challenge) {
      throw new Error(`${labelPrefix}/selectChallenge(${identifier}) 无可用 dns-01 challenge`);
    }

    let challengeSubmitted = false;
    const txtValue = await runStage(
      `getChallengeKeyAuthorization(${identifier})`,
      () => client.getChallengeKeyAuthorization(challenge)
    );

    try {
      spinner.message(`📝 正在配置 DNS TXT 记录（${identifier}）...`);
      await runStage(
        `challengeCreate(${identifier})`,
        () => onChallengeCreate(identifier, txtValue)
      );

      if (skipChallengeVerification) {
        spinner.message(`🌐 DNS TXT 已就绪，等待 Let's Encrypt 验证（${identifier}）...`);
      } else {
        spinner.message(`🔍 正在本地校验 ACME challenge（${identifier}）...`);
        await runStage(
          `verifyChallenge(${identifier})`,
          () => client.verifyChallenge(authz, challenge)
        );
      }

      spinner.message(`📬 正在提交 ACME challenge（${identifier}）...`);
      await runStage(
        `completeChallenge(${identifier})`,
        () => client.completeChallenge(challenge)
      );
      challengeSubmitted = true;

      spinner.message(`⏳ 正在等待 Let's Encrypt 验证通过（${identifier}）...`);
      await runStage(
        `waitForValidStatus(challenge:${identifier})`,
        () => client.waitForValidStatus(challenge)
      );
    } catch (error) {
      if (!challengeSubmitted) {
        try {
          await withTimeout(
            client.deactivateAuthorization(authz),
            cleanupTimeoutMs,
            `${labelPrefix}/deactivateAuthorization(${identifier})`
          );
        } catch (deactivateError) {
          spinner.message(`⚠️ ACME 授权停用失败（${identifier}）: ${formatUnknownError(deactivateError)}`);
        }
      }
      throw error;
    } finally {
      try {
        await withTimeout(
          onChallengeRemove(identifier, txtValue),
          cleanupTimeoutMs,
          `${labelPrefix}/challengeRemove(${identifier})`
        );
      } catch (cleanupError) {
        spinner.message(`⚠️ DNS TXT 清理失败（${identifier}）: ${formatUnknownError(cleanupError)}`);
      }
    }
  }

  spinner.message('📦 正在完成 ACME 订单...');
  const finalizedOrder = await runStage('finalizeOrder', () => client.finalizeOrder(order, csr));
  const validOrder = await runStage(
    'waitForValidStatus(order)',
    () => client.waitForValidStatus(finalizedOrder)
  );

  spinner.message('📥 正在下载证书链...');
  return runStage('getCertificate', () => client.getCertificate(validOrder, preferredChain));
}

export function shouldIssueNewCertificate(
  existingDomain: ExistingDomainLike | null,
  options: ResolvedIssueSslOptions,
  resolveDaysRemaining: DaysRemainingResolver = getCertificateDaysRemaining
): IssueDecision {
  if (!existingDomain || !hasHttpsProtocol(existingDomain.protocol)) {
    return {
      issue: true,
      message: '🔒 域名尚未开启 HTTPS，开始签发证书...'
    };
  }

  if (options.forceRenew) {
    return {
      issue: true,
      message: '🔁 已启用强制续签，开始重新签发 HTTPS 证书...'
    };
  }

  const certificate = existingDomain.certConfig?.certificate;
  if (typeof certificate !== 'string' || certificate.trim().length === 0) {
    return {
      issue: false,
      message: '🔐 域名已开启 HTTPS，但无法读取证书有效期，跳过自动续签（可用 --ssl-force-renew 强制续签）。'
    };
  }

  const daysRemaining = resolveDaysRemaining(certificate);
  if (daysRemaining === null) {
    return {
      issue: false,
      message: '🔐 域名已开启 HTTPS，但无法解析证书有效期，跳过自动续签（可用 --ssl-force-renew 强制续签）。'
    };
  }

  if (daysRemaining > options.renewBeforeDays) {
    return {
      issue: false,
      message: `🔐 域名已开启 HTTPS，证书${formatDaysRemaining(daysRemaining)}（续签阈值 ${options.renewBeforeDays} 天），跳过自动续签。`
    };
  }

  return {
    issue: true,
    message: `🔁 检测到证书${formatDaysRemaining(daysRemaining)}（续签阈值 ${options.renewBeforeDays} 天），开始自动续签...`
  };
}

export async function issueAndBindSSLWithArtifacts(
  domain: string,
  spinner: Spinner,
  options?: IssueSslOptions
): Promise<SslBindingArtifacts> {
  const auth = Config.requireAuth();
  const bindToFcDomain = options?.bindToFcDomain !== false;
  const dnsClient = new AlidnsClientCtor(new $OpenApi.Config({
    accessKeyId: auth.ak,
    accessKeySecret: auth.sk,
    endpoint: 'alidns.aliyuncs.com',
    connectTimeout: 10000,
    readTimeout: 600000
  }));
  const resolvedOptions: ResolvedIssueSslOptions = {
    forceRenew: Boolean(options?.forceRenew),
    renewBeforeDays: resolveRenewBeforeDays(options?.renewBeforeDays ?? readLicellEnv(process.env, 'SSL_RENEW_BEFORE_DAYS'))
  };
  // acme-client local DNS verification is vulnerable to recursive-resolver cache staleness.
  // Skip it by default and rely on CA-side validation; set LICELL_SSL_SKIP_CHALLENGE_VERIFY=0 to enable.
  const skipChallengeVerification = readLicellEnv(process.env, 'SSL_SKIP_CHALLENGE_VERIFY') !== '0';

  let existingDomain: ExistingDomainLike | null = null;

  if (bindToFcDomain) {
    try {
      existingDomain = await getFnCustomDomain(domain) as ExistingDomainLike | null;
    } catch {
      // best-effort: existing domain query may fail if domain not yet bound
    }
  }

  const decision = bindToFcDomain
    ? shouldIssueNewCertificate(existingDomain, resolvedOptions)
    : {
      issue: true,
      message: resolvedOptions.forceRenew
        ? '🔁 已启用强制续签，开始签发 CDN HTTPS 证书...'
        : '🔒 正在签发 CDN HTTPS 证书...'
    };
  spinner.message(decision.message);
  if (!decision.issue) {
    const certificate = typeof existingDomain?.certConfig?.certificate === 'string'
      ? existingDomain.certConfig.certificate
      : undefined;
    const privateKey = typeof existingDomain?.certConfig?.privateKey === 'string'
      ? existingDomain.certConfig.privateKey
      : undefined;
    return {
      url: `https://${domain}`,
      certificate: certificate?.trim() ? certificate : undefined,
      privateKey: privateKey?.trim() ? privateKey : undefined,
      reusedExistingCertificate: true
    };
  }

  const { rootDomain } = resolveAcmeChallengeRecord(domain);

  const acmeDirectoryUrl = resolveAcmeDirectoryUrl();
  const acmeDirectoryLabel = acmeDirectoryUrl === acme.directory.letsencrypt.staging ? "Let's Encrypt staging" : "Let's Encrypt";
  traceSsl(`ACME directory: ${acmeDirectoryUrl}`);
  spinner.message(`🔒 正在向 ${acmeDirectoryLabel} 注册 ACME 账户并发起证书申请...`);
  const { timeoutMs: acmeHttpTimeoutMs, retryMaxAttempts: acmeHttpRetryMaxAttempts } = configureAcmeHttpTimeout();
  const acmeAutoTimeoutMs = parseTimeoutMs(readLicellEnv(process.env, 'SSL_ACME_AUTO_TIMEOUT_MS'), DEFAULT_SSL_ACME_AUTO_TIMEOUT_MS);
  acme.setLogger(() => {});
  const accountKey = await getOrCreateAccountKey();
  const client = new acme.Client({
    directoryUrl: acmeDirectoryUrl,
    accountKey,
    backoffAttempts: 5,
    backoffMin: 3_000,
    backoffMax: 10_000
  });
  const [certKey, csr] = await acme.crypto.createCsr({ commonName: domain });
  spinner.message(`🔒 正在向 ${acmeDirectoryLabel} 注册 ACME 账户并发起证书申请（HTTP timeout=${acmeHttpTimeoutMs}ms, retry=${acmeHttpRetryMaxAttempts}）...`);

  const cert = await runAcmeDns01Flow({
    client,
    domains: [domain],
    csr,
    email: `admin@${rootDomain}`,
    spinner,
    skipChallengeVerification,
    totalTimeoutMs: acmeAutoTimeoutMs,
    labelPrefix: `ACME 证书签发(${domain})`,
    onChallengeCreate: async (identifier, txtValue) => {
      const { rootDomain: challengeRootDomain, challengeRecord } = resolveAcmeChallengeRecord(identifier);
      spinner.message(`📝 正在自动配置 DNS TXT 记录 (${challengeRecord}) ...`);
      await clearChallengeTxtRecords(dnsClient, challengeRootDomain, challengeRecord);
      await withRetry(() => dnsClient.addDomainRecord(new $Alidns.AddDomainRecordRequest({
        domainName: challengeRootDomain,
        RR: challengeRecord,
        type: 'TXT',
        value: txtValue,
        TTL: DEFAULT_ACME_TXT_TTL_SECONDS
      })));
      await waitForChallengeTxtReady(dnsClient, challengeRootDomain, challengeRecord, txtValue, spinner);
      spinner.message(`🌐 DNS TXT 已就绪，等待 Let's Encrypt 验证 (${challengeRecord}) ...`);
    },
    onChallengeRemove: async (identifier) => {
      const { rootDomain: challengeRootDomain, challengeRecord } = resolveAcmeChallengeRecord(identifier);
      await clearChallengeTxtRecords(dnsClient, challengeRootDomain, challengeRecord);
    }
  });

  const privateKeyPem = toFcPemPrivateKey(certKey);
  if (bindToFcDomain) {
    spinner.message('📦 证书下发成功，正在自动挂载至云端网关开启 HTTPS...');
    await updateFnCustomDomain(domain, {
      protocol: 'HTTP,HTTPS',
      certConfig: { certName: `licell-cert-${Date.now()}`, certificate: cert.toString(), privateKey: privateKeyPem }
    });
  } else {
    spinner.message('📦 证书下发成功，正在用于 CDN 边缘 HTTPS 配置...');
  }
  return {
    url: `https://${domain}`,
    certificate: cert.toString(),
    privateKey: privateKeyPem,
    reusedExistingCertificate: false
  };
}

export async function issueAndBindSSL(domain: string, spinner: Spinner, options?: IssueSslOptions) {
  const result = await issueAndBindSSLWithArtifacts(domain, spinner, options);
  return result.url;
}
