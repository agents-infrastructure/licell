import type { ProjectConfig } from './config';
import type { DeployType } from './cli-shared';

export interface DeployProjectPatch extends Partial<ProjectConfig> {
  deployType?: DeployType;
}

interface BuildDeployProjectPatchOptions {
  deploySucceeded: boolean;
  deployType: DeployType;
  appName?: string;
  runtime?: string;
  entry?: string;
  dist?: string;
  domain?: string;
  domainSuffix?: string;
  target?: string;
  enableCdn?: boolean;
  enableSSL?: boolean;
  cdnRefresh?: 'off' | 'entrypoints' | 'all';
  useVpc?: boolean;
  acrNamespace?: string;
  region?: string;
  bucketName?: string;
  functionName?: string;
}

export function buildDeployProjectPatch(options: BuildDeployProjectPatchOptions): DeployProjectPatch {
  if (!options.deploySucceeded) return {};

  const patch: DeployProjectPatch = {
    deployType: options.deployType
  };
  if (options.appName) {
    patch.appName = options.appName;
  }

  if (options.deployType === 'static') {
    patch.runtime = undefined;
    patch.entry = undefined;
    patch.dist = options.dist;
    patch.target = undefined;
    patch.useVpc = undefined;
  } else {
    patch.runtime = options.runtime;
    patch.entry = options.entry;
    patch.dist = undefined;
    patch.target = options.target;
    patch.useVpc = options.useVpc;
  }

  if (options.deployType === 'task') {
    patch.domain = undefined;
    patch.domainSuffix = undefined;
    patch.enableCdn = undefined;
    patch.enableSSL = undefined;
  } else if (options.domain) {
    patch.domain = options.domain;
    patch.domainSuffix = undefined;
    patch.enableCdn = options.enableCdn;
    patch.enableSSL = options.enableSSL;
  } else {
    patch.domain = undefined;
    patch.domainSuffix = options.domainSuffix;
    patch.enableCdn = options.enableCdn;
    patch.enableSSL = options.enableSSL;
  }
  if (options.deployType !== 'task') {
    patch.cdnRefresh = options.cdnRefresh;
  } else {
    patch.cdnRefresh = undefined;
  }

  if (options.acrNamespace) {
    patch.acrNamespace = options.acrNamespace;
  }

  patch.artifact = options.deployType === 'static'
    ? {
      kind: 'directory',
      ...(options.dist ? { path: options.dist } : {})
    }
    : {
      kind: 'source',
      ...(options.entry ? { entry: options.entry } : {})
    };

  patch.deployTarget = options.deployType === 'static'
    ? {
      service: 'oss-static',
      ...(options.region ? { region: options.region } : {}),
      ...(options.bucketName ? { bucket: options.bucketName } : {})
    }
    : {
      service: options.deployType === 'task' ? 'fc-task' : 'fc-http',
      ...(options.region ? { region: options.region } : {}),
      ...((options.functionName || options.appName) ? { function: options.functionName || options.appName } : {}),
      ...(options.runtime ? { runtime: options.runtime } : {}),
      ...(options.target ? { alias: options.target } : {}),
      ...(options.useVpc !== undefined ? { vpc: options.useVpc } : {})
    };

  patch.route = options.deployType === 'task'
    ? undefined
    : {
      ...(options.domain ? { domain: options.domain } : {}),
      ...(options.domain || !options.domainSuffix ? {} : { domainSuffix: options.domainSuffix }),
      ...(options.enableCdn !== undefined ? { cdn: options.enableCdn } : {}),
      ...(options.enableSSL !== undefined ? { ssl: options.enableSSL } : {}),
      ...(options.cdnRefresh ? { cdnRefresh: options.cdnRefresh } : {})
    };

  return patch;
}
