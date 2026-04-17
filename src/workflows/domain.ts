import { Config } from '../utils/config';
import type { Spinner } from '../utils/errors';
import { ensureDomainCname, normalizeDnsValue, removeDomainCname, waitForAuthoritativeCnameTarget } from '../providers/dns';
import { enableCdnForDomain, removeCdnDomain } from '../providers/cdn';
import {
  DEFAULT_SSL_RENEW_BEFORE_DAYS,
  issueAndBindSSLWithArtifacts,
  resolveRenewBeforeDays,
  shouldIssueNewCertificate
} from '../providers/ssl';
import { getOssBucketInfo, resolveOssBucketName, resolveOssBucketOriginDomain } from '../providers/oss';
import {
  getFnCustomDomain,
  publishFunctionVersion,
  promoteFunctionAlias,
  removeFnCustomDomain,
  resolveDefaultFcGatewayDomain,
  upsertFnCustomDomain
} from '../providers/fc';
import { getLatestPublishedVersionId, isNoChangesPublishError } from '../utils/cli-shared';
import { readLicellEnv } from '../utils/env';

export interface BindCustomDomainOptions {
  skipDnsBind?: boolean;
  functionName?: string;
  path?: string;
  protocol?: string;
}

export interface BindAppDomainWorkflowOptions {
  releaseTarget?: string;
  functionName?: string;
  ensureAlias?: boolean;
  enableCdn?: boolean;
  enableHttps?: boolean;
  forceSslRenew?: boolean;
  spinner?: Spinner;
}

export interface BindAppDomainWorkflowResult {
  domainName: string;
  functionName: string;
  releaseTarget?: string;
  targetFcDomain: string;
  aliasEnsured: boolean;
  aliasVersionId?: string;
  cdnEnabled: boolean;
  cdnCname?: string;
  domainHttpsConfigured: boolean;
  edgeHttpsConfigured: boolean;
  httpsConfigured: boolean;
  finalUrl: string;
}

export interface UnbindAppDomainWorkflowResult {
  domainName: string;
  removedCdnDomain: boolean;
  removedCustomDomain: boolean;
  removedDnsRecordIds: string[];
}

async function ensureReleaseTargetAlias(functionName: string, releaseTarget: string) {
  try {
    let versionId: string;
    try {
      versionId = await publishFunctionVersion(
        functionName,
        `domain bind ${releaseTarget} at ${new Date().toISOString()}`
      );
    } catch (publishErr: unknown) {
      if (!isNoChangesPublishError(publishErr)) throw publishErr;
      versionId = await getLatestPublishedVersionId(functionName);
    }

    await promoteFunctionAlias(
      functionName,
      releaseTarget,
      versionId,
      `domain bind by licell at ${new Date().toISOString()}`
    );

    return { aliasEnsured: true, aliasVersionId: versionId };
  } catch {
    return { aliasEnsured: false, aliasVersionId: undefined };
  }
}

const NOOP_SPINNER: Spinner = {
  start() {},
  stop() {},
  message() {}
};

function resolveWorkflowSpinner(spinner?: Spinner) {
  return spinner || NOOP_SPINNER;
}

function resolveAppDomainFunctionName(functionName?: string) {
  const explicit = functionName?.trim();
  if (explicit) return explicit;
  const projectFunctionName = Config.getProject().appName?.trim();
  if (!projectFunctionName) throw new Error('未找到应用名，请先执行 licell deploy');
  return projectFunctionName;
}

