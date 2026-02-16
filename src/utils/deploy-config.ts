type DeployProjectPatch = Partial<Record<'domainSuffix' | 'runtime', string>>;

interface BuildDeployProjectPatchOptions {
  deploySucceeded: boolean;
  cliDomainSuffix?: string;
  projectDomainSuffix?: string;
  cliRuntime?: string;
  projectRuntime?: string;
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
  return patch;
}
