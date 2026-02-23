import { select, text, isCancel } from '@clack/prompts';
import { Config, type AuthConfig, type ProjectConfig } from '../utils/config';
import { normalizeReleaseTarget } from '../utils/cli-helpers';
import { normalizeAcrNamespace } from '../providers/cr';
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
  tryNormalizeDomainSuffix,
  tryNormalizeFcRuntime
} from '../utils/cli-shared';
import { isJsonOutput } from '../utils/output';

export interface DeployCliOptions {
  target?: string;
  domain?: string;
  domainSuffix?: string;
  enableCdn?: boolean;
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
  vcpu?: string;
  instanceConcurrency?: string;
  timeout?: string;
  preview?: boolean;
}

export interface DeployContext {
  appName: string;
  type: 'api' | 'static';
  releaseTarget?: string;
  cliDomain?: string;
  domainSuffix?: string;
  enableCdn: boolean;
  useVpc: boolean;
  enableSSL: boolean;
  forceSslRenew: boolean;
  preview: boolean;
  cliResources?: { memorySize?: number; timeout?: number; cpu?: number; instanceConcurrency?: number };
  cliAcrNamespace?: string;
  interactiveTTY: boolean;
  auth: AuthConfig;
  project: ProjectConfig;
  cliDomainSuffix?: string;
  projectDomainSuffix?: string;
  cliRuntime?: string;
  projectRuntime?: string;
  envRuntime?: string;
  cliEntry?: string;
  cliDist?: string;
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

