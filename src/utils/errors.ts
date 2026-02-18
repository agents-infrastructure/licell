export { isConflictError, isInstanceClassError } from './alicloud-error';
import { isConflictError } from './alicloud-error';

export interface Spinner {
  start(msg?: string): void;
  stop(msg?: string): void;
  message(msg: string): void;
}

export async function ignoreConflict(task: () => Promise<unknown>): Promise<void> {
  try {
    await task();
  } catch (err: unknown) {
    if (!isConflictError(err)) throw err;
  }
}

export function formatErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
}
