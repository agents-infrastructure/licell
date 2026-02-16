export interface Spinner {
  start(msg?: string): void;
  stop(msg?: string): void;
  message(msg: string): void;
}

export function isConflictError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const error = err as { code?: string; message?: string };
  const text = `${error.code || ''} ${error.message || ''}`;
  return /AlreadyExists|Conflict|Duplicate|Exist|DomainRecordDuplicate/i.test(text);
}

export function isInstanceClassError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const error = err as { code?: string; message?: string };
  const text = `${error.code || ''} ${error.message || ''}`;
  return /InstanceClass|SoldOut|OutOfStock|InvalidParameter|not support|Unsupported/i.test(text);
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
