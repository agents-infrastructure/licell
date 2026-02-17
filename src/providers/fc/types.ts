import './runtimes';
import { getSupportedRuntimeNames } from './runtime-handler';

export function getSupportedFcRuntimes(): string[] {
  return getSupportedRuntimeNames();
}

export const DEFAULT_FC_RUNTIME = 'nodejs20';

export type FcRuntime = string;

export interface FunctionSummary {
  functionName: string;
  runtime?: string;
  state?: string;
  lastModifiedTime?: string;
  description?: string;
}

export interface FunctionInvokeResult {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export interface RemoveFunctionResult {
  forced: boolean;
  deletedTriggers: string[];
  deletedAliases: string[];
  deletedVersions: string[];
}

export interface PruneFunctionVersionsResult {
  apply: boolean;
  keep: number;
  totalVersions: number;
  aliasProtectedVersions: string[];
  candidates: string[];
  deleted: string[];
  failed: Array<{ versionId: string; reason: string }>;
}
