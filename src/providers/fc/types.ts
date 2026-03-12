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

export interface AsyncTaskInvokeResult extends FunctionInvokeResult {
  taskId?: string;
  invocationType: 'Async';
}

export interface AsyncDestinationConfig {
  onFailure?: string;
  onSuccess?: string;
}

export interface AsyncInvokeConfigSummary {
  qualifier?: string;
  asyncTask: boolean;
  createdTime?: string;
  destinationConfig?: AsyncDestinationConfig;
  functionArn?: string;
  lastModifiedTime?: string;
  maxAsyncEventAgeInSeconds?: number;
  maxAsyncRetryAttempts?: number;
}

export interface RemoveAsyncInvokeConfigResult {
  functionName: string;
  qualifier?: string;
  removed: boolean;
}

export interface AsyncTaskEventSummary {
  eventId?: number;
  status?: string;
  timestamp?: number;
  eventDetail?: string;
}

export interface AsyncTaskSummary {
  taskId: string;
  alreadyRetriedTimes?: number;
  destinationStatus?: string;
  durationMs?: number;
  endTime?: number;
  functionArn?: string;
  instanceId?: string;
  qualifier?: string;
  requestId?: string;
  startedTime?: number;
  status?: string;
  taskErrorMessage?: string;
}

export interface AsyncTaskDetail extends AsyncTaskSummary {
  events: AsyncTaskEventSummary[];
  returnPayload?: string;
  taskPayload?: string;
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
