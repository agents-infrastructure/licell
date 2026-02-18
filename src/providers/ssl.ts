import * as acme from 'acme-client';
import Alidns, * as $Alidns from '@alicloud/alidns20150109';
import * as $FC from '@alicloud/fc20230330';
import * as $OpenApi from '@alicloud/openapi-client';
import { createPrivateKey, X509Certificate } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { homedir } from 'os';
import { Config } from '../utils/config';
import { parseRootAndSubdomain } from '../utils/domain';
import type { Spinner } from '../utils/errors';
import { sleep } from '../utils/runtime';
import { withRetry } from '../utils/retry';
import { createSharedFcClient, resolveSdkCtor } from '../utils/sdk';
import { readLicellEnv } from '../utils/env';

const ACME_KEY_PATH = join(homedir(), '.licell-cli', 'acme-account.pem');
const AlidnsClientCtor = resolveSdkCtor<Alidns>(Alidns, '@alicloud/alidns20150109');
const DAY_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_SSL_RENEW_BEFORE_DAYS = 30;
const DEFAULT_SSL_DNS_PROPAGATION_TIMEOUT_MS = 180_000;
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
  };
}

interface IssueSslOptions {
  forceRenew?: boolean;
  renewBeforeDays?: number;
}

export interface ResolvedIssueSslOptions {
  forceRenew: boolean;
  renewBeforeDays: number;
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
  mkdirSync(dirname(ACME_KEY_PATH), { recursive: true });
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
    } catch { /* some candidate subDomain formats may not exist, safe to skip */ }
  }
  return records;
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

export async function issueAndBindSSL(domain: string, spinner: Spinner, options?: IssueSslOptions) {
  const auth = Config.requireAuth();
  const dnsClient = new AlidnsClientCtor(new $OpenApi.Config({
    accessKeyId: auth.ak,
    accessKeySecret: auth.sk,
    endpoint: 'alidns.aliyuncs.com',
    connectTimeout: 10000,
    readTimeout: 600000
  }));
  const fcClient = createSharedFcClient(auth).client;
  const resolvedOptions: ResolvedIssueSslOptions = {
    forceRenew: Boolean(options?.forceRenew),
    renewBeforeDays: resolveRenewBeforeDays(options?.renewBeforeDays ?? readLicellEnv(process.env, 'SSL_RENEW_BEFORE_DAYS'))
  };
  // acme-client local DNS verification is vulnerable to recursive-resolver cache staleness.
  // Skip it by default and rely on CA-side validation; set LICELL_SSL_SKIP_CHALLENGE_VERIFY=0 to enable.
  const skipChallengeVerification = readLicellEnv(process.env, 'SSL_SKIP_CHALLENGE_VERIFY') !== '0';

  let existingDomain: ExistingDomainLike | null = null;

  try {
    const existingDomainResponse = await withRetry(() => fcClient.getCustomDomain(domain));
    existingDomain = existingDomainResponse.body as ExistingDomainLike;
  } catch { /* best-effort: existing domain query may fail if domain not yet bound */ }

  const decision = shouldIssueNewCertificate(existingDomain, resolvedOptions);
  spinner.message(decision.message);
  if (!decision.issue) return `https://${domain}`;

  const { rootDomain, subDomain } = parseRootAndSubdomain(domain);
  const recordIds: string[] = [];

  spinner.message('🔒 正在向 Let\'s Encrypt 注册 ACME 账户并发起证书申请...');
  acme.setLogger(() => {});
  const accountKey = await getOrCreateAccountKey();
  const client = new acme.Client({ directoryUrl: acme.directory.letsencrypt.production, accountKey });
  const [certKey, csr] = await acme.crypto.createCsr({ commonName: domain });

  const clearChallengeTxtRecords = async (challengeRecord: string) => {
    const deleted = new Set<string>();
    const records = await listChallengeTxtRecords(dnsClient, rootDomain, challengeRecord);
    for (const record of records) {
      if (!record.recordId || deleted.has(record.recordId)) continue;
      deleted.add(record.recordId);
      try {
        await withRetry(() => dnsClient.deleteDomainRecord(new $Alidns.DeleteDomainRecordRequest({ recordId: record.recordId })));
      } catch { /* best-effort cleanup: stale challenge records are harmless */ }
    }
  };

  const cert = await client.auto({
    csr,
    email: `admin@${rootDomain}`,
    termsOfServiceAgreed: true,
    challengePriority: ['dns-01'],
    skipChallengeVerification,
    challengeCreateFn: async (_authz: any, _challenge: any, keyAuthorization: string) => {
      const challengeRecord = subDomain === '@' ? '_acme-challenge' : `_acme-challenge.${subDomain}`;
      // acme-client already returns DNS-01 keyAuthorization in TXT-ready format.
      const txtValue = keyAuthorization;
      spinner.message(`📝 正在自动配置 DNS TXT 记录 (${challengeRecord}) ...`);
      await clearChallengeTxtRecords(challengeRecord);
      const addRecordRes = await withRetry(() => dnsClient.addDomainRecord(new $Alidns.AddDomainRecordRequest({
        domainName: rootDomain,
        RR: challengeRecord,
        type: 'TXT',
        value: txtValue,
        TTL: DEFAULT_ACME_TXT_TTL_SECONDS
      })));
      if (addRecordRes.body?.recordId) recordIds.push(addRecordRes.body.recordId);
      await waitForChallengeTxtReady(dnsClient, rootDomain, challengeRecord, txtValue, spinner);
      spinner.message(`🌐 DNS TXT 已就绪，等待 Let's Encrypt 验证 (${challengeRecord}) ...`);
    },
    challengeRemoveFn: async () => {
      for (const recordId of recordIds) {
        try {
          await withRetry(() => dnsClient.deleteDomainRecord(new $Alidns.DeleteDomainRecordRequest({ recordId })));
        } catch (cleanupErr: unknown) {
          const msg = cleanupErr instanceof Error ? cleanupErr.message : String(cleanupErr);
          if (!msg.toLowerCase().includes('notfound') && !msg.toLowerCase().includes('not found')) {
            spinner.message(`⚠️ DNS TXT 记录清理失败 (recordId=${recordId}): ${msg}`);
          }
        }
      }
    }
  });

  spinner.message('📦 证书下发成功，正在自动挂载至云端网关开启 HTTPS...');
  await withRetry(() => fcClient.updateCustomDomain(domain, new $FC.UpdateCustomDomainRequest({
    body: new $FC.UpdateCustomDomainInput({
      protocol: 'HTTP,HTTPS',
      certConfig: { certName: `licell-cert-${Date.now()}`, certificate: cert.toString(), privateKey: toFcPemPrivateKey(certKey) }
    })
  })));
  return `https://${domain}`;
}
