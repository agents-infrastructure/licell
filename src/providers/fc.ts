export {
  getSupportedFcRuntimes,
  DEFAULT_FC_RUNTIME,
  type FunctionSummary,
  type FunctionInvokeResult,
  type AsyncTaskInvokeResult,
  type AsyncDestinationConfig,
  type AsyncInvokeConfigSummary,
  type RemoveAsyncInvokeConfigResult,
  type AsyncTaskEventSummary,
  type AsyncTaskSummary,
  type AsyncTaskDetail,
  type RemoveFunctionResult,
  type PruneFunctionVersionsResult
} from './fc/types';

export { getSupportedRuntimeNames } from './fc/runtime-handler';

export { normalizeFcRuntime, resolveFunctionVpcConfig } from './fc/runtime';

export { deployFC, type DeployFCResult } from './fc/deploy';
export { waitForFunctionDeploymentMarker } from './fc/deployment-probe';

export {
  FC_DEFAULT_DISK_SIZE_MB,
  FC_DEFAULT_INSTANCE_CONCURRENCY,
  FC_DEFAULT_MEMORY_MB,
  FC_DEFAULT_TIMEOUT_SECONDS,
  FC_DEFAULT_VCPU,
  FC_MEMORY_VCPU_RATIO_MAX,
  FC_MEMORY_VCPU_RATIO_MIN,
  FC_SUPPORTED_DISK_SIZE_MB
} from './fc/resources';

export {
  getFcApiDeploySpecDocument,
  getFcApiRuntimeDeploySpec,
  listFcApiRuntimeDeploySpecs,
  runFcApiDeployPrecheck,
  createFcApiDeployPrecheckError,
  type FcApiDeploySpecDocument,
  type FcApiRuntimeDeploySpec,
  type FcApiDeployPrecheckIssue,
  type FcApiDeployPrecheckResult,
  type FcApiDeployPrecheckErrorDetails
} from './fc/deploy-spec';

export { pullFunctionEnvs, listFunctions, getFunctionInfo, removeFunction, invokeFunction, setFunctionEnv, removeFunctionEnv } from './fc/function-ops';
export {
  getAsyncInvokeConfig,
  removeAsyncInvokeConfig,
  upsertAsyncInvokeConfig,
  invokeFunctionAsync,
  listAsyncTasks,
  getAsyncTask,
  stopAsyncTask
} from './fc/async';

export { ensureFunctionHttpUrl } from './fc/http';

export { listFunctionAliases, listFunctionVersions, publishFunctionVersion, promoteFunctionAlias, pruneFunctionVersions } from './fc/release';

export {
  createFnCustomDomain,
  getFnCustomDomain,
  listFnCustomDomains,
  normalizeFnCustomDomainProtocol,
  removeFnCustomDomain,
  updateFnCustomDomain,
  upsertFnCustomDomain,
  bindFnCustomDomain,
  resolveDefaultFcGatewayDomain,
  type FnCustomDomainCertConfig,
  type FnCustomDomainMutationOptions,
  type BindFnCustomDomainOptions,
  type FnCustomDomainProtocol,
  type FnCustomDomainRoute,
  type FnCustomDomainRouteSummary,
  type FnCustomDomainState,
  type FnCustomDomainSummary,
  type FnCustomDomainInfo
} from './fc/custom-domain';
