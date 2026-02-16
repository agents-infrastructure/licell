type EnvLike = Record<string, string | undefined>;

function hasOwn(env: EnvLike, key: string) {
  return Object.prototype.hasOwnProperty.call(env, key);
}

export function readEnvWithFallback(env: EnvLike, primaryKey: string, legacyKey?: string) {
  if (hasOwn(env, primaryKey)) return env[primaryKey];
  if (legacyKey && hasOwn(env, legacyKey)) return env[legacyKey];
  return undefined;
}

export function readLicellEnv(env: EnvLike, suffix: string) {
  return readEnvWithFallback(env, `LICELL_${suffix}`, `ALI_${suffix}`);
}

