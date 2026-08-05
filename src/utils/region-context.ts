import { AsyncLocalStorage } from 'async_hooks';

export type CommandRegionScope = 'auth' | 'binding' | 'project' | 'manifest';

export interface InvocationRegionContext {
  scope: CommandRegionScope;
  regionId?: string;
  resolveFallbackRegion?: () => string | undefined;
}

const invocationRegionStorage = new AsyncLocalStorage<Readonly<InvocationRegionContext>>();

export function normalizeRegionId(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  return normalized || undefined;
}

export function runWithInvocationRegion<T>(
  context: InvocationRegionContext,
  task: () => T
): T {
  const normalizedContext = Object.freeze({
    scope: context.scope,
    regionId: normalizeRegionId(context.regionId),
    resolveFallbackRegion: context.resolveFallbackRegion
  });
  return invocationRegionStorage.run(normalizedContext, task);
}

export function isRegionalInvocation() {
  return invocationRegionStorage.getStore() !== undefined;
}

export function getInvocationRegionId(loadedRegion?: string) {
  const context = invocationRegionStorage.getStore();
  return normalizeRegionId(
    context?.regionId
    || loadedRegion
    || context?.resolveFallbackRegion?.()
  );
}

export function applyInvocationRegion<T extends { region: string }>(auth: T): T {
  return {
    ...auth,
    region: getInvocationRegionId(auth.region) || auth.region
  };
}
