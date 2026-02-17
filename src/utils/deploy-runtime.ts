import { normalizeFcRuntime } from '../providers/fc';
import type { DeployType } from './cli-shared';

const STATIC_RUNTIME_ALIASES = new Set(['static', 'statis', 'oss', 'static-site']);

export interface ParsedDeployRuntimeOption {
  deployTypeHint?: DeployType;
  runtime?: string;
}

function toOptionalString(input: unknown) {
  if (input === null || input === undefined) return undefined;
  const value = String(input).trim();
  return value.length > 0 ? value : undefined;
}

export function parseDeployRuntimeOption(input: unknown): ParsedDeployRuntimeOption {
  const runtimeInput = toOptionalString(input);
  if (!runtimeInput) return {};
  const normalized = runtimeInput.toLowerCase();
  if (STATIC_RUNTIME_ALIASES.has(normalized)) return { deployTypeHint: 'static' };
  return {
    deployTypeHint: 'api',
    runtime: normalizeFcRuntime(runtimeInput)
  };
}
