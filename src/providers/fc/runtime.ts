import { type ProjectNetworkConfig } from '../../utils/config';
import { resolveProvidedNetwork } from '../vpc';
import { getRuntime, getSupportedRuntimeNames, type ResolvedRuntimeConfig } from './runtime-handler';
import './runtimes';

export type { ResolvedRuntimeConfig } from './runtime-handler';

type ResolveNetworkLike = (options: { vpcId: string; vswId: string }) => Promise<{ sgId?: string }>;

export async function resolveFunctionVpcConfig(
  network: ProjectNetworkConfig | undefined,
  resolveNetwork: ResolveNetworkLike = resolveProvidedNetwork
) {
  if (!network) return undefined;
  const vpcId = network.vpcId?.trim();
  const vswId = network.vswId?.trim();
  if (!vpcId || !vswId) return undefined;

  let securityGroupId = network.sgId?.trim();
  if (!securityGroupId) {
    const resolved = await resolveNetwork({ vpcId, vswId });
    securityGroupId = resolved.sgId?.trim();
  }

  const vpcConfig: {
    vpcId: string;
    vSwitchIds: string[];
    securityGroupId?: string;
  } = { vpcId, vSwitchIds: [vswId] };
  if (securityGroupId) vpcConfig.securityGroupId = securityGroupId;
  return vpcConfig;
}

export function normalizeFcRuntime(input: string): string {
  const value = input.trim().toLowerCase();
  const supported = getSupportedRuntimeNames();
  if (supported.includes(value)) return value;
  throw new Error(`函数运行时仅支持: ${supported.join(', ')}`);
}

export async function prepareBootFile(entryFile: string, outdir: string, runtime: string) {
  return getRuntime(runtime).prepareBootFile(entryFile, outdir);
}

export async function resolveRuntimeConfig(runtime: string, outdir: string, bootFile: string): Promise<ResolvedRuntimeConfig> {
  return getRuntime(runtime).resolveConfig(outdir, bootFile);
}

export function buildUnsupportedRuntimeMessage(runtime: string) {
  try {
    return getRuntime(runtime).unsupportedMessage;
  } catch {
    return `当前地域暂不支持 runtime=${runtime}。请改用 nodejs20 后重试。`;
  }
}

export function isInvalidRuntimeValueError(err: unknown) {
  if (typeof err !== 'object' || err === null) return false;
  const code = 'code' in err ? String((err as { code?: unknown }).code || '') : '';
  const message = 'message' in err ? String((err as { message?: unknown }).message || '') : '';
  return code === 'InvalidArgument' && message.includes('Runtime is set to an invalid value');
}

export function isRuntimeChangeNotSupportedError(err: unknown) {
  if (typeof err !== 'object' || err === null) return false;
  const code = 'code' in err ? String((err as { code?: unknown }).code || '') : '';
  const message = 'message' in err ? String((err as { message?: unknown }).message || '') : '';
  return code === 'InvalidArgument' && message.toLowerCase().includes('change of runtime');
}
