import { select, text, isCancel } from '@clack/prompts';
import { Config, type AuthConfig, type ProjectConfig } from '../utils/config';
import { normalizeReleaseTarget } from '../utils/cli-helpers';
import { normalizeAcrNamespace } from '../providers/cr';
import { normalizeStaticCdnRefreshMode, type StaticCdnRefreshMode } from '../utils/static-cdn-refresh';
import { readLicellEnv } from '../utils/env';
import { parseDeployRuntimeOption } from '../utils/deploy-runtime';
import {
  toPromptValue,
  ensureAuthOrExit,
  isInteractiveTTY,
  normalizeDeployType,
  parseOptionalPositiveInt,
  parseOptionalPositiveNumber,
  normalizeCustomDomain,
  normalizeDomainSuffix,
  tryNormalizeCustomDomain,
  tryNormalizeDeployType,
  tryNormalizeDomainSuffix,
  tryNormalizeFcRuntime
} from '../utils/cli-shared';
import { isJsonOutput } from '../utils/output';

export interface DeployCliOptions {
  component?: string;
  region?: string;
  target?: string;
  domain?: string;
  domainSuffix?: string;
  enableCdn?: boolean;
  cdnRefresh?: string;
  ssl?: boolean;
  sslForceRenew?: boolean;
  type?: string;
  entry?: string;
  dist?: string;
  runtime?: string;
  acrNamespace?: string;
  enableVpc?: boolean;
  disableVpc?: boolean;
  memory?: string;
  diskSize?: string;
  vcpu?: string;
  instanceConcurrency?: string;
  timeout?: string;
  preview?: boolean;
}

export interface DeployContext {
  component?: string;
  appName: string;
  type: 'api' | 'static' | 'task';
  releaseTarget?: string;
  cliDomain?: string;
  projectDomain?: string;
  domainSuffix?: string;
  enableCdn: boolean;
  cdnRefreshMode: StaticCdnRefreshMode;
  useVpc: boolean;
  enableSSL: boolean;
  forceSslRenew: boolean;
  preview: boolean;
  cliResources?: { memorySize?: number; diskSize?: number; timeout?: number; cpu?: number; instanceConcurrency?: number };
  cliAcrNamespace?: string;
  interactiveTTY: boolean;
  auth: AuthConfig;
  project: ProjectConfig;
  cliDomainSuffix?: string;
  projectDomainSuffix?: string;
  projectTarget?: string;
  projectEnableCdn?: boolean;
  projectEnableSSL?: boolean;
  projectCdnRefreshMode?: StaticCdnRefreshMode;
  projectUseVpc?: boolean;
  cliType?: 'api' | 'static' | 'task';
  projectDeployType?: 'api' | 'static' | 'task';
  envDeployType?: 'api' | 'static' | 'task';
  cliRuntime?: string;
  projectRuntime?: string;
  envRuntime?: string;
  cliEntry?: string;
  projectEntry?: string;
  cliDist?: string;
  projectDist?: string;
}

export function resolveDeploySslEnabled(
  sslFlag: boolean | undefined,
  customDomain: string | undefined,
  enableCdn: boolean | undefined,
  domainSuffix?: string | undefined
) {
  return Boolean(sslFlag || customDomain || enableCdn || domainSuffix);
}