function normalizeExpectedRouteValue(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeExpectedRoutePath(value?: string) {
  const normalized = normalizeExpectedRouteValue(value);
  if (!normalized) return '/*';
  if (normalized === '*') return '/*';
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

function isExpectedProtocolSatisfied(existing?: string, expected?: string) {
  if (!expected) return true;
  if (!existing) return false;
  const normalizedExisting = existing.trim().toUpperCase().replace(/\s+/g, '');
  const normalizedExpected = expected.trim().toUpperCase().replace(/\s+/g, '');
  if (normalizedExisting === normalizedExpected) return true;
  return normalizedExpected === 'HTTP' && normalizedExisting === 'HTTP,HTTPS';
}

async function needsFnCustomDomainMutation(
  domainName: string,
  options: {
    functionName: string;
    qualifier?: string;
    path?: string;
    protocol?: string;
  },
  existingDomain?: Awaited<ReturnType<typeof getFnCustomDomain>> | null
) {
  const resolvedExistingDomain = existingDomain ?? await getFnCustomDomain(domainName);
  if (!resolvedExistingDomain) return true;

  const expectedPath = normalizeExpectedRoutePath(options.path);
  const expectedFunctionName = normalizeExpectedRouteValue(options.functionName);
  const expectedQualifier = normalizeExpectedRouteValue(options.qualifier);
  const primaryRoute = resolvedExistingDomain.routes[0];

  if (!primaryRoute) return true;
  if (normalizeExpectedRoutePath(primaryRoute.path) !== expectedPath) return true;
  if (normalizeExpectedRouteValue(primaryRoute.functionName) !== expectedFunctionName) return true;
  if (normalizeExpectedRouteValue(primaryRoute.qualifier) !== expectedQualifier) return true;
  if (!isExpectedProtocolSatisfied(resolvedExistingDomain.protocol, options.protocol)) return true;

  return false;
}

export async function bindCustomDomain(
  domainName: string,
  targetFcDomain: string,
  aliasName?: string,
  options: BindCustomDomainOptions = {}
) {
  const normalizedDomain = domainName.trim().toLowerCase();
  if (!normalizedDomain) throw new Error('域名不能为空');

  const project = Config.getProject();
  const functionName = options.functionName?.trim() || project.appName;
  if (!functionName) throw new Error('未找到应用名，请先执行 licell deploy');

  if (!options.skipDnsBind) {
    const normalizedTarget = normalizeDnsValue(targetFcDomain);
    await ensureDomainCname(normalizedDomain, normalizedTarget);
    await waitForAuthoritativeCnameTarget(normalizedDomain, normalizedTarget, {
      maxAttempts: 36,
      intervalMs: 5_000
    });
  }

  const shouldMutate = await needsFnCustomDomainMutation(normalizedDomain, {
    functionName,
    qualifier: aliasName,
    path: options.path || '/*',
    protocol: options.protocol || 'HTTP'
  });
  if (!shouldMutate) {
    return `http://${normalizedDomain}`;
  }

  await upsertFnCustomDomain(normalizedDomain, {
    functionName,
    qualifier: aliasName,
    path: options.path || '/*',
    protocol: options.protocol || 'HTTP'
  });

  return `http://${normalizedDomain}`;
}

export async function unbindCustomDomain(domainName: string) {
  const normalizedDomain = domainName.trim().toLowerCase();
  if (!normalizedDomain) throw new Error('域名不能为空');

  await removeFnCustomDomain(normalizedDomain);
  await removeDomainCname(normalizedDomain);
}

export async function bindAppDomainWorkflow(
  domainName: string,
  options: BindAppDomainWorkflowOptions = {}
): Promise<BindAppDomainWorkflowResult> {
  const normalizedDomain = domainName.trim().toLowerCase();
  if (!normalizedDomain) throw new Error('域名不能为空');

  const functionName = resolveAppDomainFunctionName(options.functionName);
  const releaseTarget = options.releaseTarget?.trim().toLowerCase() || undefined;
  const targetFcDomain = resolveDefaultFcGatewayDomain();
  const spinner = resolveWorkflowSpinner(options.spinner);
  const existingDomain = options.enableCdn || options.enableHttps
    ? await getFnCustomDomain(normalizedDomain)
    : null;

  const needsRouteMutation = await needsFnCustomDomainMutation(normalizedDomain, {
    functionName,
    qualifier: releaseTarget,
    path: '/*',
    protocol: 'HTTP'
  }, existingDomain);
  const needsHttpsMutation = Boolean(options.enableHttps) && shouldIssueNewCertificate(existingDomain, {
    forceRenew: Boolean(options.forceSslRenew),
    renewBeforeDays: resolveRenewBeforeDays(
      readLicellEnv(process.env, 'SSL_RENEW_BEFORE_DAYS'),
      DEFAULT_SSL_RENEW_BEFORE_DAYS
    )
  }).issue;

  if (options.enableCdn && (needsRouteMutation || needsHttpsMutation)) {
    const normalizedTarget = normalizeDnsValue(targetFcDomain);
    spinner.message(`正在临时校准 DNS 到 FC 网关 (${normalizedDomain})...`);
    await ensureDomainCname(normalizedDomain, normalizedTarget);
    await waitForAuthoritativeCnameTarget(normalizedDomain, normalizedTarget, {
      maxAttempts: 36,
      intervalMs: 5_000
    });
  }

  await bindCustomDomain(normalizedDomain, targetFcDomain, releaseTarget, {
    functionName,
    skipDnsBind: Boolean(options.enableCdn)
  });

  const aliasResult = releaseTarget && options.ensureAlias !== false
    ? await ensureReleaseTargetAlias(functionName, releaseTarget)
    : { aliasEnsured: false, aliasVersionId: undefined };

  let tlsArtifacts: { certificate?: string; privateKey?: string } | undefined;
  let domainHttpsConfigured = false;
  if (options.enableHttps) {
    spinner.message(`正在签发并挂载 HTTPS 证书 (${normalizedDomain})...`);
    const sslResult = await issueAndBindSSLWithArtifacts(normalizedDomain, spinner, {
      forceRenew: Boolean(options.forceSslRenew)
    });
    tlsArtifacts = {
      certificate: sslResult.certificate,
      privateKey: sslResult.privateKey
    };
    domainHttpsConfigured = true;
  }

  let cdnCname: string | undefined;
  let edgeHttpsConfigured = false;
  if (options.enableCdn) {
    spinner.message(`正在启用 CDN 加速 (${normalizedDomain})...`);
    const cdnResult = await enableCdnForDomain(normalizedDomain, targetFcDomain, {
      ...(tlsArtifacts?.certificate && tlsArtifacts?.privateKey
        ? { certificate: tlsArtifacts.certificate, privateKey: tlsArtifacts.privateKey }
        : {}),
      waitForOnline: true
    });
    cdnCname = cdnResult.cdnCname;
    edgeHttpsConfigured = Boolean(cdnResult.httpsConfigured);
  }

  const httpsConfigured = options.enableCdn ? edgeHttpsConfigured : domainHttpsConfigured;

  return {
    domainName: normalizedDomain,
    functionName,
    ...(releaseTarget ? { releaseTarget } : {}),
    targetFcDomain,
    aliasEnsured: aliasResult.aliasEnsured,
    aliasVersionId: aliasResult.aliasVersionId,
    cdnEnabled: Boolean(options.enableCdn),
    ...(cdnCname ? { cdnCname } : {}),
    domainHttpsConfigured,
    edgeHttpsConfigured,
    httpsConfigured,
    finalUrl: `${httpsConfigured ? 'https' : 'http'}://${normalizedDomain}`
  };
}

export async function unbindAppDomainWorkflow(domainName: string): Promise<UnbindAppDomainWorkflowResult> {
  const normalizedDomain = domainName.trim().toLowerCase();
  if (!normalizedDomain) throw new Error('域名不能为空');
  const removedCdnDomain = await removeCdnDomain(normalizedDomain);
  const removedCustomDomain = await removeFnCustomDomain(normalizedDomain);
  const removedDnsRecordIds = await removeDomainCname(normalizedDomain);
  return {
    domainName: normalizedDomain,
    removedCdnDomain,
    removedCustomDomain,
    removedDnsRecordIds
  };
}


export interface StaticDomainTlsArtifacts {
  certificate?: string;
  privateKey?: string;
}

export interface BindStaticDomainWorkflowOptions {
  bucketName?: string;
  tlsArtifacts?: StaticDomainTlsArtifacts;
  preferHttps?: boolean;
}

export interface BindStaticDomainWorkflowResult {
  domainName: string;
  bucketName: string;
  originDomain: string;
  cdnCname: string;
  httpsConfigured: boolean;
  finalUrl: string;
}

export interface UnbindStaticDomainWorkflowResult {
  domainName: string;
  removedDnsRecordIds: string[];
}

function resolveStaticBucketName(bucketName?: string) {
  const explicit = bucketName?.trim();
  if (explicit) return explicit;
  const appName = Config.getProject().appName?.trim();
  if (!appName) {
    throw new Error('请通过 --bucket 指定已有 OSS Bucket，或先在当前项目执行 licell deploy 生成 appName');
  }
  return resolveOssBucketName(appName);
}

export async function bindStaticDomainWorkflow(
  domainName: string,
  options: BindStaticDomainWorkflowOptions = {}
): Promise<BindStaticDomainWorkflowResult> {
  const normalizedDomain = domainName.trim().toLowerCase();
  if (!normalizedDomain) throw new Error('域名不能为空');

  const bucketName = resolveStaticBucketName(options.bucketName);
  const bucketInfo = await getOssBucketInfo(bucketName);
  const originDomain = resolveOssBucketOriginDomain(bucketName, bucketInfo.extranetEndpoint);
  const result = await enableCdnForDomain(normalizedDomain, originDomain, {
    ...(options.tlsArtifacts?.certificate && options.tlsArtifacts?.privateKey
      ? { certificate: options.tlsArtifacts.certificate, privateKey: options.tlsArtifacts.privateKey }
      : {}),
    sourceType: 'oss',
    waitForOnline: true
  });

  return {
    domainName: normalizedDomain,
    bucketName,
    originDomain,
    cdnCname: result.cdnCname,
    httpsConfigured: Boolean(result.httpsConfigured),
    finalUrl: `${options.preferHttps ? 'https' : 'http'}://${normalizedDomain}`
  };
}

export async function unbindStaticDomainWorkflow(domainName: string): Promise<UnbindStaticDomainWorkflowResult> {
  const normalizedDomain = domainName.trim().toLowerCase();
  if (!normalizedDomain) throw new Error('域名不能为空');
  await removeCdnDomain(normalizedDomain);
  const removedDnsRecordIds = await removeDomainCname(normalizedDomain);
  return {
    domainName: normalizedDomain,
    removedDnsRecordIds
  };
}
