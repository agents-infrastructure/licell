import * as acme from 'acme-client';
import Alidns, * as $Alidns from '@alicloud/alidns20150109';
import * as $OpenApi from '@alicloud/openapi-client';
import { createHash, createPrivateKey, X509Certificate } from 'crypto';
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
import { getCdnDomainCertificateInfo, type CdnDomainCertificateInfo } from './cdn';
import { getFnCustomDomain, updateFnCustomDomain } from './fc/custom-domain';

const LICELL_GLOBAL_DIR = join(homedir(), '.licell-cli');
const ACME_STATE_DIR = join(LICELL_GLOBAL_DIR, 'acme');
const LEGACY_ACME_KEY_PATH = join(LICELL_GLOBAL_DIR, 'acme-account.pem');
const ZEROSSL_ACME_DIRECTORY_URL = acme.directory.zerossl.production || 'https://acme.zerossl.com/v2/DV90';
const ZEROSSL_EAB_EMAIL_API_URL = 'https://api.zerossl.com/acme/eab-credentials-email';
const ZEROSSL_EAB_ACCESS_KEY_API_URL = 'https://api.zerossl.com/acme/eab-credentials';
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
let acmeHttpConfigQueue: Promise<void> = Promise.resolve();

export type AcmeProviderName = 'letsencrypt' | 'letsencrypt-staging' | 'zerossl' | 'custom';

interface AcmeProviderSpec {
  name: AcmeProviderName;
  directoryUrl: string;
  label: string;
  accountKeyPath: string;
  useLegacyAccountKey?: boolean;
}

interface AcmeProviderConfig extends AcmeProviderSpec {
  externalAccountBinding?: {
    kid: string;
    hmacKey: string;
  };
}

interface AcmeHttpConfig {
  timeoutMs: number;
  retryMaxAttempts: number;
}

interface AcmeAxiosTransport {
  defaults: typeof acme.axios.defaults & {
    acmeSettings?: Record<string, unknown> & {
      retryMaxAttempts?: number;
    };
  };
}

interface ZeroSslExternalAccountBinding {
  kid: string;
  hmacKey: string;
  source: 'env' | 'cache' | 'api';
}

type ZeroSslEabLookupType = 'email' | 'accessKey';

interface ZeroSslEabCache {
  kid: string;
  hmacKey: string;
  lookupType: ZeroSslEabLookupType;
  lookupFingerprint: string;
  updatedAt: string;
}

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

interface LocalIssuedCertificateCache {
  domain: string;
  certificate: string;
  privateKey: string;
  updatedAt: string;
}