export async function resolveDeployContext(options: DeployCliOptions): Promise<DeployContext> {
  const auth = await ensureAuthOrExit();
  const interactiveTTY = isInteractiveTTY();

  let project = Config.getProject({ component: options.component });
  if (!project.appName) {
    if (!interactiveTTY) {
      throw new Error('缺少应用名，请先配置 .licell/project.json 的 appName，或在交互终端执行 deploy 初始化');
    }
    const appName = toPromptValue(await text({
      message: '为你的应用起个名字 (小写英文):',
      placeholder: 'my-awesome-app'
    }), '应用名');
    if (!/^[a-z0-9-]+$/.test(appName)) throw new Error('应用名仅允许小写字母、数字和短横线');
    if (appName.length > 128) throw new Error('应用名长度不能超过 128 个字符');
    Config.setProject({ appName }, { component: options.component });
    project = Config.getProject({ component: options.component });
  }

  const cliDomain = options.domain ? normalizeCustomDomain(options.domain) : undefined;
  const projectDomain = tryNormalizeCustomDomain(project.domain);
  const cliDomainSuffix = options.domainSuffix ? normalizeDomainSuffix(options.domainSuffix) : undefined;
  const projectDomainSuffix = tryNormalizeDomainSuffix(project.domainSuffix);
  const envDomainSuffix = tryNormalizeDomainSuffix(readLicellEnv(process.env, 'DOMAIN_SUFFIX'));
  const globalDomainSuffix = tryNormalizeDomainSuffix(Config.getGlobalConfig().domainSuffix);
  const runtimeSelection = parseDeployRuntimeOption(options.runtime);
  const cliRuntime = runtimeSelection.runtime;
  const projectRuntime = tryNormalizeFcRuntime(project.runtime);
  const envRuntime = tryNormalizeFcRuntime(readLicellEnv(process.env, 'FC_RUNTIME'));
  const projectDeployType = tryNormalizeDeployType(project.deployType);
  const envDeployType = tryNormalizeDeployType(readLicellEnv(process.env, 'DEPLOY_TYPE'));
  const projectTarget = typeof project.target === 'string' && project.target.trim().length > 0
    ? normalizeReleaseTarget(project.target)
    : undefined;
  const projectEnableCdn = typeof project.enableCdn === 'boolean' ? project.enableCdn : undefined;
  const projectEnableSSL = typeof project.enableSSL === 'boolean' ? project.enableSSL : undefined;
  const projectCdnRefreshMode = typeof project.cdnRefresh === 'string'
    ? normalizeStaticCdnRefreshMode(project.cdnRefresh)
    : typeof project.route?.cdnRefresh === 'string'
      ? normalizeStaticCdnRefreshMode(project.route.cdnRefresh)
      : undefined;
  const projectUseVpc = typeof project.useVpc === 'boolean' ? project.useVpc : undefined;
  const projectEntry = typeof project.entry === 'string' && project.entry.trim().length > 0
    ? project.entry.trim()
    : undefined;
  const projectDist = typeof project.dist === 'string' && project.dist.trim().length > 0
    ? project.dist.trim()
    : undefined;
  const cliAcrNamespace = options.acrNamespace ? normalizeAcrNamespace(options.acrNamespace) : undefined;
  const cliType = options.type ? normalizeDeployType(options.type) : undefined;
  let type: 'api' | 'static' | 'task';
  const runtimeHint = runtimeSelection.deployTypeHint;
  const assertRuntimeCompatibility = (selectedType: 'api' | 'static' | 'task', sourceLabel: string) => {
    if (runtimeHint === 'static' && selectedType !== 'static') {
      throw new Error(`${sourceLabel} 与 --runtime ${options.runtime} 冲突`);
    }
    if (runtimeHint === 'api' && selectedType === 'static') {
      throw new Error(`${sourceLabel} 与 --runtime ${options.runtime} 冲突`);
    }
  };
  if (cliType) {
    assertRuntimeCompatibility(cliType, `--type ${cliType}`);
  }
  if (cliType) {
    type = cliType;
  } else if (runtimeHint === 'static') {
    type = 'static';
  } else if (projectDeployType) {
    assertRuntimeCompatibility(projectDeployType, `.licell/project.json deployType=${projectDeployType}`);
    type = projectDeployType;
  } else if (envDeployType) {
    assertRuntimeCompatibility(envDeployType, `LICELL_DEPLOY_TYPE=${envDeployType}`);
    type = envDeployType;
  } else if (runtimeHint === 'api') {
    type = 'api';
  } else if (interactiveTTY) {
    const selectedType = await select({ message: '选择部署环境:', options: [
      { value: 'api', label: '🚀 API 服务 (Node/Python/Docker -> FC 3.0)' },
      { value: 'static', label: '📦 前端静态网站 (直推 OSS 托管)' },
      { value: 'task', label: '🧩 任务函数 (FC 异步任务调用)' }
    ]});
    if (isCancel(selectedType)) {
      if (isJsonOutput()) throw new Error('操作已取消');
      process.exit(0);
    }
    if (selectedType !== 'api' && selectedType !== 'static' && selectedType !== 'task') throw new Error('未知部署类型');
    type = selectedType;
  } else {
    type = 'api';
  }
  const resolvedDomain = cliDomain || projectDomain;
  const domainSuffix = resolvedDomain
    ? undefined
    : type === 'static'
      ? (cliDomainSuffix || projectDomainSuffix)
      : type === 'api'
        ? (cliDomainSuffix || projectDomainSuffix || envDomainSuffix || globalDomainSuffix)
        : undefined;
  const releaseTarget = options.target ? normalizeReleaseTarget(options.target) : projectTarget;
  const staticDomainRequested = type === 'static' && Boolean(resolvedDomain || domainSuffix);
  const enableCdn = type === 'static'
    ? Boolean(options.enableCdn || projectEnableCdn || staticDomainRequested)
    : Boolean(options.enableCdn || projectEnableCdn);
  const cliCdnRefreshMode = options.cdnRefresh !== undefined
    ? normalizeStaticCdnRefreshMode(options.cdnRefresh)
    : undefined;
  const cdnRefreshMode = type === 'static' && enableCdn
    ? (cliCdnRefreshMode || projectCdnRefreshMode || 'entrypoints')
    : 'off';
  const enableSSL = type === 'static'
    ? Boolean(options.ssl || projectEnableSSL || staticDomainRequested || enableCdn)
    : type === 'api'
      ? resolveDeploySslEnabled(Boolean(options.ssl || projectEnableSSL), resolvedDomain, enableCdn, domainSuffix)
      : false;
  const forceSslRenew = Boolean(options.sslForceRenew);
  if (type === 'task') {
    if (cliDomain || projectDomain || cliDomainSuffix || projectDomainSuffix) throw new Error('任务函数不支持 --domain / --domain-suffix');
    if (options.enableCdn || projectEnableCdn) throw new Error('任务函数不支持 --enable-cdn');
    if (options.cdnRefresh !== undefined || projectCdnRefreshMode !== undefined) throw new Error('任务函数不支持 --cdn-refresh');
    if (options.ssl || projectEnableSSL) throw new Error('任务函数不支持 --ssl');
    if (forceSslRenew) throw new Error('任务函数不支持 --ssl-force-renew');
    if (options.preview) throw new Error('任务函数不支持 --preview');
  }
  if (type === 'api' && (options.cdnRefresh !== undefined || projectCdnRefreshMode !== undefined)) {
    throw new Error('--cdn-refresh 当前仅适用于静态站点部署');
  }
  if (cliDomain && cliDomainSuffix) throw new Error('--domain 与 --domain-suffix 不能同时使用');
  if (releaseTarget && type === 'static') throw new Error('--target 仅适用于 FC 函数部署（api / task）');
  if (options.enableVpc && options.disableVpc) throw new Error('--enable-vpc 与 --disable-vpc 不能同时使用');
  if (type === 'static' && options.enableVpc) throw new Error('--enable-vpc 仅适用于 FC 函数部署（api / task）');
  if (type === 'static' && options.disableVpc) throw new Error('--disable-vpc 仅适用于 FC 函数部署（api / task）');
  if (enableCdn && !resolvedDomain && !domainSuffix) {
    throw new Error('--enable-cdn 需要域名，请提供 --domain（完整域名）或 --domain-suffix');
  }
  if (cdnRefreshMode !== 'off' && !enableCdn) {
    throw new Error('--cdn-refresh 需要启用 CDN，请提供 --domain / --domain-suffix，或显式使用 --enable-cdn');
  }
  if (type === 'static' && cliRuntime) throw new Error('--runtime 的 FC 运行时仅适用于 api / task；静态站请使用 --runtime static');
  if (type === 'static' && cliAcrNamespace) throw new Error('--acr-namespace 仅适用于 FC Docker 部署');
  if (forceSslRenew && !enableSSL) throw new Error('--ssl-force-renew 需要启用 HTTPS（请使用 --domain 或 --ssl）');
  if (enableSSL && !resolvedDomain && !domainSuffix) {
    throw new Error('--ssl 需要域名，请提供 --domain（完整域名）或 --domain-suffix');
  }

  const preview = Boolean(options.preview);
  if (preview && releaseTarget) throw new Error('--preview 与 --target 不能同时使用');
  if (preview && !domainSuffix) {
    throw new Error('--preview 需要域名后缀，请先执行 licell deploy --domain-suffix your-domain.com 或 licell config domain your-domain.com');
  }
  if (preview && resolvedDomain) throw new Error('--preview 与 --domain 不能同时使用，preview 会自动生成预览域名');

  const appName = project.appName;
  if (!appName) {
    throw new Error('appName 未设置，请检查项目配置');
  }

  const cliMemorySize = parseOptionalPositiveInt(options.memory, '--memory');
  const cliDiskSize = parseOptionalPositiveInt(options.diskSize, '--disk-size');
  const cliCpu = parseOptionalPositiveNumber(options.vcpu, '--vcpu');
  const cliInstanceConcurrency = parseOptionalPositiveInt(options.instanceConcurrency, '--instance-concurrency');
  const cliTimeout = parseOptionalPositiveInt(options.timeout, '--timeout');
  const cliResources = (cliMemorySize !== undefined || cliDiskSize !== undefined || cliTimeout !== undefined || cliCpu !== undefined || cliInstanceConcurrency !== undefined)
    ? {
      ...(cliMemorySize !== undefined ? { memorySize: cliMemorySize } : {}),
      ...(cliDiskSize !== undefined ? { diskSize: cliDiskSize } : {}),
      ...(cliCpu !== undefined ? { cpu: cliCpu } : {}),
      ...(cliInstanceConcurrency !== undefined ? { instanceConcurrency: cliInstanceConcurrency } : {}),
      ...(cliTimeout !== undefined ? { timeout: cliTimeout } : {})
    }
    : undefined;
  const useVpc = type === 'static'
    ? false
    : options.disableVpc
      ? false
      : options.enableVpc
        ? true
        : (projectUseVpc ?? true);

  return {
    component: options.component,
    appName,
    type,
    releaseTarget,
    cliDomain,
    projectDomain,
    domainSuffix,
    enableCdn,
    cdnRefreshMode,
    useVpc,
    enableSSL,
    forceSslRenew,
    preview,
    cliResources,
    cliAcrNamespace,
    interactiveTTY,
    auth,
    project,
    cliDomainSuffix,
    projectDomainSuffix,
    projectTarget,
    projectEnableCdn,
    projectEnableSSL,
    projectCdnRefreshMode,
    projectUseVpc,
    cliType,
    projectDeployType,
    envDeployType,
    cliRuntime,
    projectRuntime,
    envRuntime,
    cliEntry: options.entry,
    projectEntry,
    cliDist: options.dist,
    projectDist
  };
}
