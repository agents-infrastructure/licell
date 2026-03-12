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
  tryNormalizeDeployType,
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
  type: 'api' | 'static' | 'task';
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
  cliType?: 'api' | 'static' | 'task';
  projectDeployType?: 'api' | 'static' | 'task';
  envDeployType?: 'api' | 'static' | 'task';
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
  const projectDeployType = tryNormalizeDeployType(project.deployType);
  const envDeployType = tryNormalizeDeployType(readLicellEnv(process.env, 'DEPLOY_TYPE'));
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
  const domainSuffix = cliDomain
    ? undefined
    : type === 'static'
      ? cliDomainSuffix
      : type === 'api'
        ? (cliDomainSuffix || projectDomainSuffix || envDomainSuffix || globalDomainSuffix)
        : undefined;
  const releaseTarget = options.target ? normalizeReleaseTarget(options.target) : undefined;
  const staticDomainRequested = type === 'static' && Boolean(cliDomain || domainSuffix);
  const enableCdn = type === 'static'
    ? Boolean(options.enableCdn || staticDomainRequested)
    : Boolean(options.enableCdn);
  const enableSSL = type === 'static'
    ? Boolean(options.ssl || staticDomainRequested || enableCdn)
    : type === 'api'
      ? resolveDeploySslEnabled(options.ssl, cliDomain, enableCdn, domainSuffix)
      : false;
  const forceSslRenew = Boolean(options.sslForceRenew);
  if (type === 'task') {
    if (cliDomain || cliDomainSuffix) throw new Error('任务函数不支持 --domain / --domain-suffix');
    if (options.enableCdn) throw new Error('任务函数不支持 --enable-cdn');
    if (options.ssl) throw new Error('任务函数不支持 --ssl');
    if (forceSslRenew) throw new Error('任务函数不支持 --ssl-force-renew');
    if (options.preview) throw new Error('任务函数不支持 --preview');
  }
  if (cliDomain && cliDomainSuffix) throw new Error('--domain 与 --domain-suffix 不能同时使用');
  if (releaseTarget && type === 'static') throw new Error('--target 仅适用于 FC 函数部署（api / task）');
  if (options.enableVpc && options.disableVpc) throw new Error('--enable-vpc 与 --disable-vpc 不能同时使用');
  if (type === 'static' && options.enableVpc) throw new Error('--enable-vpc 仅适用于 FC 函数部署（api / task）');
  if (type === 'static' && options.disableVpc) throw new Error('--disable-vpc 仅适用于 FC 函数部署（api / task）');
  if (enableCdn && !cliDomain && !domainSuffix) {
    throw new Error('--enable-cdn 需要域名，请提供 --domain（完整域名）或 --domain-suffix');
  }
  if (type === 'static' && cliRuntime) throw new Error('--runtime 的 FC 运行时仅适用于 api / task；静态站请使用 --runtime static');
  if (type === 'static' && cliAcrNamespace) throw new Error('--acr-namespace 仅适用于 FC Docker 部署');
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
  const useVpc = type === 'static' ? false : !Boolean(options.disableVpc);

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
    cliType,
    projectDeployType,
    envDeployType,
    cliRuntime,
    projectRuntime,
    envRuntime,
    cliEntry: options.entry,
    cliDist: options.dist
  };
}
