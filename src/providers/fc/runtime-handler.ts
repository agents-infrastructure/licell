import type * as $FC from '@alicloud/fc20230330';
import type { ProjectConfig } from '../../utils/config';

export interface ResolvedRuntimeConfig {
  runtime: string;
  handler: string;
  customRuntimeConfig?: $FC.CustomRuntimeConfig;
  customContainerConfig?: $FC.CustomContainerConfig;
  skipCodePackaging?: boolean;
}

export interface RuntimeHandler {
  name: string;
  defaultEntry: string;
  unsupportedMessage: string;
  supportsInternalDeploymentProbe?: boolean;
  prepareBootFile(entryFile: string, outdir: string, project?: ProjectConfig): Promise<string>;
  resolveConfig(outdir: string, bootFile: string, project?: ProjectConfig): Promise<ResolvedRuntimeConfig>;
}

const registry = new Map<string, RuntimeHandler>();

export function registerRuntime(handler: RuntimeHandler) {
  registry.set(handler.name, handler);
}

export function getRuntime(name: string): RuntimeHandler {
  const handler = registry.get(name);
  if (!handler) throw new Error(`不支持的运行时: ${name}`);
  return handler;
}

export function getSupportedRuntimeNames(): string[] {
  return [...registry.keys()];
}
