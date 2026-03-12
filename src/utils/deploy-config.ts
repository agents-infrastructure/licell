import type { DeployType } from './cli-shared';

type DeployProjectPatch = Partial<Record<'domainSuffix' | 'runtime', string>> & {
  deployType?: DeployType;
};

interface BuildDeployProjectPatchOptions {
  deploySucceeded: boolean;
  cliDomainSuffix?: string;
  projectDomainSuffix?: string;
  cliRuntime?: string;
  projectRuntime?: string;
  deployType?: DeployType;
  projectDeployType?: DeployType;
  persistDeployType?: boolean;
}

export function buildDeployProjectPatch(options: BuildDeployProjectPatchOptions): DeployProjectPatch {
  if (!options.deploySucceeded) return {};

  const patch: DeployProjectPatch = {};
  if (options.cliDomainSuffix && options.cliDomainSuffix !== options.projectDomainSuffix) {
    patch.domainSuffix = options.cliDomainSuffix;
  }
  if (options.cliRuntime && options.cliRuntime !== options.projectRuntime) {
    patch.runtime = options.cliRuntime;
  }
  if (options.persistDeployType && options.deployType && options.deployType !== options.projectDeployType) {
    patch.deployType = options.deployType;
  }
  return patch;
}