  let project = Config.getProject();
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
    Config.setProject({ appName });
    project = Config.getProject();
  }

  const cliDomain = options.domain ? normalizeCustomDomain(options.domain) : undefined;
  const cliDomainSuffix = options.domainSuffix ? normalizeDomainSuffix(options.domainSuffix) : undefined;
  const projectDomainSuffix = tryNormalizeDomainSuffix(project.domainSuffix);
  const envDomainSuffix = tryNormalizeDomainSuffix(readLicellEnv(process.env, 'DOMAIN_SUFFIX'));
  const globalDomainSuffix = tryNormalizeDomainSuffix(Config.getGlobalConfig().domainSuffix);
  const runtimeSelection = parseDeployRuntimeOption(options.runtime);
  const cliRuntime = runtimeSelection.runtime;
  const projectRuntime = tryNormalizeFcRuntime(project.runtime);
  const envRuntime = tryNormalizeFcRuntime(readLicellEnv(process.env, 'FC_RUNTIME'));
  const cliAcrNamespace = options.acrNamespace ? normalizeAcrNamespace(options.acrNamespace) : undefined;
  const cliType = options.type ? normalizeDeployType(options.type) : undefined;
  let type: 'api' | 'static';
  if (cliType && runtimeSelection.deployTypeHint && cliType !== runtimeSelection.deployTypeHint) {
    throw new Error(`--type ${cliType} 与 --runtime ${options.runtime} 冲突`);
  }
  if (cliType) {
    type = cliType;
  } else if (runtimeSelection.deployTypeHint === 'api') {
    type = 'api';
  } else if (runtimeSelection.deployTypeHint === 'static') {
    type = 'static';
  } else if (interactiveTTY) {
    const selectedType = await select({ message: '选择部署环境:', options: [
      { value: 'api', label: '🚀 API 服务 (Node/Python/Docker -> FC 3.0)' },
      { value: 'static', label: '📦 前端静态网站 (直推 OSS 托管)' }
    ]});
    if (isCancel(selectedType)) {
      if (isJsonOutput()) throw new Error('操作已取消');
      process.exit(0);
    }
    if (selectedType !== 'api' && selectedType !== 'static') throw new Error('未知部署类型');
    type = selectedType;
  } else {
    type = 'api';
  }
  const domainSuffix = cliDomain
    ? undefined
    : type === 'static'
      ? cliDomainSuffix
      : (cliDomainSuffix || projectDomainSuffix || envDomainSuffix || globalDomainSuffix);
  const releaseTarget = options.target ? normalizeReleaseTarget(options.target) : undefined;
  const staticDomainRequested = type === 'static' && Boolean(cliDomain || domainSuffix);
  const enableCdn = type === 'static'
    ? Boolean(options.enableCdn || staticDomainRequested)
    : Boolean(options.enableCdn);
  const enableSSL = type === 'static'
    ? Boolean(options.ssl || staticDomainRequested || enableCdn)
    : resolveDeploySslEnabled(options.ssl, cliDomain, enableCdn, domainSuffix);
  const forceSslRenew = Boolean(options.sslForceRenew);
  if (cliDomain && cliDomainSuffix) throw new Error('--domain 与 --domain-suffix 不能同时使用');
  if (releaseTarget && type !== 'api') throw new Error('--target 仅适用于 API 部署');
  if (options.enableVpc && options.disableVpc) throw new Error('--enable-vpc 与 --disable-vpc 不能同时使用');
  if (type !== 'api' && options.enableVpc) throw new Error('--enable-vpc 仅适用于 API 部署');
  if (type !== 'api' && options.disableVpc) throw new Error('--disable-vpc 仅适用于 API 部署');
  if (enableCdn && !cliDomain && !domainSuffix) {
    throw new Error('--enable-cdn 需要域名，请提供 --domain（完整域名）或 --domain-suffix');
  }
  if (type !== 'api' && cliRuntime) throw new Error('--runtime 的 API 运行时仅适用于 API 部署；静态站请使用 --runtime static');
  if (type !== 'api' && cliAcrNamespace) throw new Error('--acr-namespace 仅适用于 API Docker 部署');
  if (forceSslRenew && !enableSSL) throw new Error('--ssl-force-renew 需要启用 HTTPS（请使用 --domain 或 --ssl）');
  if (enableSSL && !cliDomain && !domainSuffix) {
    throw new Error('--ssl 需要域名，请提供 --domain（完整域名）或 --domain-suffix');
  }

  const preview = Boolean(options.preview);
  if (preview && releaseTarget) throw new Error('--preview 与 --target 不能同时使用');
  if (preview && !domainSuffix) {
    throw new Error('--preview 需要域名后缀，请先执行 licell deploy --domain-suffix your-domain.com 或 licell config domain your-domain.com');
  }
  if (preview && cliDomain) throw new Error('--preview 与 --domain 不能同时使用，preview 会自动生成预览域名');

  const appName = project.appName;
  if (!appName) {
    throw new Error('appName 未设置，请检查项目配置');
  }

  const cliMemorySize = parseOptionalPositiveInt(options.memory, '--memory');
  const cliCpu = parseOptionalPositiveNumber(options.vcpu, '--vcpu');
  const cliInstanceConcurrency = parseOptionalPositiveInt(options.instanceConcurrency, '--instance-concurrency');
  const cliTimeout = parseOptionalPositiveInt(options.timeout, '--timeout');
  const cliResources = (cliMemorySize !== undefined || cliTimeout !== undefined || cliCpu !== undefined || cliInstanceConcurrency !== undefined)
    ? {
      ...(cliMemorySize !== undefined ? { memorySize: cliMemorySize } : {}),
      ...(cliCpu !== undefined ? { cpu: cliCpu } : {}),
      ...(cliInstanceConcurrency !== undefined ? { instanceConcurrency: cliInstanceConcurrency } : {}),
      ...(cliTimeout !== undefined ? { timeout: cliTimeout } : {})
    }
    : undefined;
  const useVpc = type === 'api' ? !Boolean(options.disableVpc) : false;

  return {
    appName,
    type,
    releaseTarget,
    cliDomain,
    domainSuffix,
    enableCdn,
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
    cliRuntime,
    projectRuntime,
    envRuntime,
    cliEntry: options.entry,
    cliDist: options.dist
  };
}
