import { Config } from '../utils/config';
import type { Spinner } from '../utils/errors';
import { ensureDomainCname, normalizeDnsValue, removeDomainCname } from '../providers/dns';
import { enableCdnForDomain, removeCdnDomain } from '../providers/cdn';
import { issueAndBindSSLWithArtifacts } from '../providers/ssl';
import { getOssBucketInfo, resolveOssBucketName } from '../providers/oss';
import {
  publishFunctionVersion,
  promoteFunctionAlias,
  removeFnCustomDomain,
  resolveDefaultFcGatewayDomain,
  upsertFnCustomDomain
} from '../providers/fc';
import { getLatestPublishedVersionId, isNoChangesPublishError } from '../utils/cli-shared';

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
    await ensureDomainCname(normalizedDomain, normalizeDnsValue(targetFcDomain));
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
        : {})
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
  const removedCustomDomain = await removeFnCustomDomain(normalizedDomain);
  const removedDnsRecordIds = await removeDomainCname(normalizedDomain);
  return {
    domainName: normalizedDomain,
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

function resolveBucketOriginDomain(bucketName: string, endpoint?: string) {
  const rawEndpoint = (endpoint || `oss-${Config.requireAuth().region}.aliyuncs.com`).trim();
  const normalizedEndpoint = rawEndpoint
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
  if (normalizedEndpoint.startsWith(`${bucketName}.`)) return normalizedEndpoint;
  return `${bucketName}.${normalizedEndpoint}`;
}

export async function bindStaticDomainWorkflow(
  domainName: string,
  options: BindStaticDomainWorkflowOptions = {}
): Promise<BindStaticDomainWorkflowResult> {
  const normalizedDomain = domainName.trim().toLowerCase();
  if (!normalizedDomain) throw new Error('域名不能为空');

  const bucketName = resolveStaticBucketName(options.bucketName);
  const bucketInfo = await getOssBucketInfo(bucketName);
  const originDomain = resolveBucketOriginDomain(bucketName, bucketInfo.extranetEndpoint);
  const result = await enableCdnForDomain(normalizedDomain, originDomain, {
    ...(options.tlsArtifacts?.certificate && options.tlsArtifacts?.privateKey
      ? { certificate: options.tlsArtifacts.certificate, privateKey: options.tlsArtifacts.privateKey }
      : {}),
    sourceType: 'oss'
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
