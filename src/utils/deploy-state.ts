import type { LicellComponentState } from './project-state';
import { resolveCurrentCommitSha } from './project-state';

interface BuildDeployStatePatchOptions {
  cwd?: string;
  deployType: 'api' | 'static' | 'task';
  region?: string;
  appName: string;
  bucketName?: string;
  functionName?: string;
  releaseTarget?: string;
  promotedVersion?: string;
  url?: string;
  fixedDomain?: string;
  enableSSL?: boolean;
  enableCdn?: boolean;
  cdnCname?: string;
}

export function buildDeployStatePatch(options: BuildDeployStatePatchOptions): LicellComponentState {
  const deployedAt = new Date().toISOString();
  const commitSha = resolveCurrentCommitSha(options.cwd);

  if (options.deployType === 'static') {
    return {
      resources: {
        ...(options.bucketName
          ? { bucket: { name: options.bucketName, ...(options.region ? { region: options.region } : {}) } }
          : {}),
        ...((options.enableCdn !== undefined || options.cdnCname)
          ? { cdn: { ...(options.enableCdn !== undefined ? { enabled: options.enableCdn } : {}), ...(options.cdnCname ? { cname: options.cdnCname } : {}) } }
          : {})
      },
      route: {
        ...(options.url ? { url: options.url } : {}),
        ...(options.fixedDomain ? { domain: options.fixedDomain } : {}),
        ...(options.enableSSL !== undefined ? { ssl: options.enableSSL } : {})
      },
      liveRevision: {
        ...(commitSha ? { commitSha } : {}),
        deployedAt
      }
    };
  }

  if (options.deployType === 'api') {
    return {
      resources: {
        function: {
          name: options.functionName || options.appName,
          ...(options.region ? { region: options.region } : {})
        },
        ...(options.releaseTarget || options.promotedVersion
          ? { alias: { ...(options.releaseTarget ? { name: options.releaseTarget } : {}), ...(options.promotedVersion ? { versionId: options.promotedVersion } : {}) } }
          : {}),
        ...((options.enableCdn !== undefined || options.cdnCname)
          ? { cdn: { ...(options.enableCdn !== undefined ? { enabled: options.enableCdn } : {}), ...(options.cdnCname ? { cname: options.cdnCname } : {}) } }
          : {})
      },
      route: {
        ...(options.fixedDomain ? { domain: options.fixedDomain } : {}),
        ...(options.url ? { url: options.url } : {}),
        ...(options.enableSSL !== undefined ? { ssl: options.enableSSL } : {})
      },
      liveRevision: {
        ...(options.promotedVersion ? { versionId: options.promotedVersion } : {}),
        ...(commitSha ? { commitSha } : {}),
        deployedAt
      }
    };
  }

  return {
    resources: {
      function: {
        name: options.functionName || options.appName,
        ...(options.region ? { region: options.region } : {})
      },
      ...(options.releaseTarget || options.promotedVersion
        ? { alias: { ...(options.releaseTarget ? { name: options.releaseTarget } : {}), ...(options.promotedVersion ? { versionId: options.promotedVersion } : {}) } }
        : {})
    },
    liveRevision: {
      ...(options.promotedVersion ? { versionId: options.promotedVersion } : {}),
      ...(commitSha ? { commitSha } : {}),
      deployedAt
    }
  };
}