export interface ReusableCertificateDecision {
  source: 'cdn' | 'local-cache';
  updatedAt?: string;
  daysRemaining: number;
  certificate?: string;
  privateKey?: string;
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
  authorityLabel?: string;
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

function isFalseLikeEnv(value: string | undefined) {
  const normalized = value?.trim().toLowerCase();
  return normalized === '0' || normalized === 'false' || normalized === 'off' || normalized === 'no';
}

function hashText(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function resolveAcmeAccountKeyPath(name: AcmeProviderName, directoryUrl?: string) {
  switch (name) {
    case 'letsencrypt':
      return join(ACME_STATE_DIR, 'account-letsencrypt-production.pem');
    case 'letsencrypt-staging':
      return join(ACME_STATE_DIR, 'account-letsencrypt-staging.pem');
    case 'zerossl':
      return join(ACME_STATE_DIR, 'account-zerossl-production.pem');
    case 'custom':
      return join(ACME_STATE_DIR, `account-custom-${hashText(directoryUrl || 'custom').slice(0, 12)}.pem`);
    default:
      return join(ACME_STATE_DIR, 'account-acme.pem');
  }
}

function createLetsEncryptProductionProviderSpec(): AcmeProviderSpec {
  return {
    name: 'letsencrypt',
    directoryUrl: acme.directory.letsencrypt.production,
    label: "Let's Encrypt",
    accountKeyPath: resolveAcmeAccountKeyPath('letsencrypt'),
    useLegacyAccountKey: true
  };
}

function createLetsEncryptStagingProviderSpec(): AcmeProviderSpec {
  return {
    name: 'letsencrypt-staging',
    directoryUrl: acme.directory.letsencrypt.staging,
    label: "Let's Encrypt staging",
    accountKeyPath: resolveAcmeAccountKeyPath('letsencrypt-staging')
  };
}

function createZeroSslProviderSpec(): AcmeProviderSpec {
  return {
    name: 'zerossl',
    directoryUrl: ZEROSSL_ACME_DIRECTORY_URL,
    label: 'ZeroSSL',
    accountKeyPath: resolveAcmeAccountKeyPath('zerossl')
  };
}

function createCustomAcmeProviderSpec(directoryUrl: string): AcmeProviderSpec {
  return {
    name: 'custom',
    directoryUrl,
    label: 'Custom ACME',
    accountKeyPath: resolveAcmeAccountKeyPath('custom', directoryUrl)
  };
}

function resolvePrimaryAcmeProviderSpec(env: Record<string, string | undefined> = process.env): AcmeProviderSpec {
  const rawValue = readLicellEnv(env, 'SSL_ACME_DIRECTORY')?.trim();
  const value = rawValue?.toLowerCase();
  if (!value || value === 'production' || value === 'prod' || value === 'letsencrypt' || value === 'letsencrypt-production') {
    return createLetsEncryptProductionProviderSpec();
  }
  if (value === 'staging' || value === 'stage' || value === 'letsencrypt-staging') {
    return createLetsEncryptStagingProviderSpec();
  }
  if (value === 'zerossl') {
    return createZeroSslProviderSpec();
  }
  if (rawValue && (rawValue.startsWith('https://') || rawValue.startsWith('http://'))) {
    return createCustomAcmeProviderSpec(rawValue);
  }
  throw new Error(`无效的 ACME directory 配置: ${rawValue || value}`);
}

export function resolveAcmeProviderPlan(env: Record<string, string | undefined> = process.env): AcmeProviderSpec[] {
  const primary = resolvePrimaryAcmeProviderSpec(env);
  if (primary.name === 'letsencrypt' && !isFalseLikeEnv(readLicellEnv(env, 'SSL_ZEROSSL_FALLBACK'))) {
    return [primary, createZeroSslProviderSpec()];
  }
  return [primary];
}

export function resolveAcmeDirectoryUrl(env: Record<string, string | undefined> = process.env) {
  return resolvePrimaryAcmeProviderSpec(env).directoryUrl;
}

function configureAcmeHttpTimeout() {
  const timeoutMs = parseTimeoutMs(readLicellEnv(process.env, 'SSL_ACME_HTTP_TIMEOUT_MS'), DEFAULT_SSL_ACME_HTTP_TIMEOUT_MS);
  const retryMaxAttempts = parseNonNegativeInt(
    readLicellEnv(process.env, 'SSL_ACME_HTTP_RETRY_MAX_ATTEMPTS'),
    DEFAULT_SSL_ACME_HTTP_RETRY_MAX_ATTEMPTS
  );
  return { timeoutMs, retryMaxAttempts };
}

async function withScopedAcmeHttpConfig<T>(
  config: AcmeHttpConfig,
  action: () => Promise<T>,
  transport: AcmeAxiosTransport = acme.axios as AcmeAxiosTransport
): Promise<T> {
  const previous = acmeHttpConfigQueue;
  let release: (() => void) | undefined;
  acmeHttpConfigQueue = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous.catch(() => {});

  const previousTimeout = transport.defaults.timeout;
  const previousAcmeSettings = transport.defaults.acmeSettings
    ? { ...transport.defaults.acmeSettings }
    : undefined;

  transport.defaults.timeout = config.timeoutMs;
  transport.defaults.acmeSettings = {
    ...(transport.defaults.acmeSettings || {}),
    retryMaxAttempts: config.retryMaxAttempts
  };

  try {
    return await action();
  } finally {
    transport.defaults.timeout = previousTimeout;
    if (previousAcmeSettings) {
      transport.defaults.acmeSettings = previousAcmeSettings;
    } else {
      delete transport.defaults.acmeSettings;
    }
    release?.();
  }
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

function collectErrorDetails(error: unknown, depth = 0, seen = new Set<unknown>()): string[] {
  if (error == null || depth > 4 || seen.has(error)) return [];
  if (typeof error === 'string') return [error];
  if (error instanceof Error) {
    seen.add(error);
    return [error.message, error.name, ...collectErrorDetails((error as Error & { cause?: unknown }).cause, depth + 1, seen)];
  }
  if (typeof error === 'object') {
    seen.add(error);
    const record = error as Record<string, unknown>;
    const fields = [record.message, record.code, record.type, record.detail, record.status]
      .filter((value): value is string | number => typeof value === 'string' || typeof value === 'number')
      .map(String);
    return [
      ...fields,
      ...collectErrorDetails(record.cause, depth + 1, seen),
      ...collectErrorDetails(record.response, depth + 1, seen),
      ...collectErrorDetails(record.data, depth + 1, seen),
      ...collectErrorDetails(record.error, depth + 1, seen)
    ];
  }
  return [String(error)];
}

export function isAcmeRateLimitedError(error: unknown) {
  const details = collectErrorDetails(error).join(' | ').toLowerCase();
  return details.includes('urn:ietf:params:acme:error:ratelimited')
    || details.includes('rate limited')
    || details.includes('rate limit')
    || details.includes('too many certificates')
    || details.includes('too many failed authorizations')
    || details.includes('too many new orders')
    || details.includes('too many requests');
}

function isTransientNetworkError(error: unknown) {
  const message = collectErrorDetails(error).join(' | ').toLowerCase();
  return message.includes('timeout')
    || message.includes('超时')
    || message.includes('timed out')
    || message.includes('econnaborted')
    || message.includes('econnreset')
    || message.includes('enotfound')
    || message.includes('eai_again')
    || message.includes('socket hang up')
    || message.includes('network');
}

function isAcmeProviderAvailabilityError(error: unknown) {
  const details = collectErrorDetails(error).join(' | ').toLowerCase();
  if (!isTransientNetworkError(error)) return false;
  return details.includes('/createorder')
    || details.includes('/createaccount')
    || details.includes('/getauthorizations')
    || details.includes('/finalizeorder')
    || details.includes('/getcertificate')
    || details.includes('acme-v02.api.letsencrypt.org')
    || details.includes('acme.zerossl.com');
}

function isAcmeFallbackEligibleError(error: unknown) {
  return isAcmeRateLimitedError(error) || isAcmeProviderAvailabilityError(error);
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

function isAcmeHttpStageLabel(stageLabel: string) {
  const normalized = stageLabel.toLowerCase();
  return normalized.endsWith('/createaccount')
    || normalized.endsWith('/createorder')
    || normalized.endsWith('/getauthorizations')
    || normalized.endsWith('/finalizeorder')
    || normalized.endsWith('/getcertificate');
}

function normalizeAcmeStageError(stageLabel: string, error: unknown) {
  if (error instanceof Error && error.message.startsWith(stageLabel)) {
    return error;
  }
  const message = formatUnknownError(error);
  const normalized = message.toLowerCase();
  if (
    isAcmeHttpStageLabel(stageLabel)
    && normalized.includes("cannot read properties of undefined (reading 'config')")
  ) {
    return new Error(
      `${stageLabel}: ACME transport 未返回有效响应（可能是 HTTP timeout / 网络抖动; acme-client returned undefined response）`
    );
  }
  return new Error(`${stageLabel}: ${message}`);
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
      const normalizedError = normalizeAcmeStageError(stageLabel, error);
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

function readJsonFile<T>(filePath: string): T | null {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, 'utf8')) as T;
  } catch {
    return null;
  }
}

function writeSecureFile(filePath: string, content: string | Buffer) {
  ensureSecureDir(dirname(filePath));
  writeFileSync(filePath, content, { mode: 0o600 });
}

function writeSecureJsonFile(filePath: string, data: unknown) {
  writeSecureFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

export function resolveIssuedCertificateCachePath(domain: string) {
  const normalizedDomain = normalizeAcmeIdentifierDomain(domain);
  return join(ACME_STATE_DIR, 'issued-certs', `${hashText(normalizedDomain)}.json`);
}

function readIssuedCertificateCache(domain: string, cachePath?: string): LocalIssuedCertificateCache | null {
  const cache = readJsonFile<LocalIssuedCertificateCache>(cachePath || resolveIssuedCertificateCachePath(domain));
  if (!cache) return null;
  if (typeof cache.domain !== 'string' || typeof cache.certificate !== 'string' || typeof cache.privateKey !== 'string') {
    return null;
  }
  if (!cache.domain.trim() || !cache.certificate.trim() || !cache.privateKey.trim()) return null;
  return {
    domain: cache.domain.trim().toLowerCase(),
    certificate: cache.certificate.trim(),
    privateKey: cache.privateKey.trim(),
    updatedAt: typeof cache.updatedAt === 'string' ? cache.updatedAt : ''
  };
}

export function writeIssuedCertificateCache(
  domain: string,
  certificate: string,
  privateKey: string,
  cachePath?: string
) {
  const normalizedDomain = normalizeAcmeIdentifierDomain(domain);
  writeSecureJsonFile(cachePath || resolveIssuedCertificateCachePath(normalizedDomain), {
    domain: normalizedDomain,
    certificate: certificate.trim(),
    privateKey: privateKey.trim(),
    updatedAt: new Date().toISOString()
  } satisfies LocalIssuedCertificateCache);
}

export function resolveReusableLocalCertificate(
  domain: string,
  options: ResolvedIssueSslOptions,
  nowMs = Date.now(),
  cachePath?: string
) {
  if (options.forceRenew) return null;
  const cached = readIssuedCertificateCache(domain, cachePath);
  if (!cached) return null;
  const daysRemaining = getCertificateDaysRemaining(cached.certificate, nowMs);
  if (daysRemaining === null || daysRemaining <= options.renewBeforeDays) return null;
  return {
    source: 'local-cache' as const,
    certificate: cached.certificate,
    privateKey: cached.privateKey,
    updatedAt: cached.updatedAt,
    daysRemaining
  };
}

function parseCertificateExpiryMs(value?: string) {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function toDaysRemainingFromExpiryMs(expiryMs: number, nowMs = Date.now()) {
  return Math.floor((expiryMs - nowMs) / DAY_MS);
}

export function resolveReusableCdnCertificate(
  info: CdnDomainCertificateInfo | null | undefined,
  options: ResolvedIssueSslOptions,
  nowMs = Date.now()
): ReusableCertificateDecision | null {
  if (options.forceRenew) return null;
  if (!info) return null;
  if (info.serverCertificateStatus !== 'on' && info.serverCertificateStatus !== 'enabled') return null;
  const expiryMs = parseCertificateExpiryMs(info.certExpireTime);
  if (expiryMs === null) return null;
  const daysRemaining = toDaysRemainingFromExpiryMs(expiryMs, nowMs);
  if (daysRemaining <= options.renewBeforeDays) return null;
  return {
    source: 'cdn',
    updatedAt: info.certUpdateTime,
    daysRemaining
  };
}

interface ResolveZeroSslExternalAccountBindingOptions {
  env?: Record<string, string | undefined>;
  email?: string;
  fetchImpl?: typeof fetch;
  cachePath?: string;
}

function readZeroSslEabCache(cachePath: string) {
  const cache = readJsonFile<ZeroSslEabCache>(cachePath);
  if (!cache) return null;
  if (typeof cache.kid !== 'string' || typeof cache.hmacKey !== 'string' || typeof cache.lookupType !== 'string' || typeof cache.lookupFingerprint !== 'string') return null;
  if (!cache.kid.trim() || !cache.hmacKey.trim() || !cache.lookupFingerprint.trim()) return null;
  if (cache.lookupType !== 'email' && cache.lookupType !== 'accessKey') return null;
  return cache;
}

function extractZeroSslApiErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;
  const direct = typeof record.message === 'string' ? record.message.trim() : '';
  if (direct) return direct;
  const error = record.error;
  if (!error || typeof error !== 'object') return null;
  const errorRecord = error as Record<string, unknown>;
  const parts = [errorRecord.code, errorRecord.type, errorRecord.message, errorRecord.details]
    .flatMap((item) => Array.isArray(item) ? item : [item])
    .map((item) => typeof item === 'string' ? item.trim() : typeof item === 'number' ? String(item) : '')
    .filter(Boolean);
  return parts.length > 0 ? parts.join(' / ') : null;
}


interface ZeroSslEabLookup {
  type: ZeroSslEabLookupType;
  fingerprint: string;
  fetch: () => Promise<Response>;
}

function createZeroSslEmailLookup(email: string, fetchImpl: typeof fetch): ZeroSslEabLookup {
  return {
    type: 'email',
    fingerprint: hashText(email.trim().toLowerCase()),
    fetch: () => fetchImpl(ZEROSSL_EAB_EMAIL_API_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: `email=${encodeURIComponent(email.trim())}`
    })
  };
}

function createZeroSslAccessKeyLookup(accessKey: string, fetchImpl: typeof fetch): ZeroSslEabLookup {
  const requestUrl = new URL(ZEROSSL_EAB_ACCESS_KEY_API_URL);
  requestUrl.searchParams.set('access_key', accessKey);
  return {
    type: 'accessKey',
    fingerprint: hashText(accessKey),
    fetch: () => fetchImpl(requestUrl.toString(), {
      method: 'POST',
      headers: { accept: 'application/json' }
    })
  };
}

async function fetchZeroSslEabCredentials(lookup: ZeroSslEabLookup) {
  const response = await withRetry(
    async () => {
      const res = await lookup.fetch();
      if (res.status >= 500) {
        throw new Error(`ZeroSSL EAB API 返回 ${res.status}`);
      }
      return res;
    },
    {
      maxAttempts: 3,
      baseDelayMs: 1000,
      shouldRetry: (error) => isTransientNetworkError(error) || /返回 5\d\d/.test(formatUnknownError(error))
    }
  );

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const apiMessage = extractZeroSslApiErrorMessage(payload);
    throw new Error(apiMessage ? `ZeroSSL EAB 获取失败: ${apiMessage}` : `ZeroSSL EAB 获取失败: HTTP ${response.status}`);
  }

  const body = payload as Record<string, unknown> | null;
  const kid = typeof body?.eab_kid === 'string' ? body.eab_kid.trim() : '';
  const hmacKey = typeof body?.eab_hmac_key === 'string' ? body.eab_hmac_key.trim() : '';
  if (!kid || !hmacKey) {
    throw new Error('ZeroSSL EAB 获取失败：响应中缺少 eab_kid 或 eab_hmac_key');
  }

  return { kid, hmacKey };
}

export async function resolveZeroSslExternalAccountBinding({
  env = process.env,
  email,
  fetchImpl = fetch,
  cachePath = join(ACME_STATE_DIR, 'zerossl-eab.json')
}: ResolveZeroSslExternalAccountBindingOptions = {}): Promise<ZeroSslExternalAccountBinding> {
  const envKid = readLicellEnv(env, 'SSL_ZEROSSL_EAB_KID')?.trim();
  const envHmacKey = readLicellEnv(env, 'SSL_ZEROSSL_EAB_HMAC_KEY')?.trim();
  if (envKid && envHmacKey) {
    return { kid: envKid, hmacKey: envHmacKey, source: 'env' };
  }
  if (envKid || envHmacKey) {
    throw new Error('ZeroSSL EAB 环境变量不完整：请同时设置 LICELL_SSL_ZEROSSL_EAB_KID 和 LICELL_SSL_ZEROSSL_EAB_HMAC_KEY');
  }

  const accessKey = readLicellEnv(env, 'SSL_ZEROSSL_ACCESS_KEY')?.trim();
  const normalizedEmail = email?.trim();
  const lookup = accessKey
    ? createZeroSslAccessKeyLookup(accessKey, fetchImpl)
    : normalizedEmail
      ? createZeroSslEmailLookup(normalizedEmail, fetchImpl)
      : null;

  if (!lookup) {
    throw new Error('ZeroSSL fallback 需要可用的账户邮箱，或显式设置 LICELL_SSL_ZEROSSL_ACCESS_KEY / LICELL_SSL_ZEROSSL_EAB_KID / LICELL_SSL_ZEROSSL_EAB_HMAC_KEY');
  }

  const cached = readZeroSslEabCache(cachePath);
  if (cached && cached.lookupType === lookup.type && cached.lookupFingerprint === lookup.fingerprint) {
    return { kid: cached.kid, hmacKey: cached.hmacKey, source: 'cache' };
  }

  const { kid, hmacKey } = await fetchZeroSslEabCredentials(lookup);
  writeSecureJsonFile(cachePath, {
    kid,
    hmacKey,
    lookupType: lookup.type,
    lookupFingerprint: lookup.fingerprint,
    updatedAt: new Date().toISOString()
  } satisfies ZeroSslEabCache);
  return { kid, hmacKey, source: 'api' };
}

async function resolveAcmeProviderConfig(
  provider: AcmeProviderSpec,
  env: Record<string, string | undefined> = process.env,
  email?: string
): Promise<AcmeProviderConfig> {
  if (provider.name !== 'zerossl') return provider;
  const binding = await resolveZeroSslExternalAccountBinding({ env, email });
  return {
    ...provider,
    externalAccountBinding: { kid: binding.kid, hmacKey: binding.hmacKey }
  };
}

async function getOrCreateAccountKey(provider: AcmeProviderSpec): Promise<Buffer> {
  if (existsSync(provider.accountKeyPath)) {
    return readFileSync(provider.accountKeyPath);
  }
  ensureSecureDir(dirname(provider.accountKeyPath));
  if (provider.useLegacyAccountKey && existsSync(LEGACY_ACME_KEY_PATH)) {
    const legacyKey = readFileSync(LEGACY_ACME_KEY_PATH);
    writeSecureFile(provider.accountKeyPath, legacyKey);
    return legacyKey;
  }
  const key = await acme.crypto.createPrivateKey();
  writeSecureFile(provider.accountKeyPath, key);
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
  authorityLabel = 'ACME CA',
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
    spinner.message(`👤 未发现 ${authorityLabel} ACME 账户，正在注册...`);
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
        spinner.message(`🌐 DNS TXT 已就绪，等待 ${authorityLabel} 验证（${identifier}）...`);
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

      spinner.message(`⏳ 正在等待 ${authorityLabel} 验证通过（${identifier}）...`);
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

interface IssueAcmeCertificateWithFallbackOptions {
  domain: string;
  email?: string;
  spinner: Spinner;
  providers: AcmeProviderSpec[];
  skipChallengeVerification: boolean;
  totalTimeoutMs: number;
  acmeHttpTimeoutMs: number;
  acmeHttpRetryMaxAttempts: number;
  onChallengeCreate: (provider: AcmeProviderConfig, domain: string, txtValue: string) => Promise<void>;
  onChallengeRemove: (provider: AcmeProviderConfig, domain: string, txtValue: string) => Promise<void>;
  createCsr?: (data: { commonName: string }) => Promise<[Buffer, Buffer]>;
  resolveProvider?: (provider: AcmeProviderSpec, context: { email?: string }) => Promise<AcmeProviderConfig>;
  getAccountKey?: (provider: AcmeProviderConfig) => Promise<Buffer>;
  createClient?: (provider: AcmeProviderConfig, accountKey: Buffer) => AcmeClientLike;
  runFlow?: (options: RunAcmeDns01FlowOptions) => Promise<string>;
}

export async function issueAcmeCertificateWithFallback({
  domain,
  email,
  spinner,
  providers,
  skipChallengeVerification,
  totalTimeoutMs,
  acmeHttpTimeoutMs,
  acmeHttpRetryMaxAttempts,
  onChallengeCreate,
  onChallengeRemove,
  createCsr,
  resolveProvider,
  getAccountKey,
  createClient,
  runFlow
}: IssueAcmeCertificateWithFallbackOptions) {
  const createCsrImpl = createCsr ?? ((data: { commonName: string }) => acme.crypto.createCsr(data));
  const resolveProviderImpl = resolveProvider ?? ((provider: AcmeProviderSpec, context: { email?: string }) => resolveAcmeProviderConfig(provider, process.env, context.email));
  const getAccountKeyImpl = getAccountKey ?? ((provider: AcmeProviderConfig) => getOrCreateAccountKey(provider));
  const createClientImpl = createClient ?? ((provider: AcmeProviderConfig, accountKey: Buffer) => new acme.Client({
    directoryUrl: provider.directoryUrl,
    accountKey,
    externalAccountBinding: provider.externalAccountBinding,
    backoffAttempts: 5,
    backoffMin: 3_000,
    backoffMax: 10_000
  }) as unknown as AcmeClientLike);
  const runFlowImpl = runFlow ?? runAcmeDns01Flow;
  const providerCache = new Map<string, Promise<AcmeProviderConfig>>();
  const resolveProviderCached = (provider: AcmeProviderSpec) => {
    const cacheKey = `${provider.name}:${provider.directoryUrl}`;
    let cached = providerCache.get(cacheKey);
    if (!cached) {
      cached = Promise.resolve().then(() => resolveProviderImpl(provider, { email }));
      providerCache.set(cacheKey, cached);
    }
    return cached;
  };

  acme.setLogger(() => {});
  const [certKey, csr] = await createCsrImpl({ commonName: domain });
  let lastError: unknown;
  return withScopedAcmeHttpConfig(
    {
      timeoutMs: acmeHttpTimeoutMs,
      retryMaxAttempts: acmeHttpRetryMaxAttempts
    },
    async () => {
      for (let index = 0; index < providers.length; index += 1) {
        const providerSpec = providers[index];
        const provider = await resolveProviderCached(providerSpec);
        traceSsl(`ACME provider attempt: ${provider.label} (${provider.directoryUrl})`);
        spinner.message(`🔒 正在向 ${provider.label} 注册 ACME 账户并发起证书申请...`);
        const accountKey = await getAccountKeyImpl(provider);
        const client = createClientImpl(provider, accountKey);
        spinner.message(`🔒 正在向 ${provider.label} 注册 ACME 账户并发起证书申请（HTTP timeout=${acmeHttpTimeoutMs}ms, retry=${acmeHttpRetryMaxAttempts}）...`);

        try {
          const cert = await runFlowImpl({
            client,
            domains: [domain],
            csr,
            email,
            spinner,
            skipChallengeVerification,
            totalTimeoutMs,
            labelPrefix: `ACME 证书签发(${provider.label}/${domain})`,
            authorityLabel: provider.label,
            onChallengeCreate: (identifier, txtValue) => onChallengeCreate(provider, identifier, txtValue),
            onChallengeRemove: (identifier, txtValue) => onChallengeRemove(provider, identifier, txtValue)
          });
          return { provider, cert: cert.toString(), certKey };
        } catch (error) {
          lastError = error;
          const nextProviderSpec = providers[index + 1];
          if (!nextProviderSpec || !isAcmeFallbackEligibleError(error)) {
            throw error;
          }
          try {
            await resolveProviderCached(nextProviderSpec);
          } catch (fallbackError) {
            const reason = isAcmeRateLimitedError(error) ? '触发证书签发限额' : '请求超时或暂时不可用';
            throw new Error(`${provider.label} ${reason}，且无法切换到 ${nextProviderSpec.label}: ${formatUnknownError(fallbackError)}；原始错误: ${formatUnknownError(error)}`);
          }
          const fallbackReason = isAcmeRateLimitedError(error)
            ? `${provider.label} 触发签发限额`
            : `${provider.label} 请求超时或暂时不可用`;
          spinner.message(`⚠️ ${fallbackReason}，正在切换到 ${nextProviderSpec.label} 继续申请...`);
          traceSsl(`ACME fallback: ${provider.label} -> ${nextProviderSpec.label}; reason=${formatUnknownError(error)}`);
        }
      }

      throw (lastError instanceof Error ? lastError : new Error('ACME 证书签发失败'));
    }
  );
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

  if (!bindToFcDomain) {
    let reusableCertificate = null as ReusableCertificateDecision | null;
    try {
      reusableCertificate = resolveReusableCdnCertificate(
        await getCdnDomainCertificateInfo(domain),
        resolvedOptions
      );
    } catch {
      // best-effort: CDN detail lookup failure should not block ACME fallback
    }
    if (!reusableCertificate) {
      reusableCertificate = resolveReusableLocalCertificate(domain, resolvedOptions);
    }
    if (reusableCertificate) {
      spinner.message(
        reusableCertificate.source === 'cdn'
          ? `🔐 CDN 边缘 HTTPS 证书仍有效（剩余 ${reusableCertificate.daysRemaining} 天），跳过重复签发。`
          : `🔐 复用本机缓存的 CDN HTTPS 证书（剩余 ${reusableCertificate.daysRemaining} 天），跳过重复签发。`
      );
      return {
        url: `https://${domain}`,
        ...(reusableCertificate.certificate ? { certificate: reusableCertificate.certificate } : {}),
        ...(reusableCertificate.privateKey ? { privateKey: reusableCertificate.privateKey } : {}),
        reusedExistingCertificate: true
      };
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
  const acmeProviders = resolveAcmeProviderPlan();
  traceSsl(`ACME provider plan: ${acmeProviders.map((item) => `${item.label}<${item.directoryUrl}>`).join(' -> ')}`);
  const { timeoutMs: acmeHttpTimeoutMs, retryMaxAttempts: acmeHttpRetryMaxAttempts } = configureAcmeHttpTimeout();
  const acmeAutoTimeoutMs = parseTimeoutMs(readLicellEnv(process.env, 'SSL_ACME_AUTO_TIMEOUT_MS'), DEFAULT_SSL_ACME_AUTO_TIMEOUT_MS);

  const { cert, certKey } = await issueAcmeCertificateWithFallback({
    domain,
    email: `admin@${rootDomain}`,
    spinner,
    providers: acmeProviders,
    skipChallengeVerification,
    totalTimeoutMs: acmeAutoTimeoutMs,
    acmeHttpTimeoutMs,
    acmeHttpRetryMaxAttempts,
    onChallengeCreate: async (provider, identifier, txtValue) => {
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
      spinner.message(`🌐 DNS TXT 已就绪，等待 ${provider.label} 验证 (${challengeRecord}) ...`);
    },
    onChallengeRemove: async (_provider, identifier) => {
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
  writeIssuedCertificateCache(domain, cert.toString(), privateKeyPem);
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
