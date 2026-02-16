export function escapeEnvValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\$/g, '\\$')
    .replace(/`/g, '\\`')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
}

export function maskConnectionString(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) parsed.password = '******';
    return parsed.toString();
  } catch {
    return url.replace(/:([^@/:]+)@/g, ':******@');
  }
}

export function normalizeReleaseTarget(target: unknown): string {
  if (typeof target !== 'string') return 'prod';
  const value = target.trim().toLowerCase();
  if (!value) return 'prod';
  if (!/^[a-z0-9-]+$/.test(value)) throw new Error('发布目标仅允许小写字母、数字和短横线');
  return value;
}
