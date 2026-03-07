export function toOptionalString(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function toOptionalBoolean(value: unknown) {
  if (typeof value === 'boolean') return value;
  return undefined;
}

export function toOptionalNumber(value: unknown) {
  if (typeof value !== 'number') return undefined;
  if (!Number.isFinite(value)) return undefined;
  return value;
}

export function assertTrue(flag: unknown, message: string) {
  if (flag !== true) throw new Error(message);
}
