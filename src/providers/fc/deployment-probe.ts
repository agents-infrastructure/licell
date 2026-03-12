import { createHash } from 'crypto';
import { formatErrorMessage } from '../../utils/errors';
import { sleep } from '../../utils/runtime';
import { invokeFunction } from './function-ops';

export const LICELL_INTERNAL_DEPLOY_MARKER_ENV = 'LICELL_INTERNAL_DEPLOY_MARKER';
export const LICELL_INTERNAL_PROBE_FIELD = '__licell_internal_probe__';
export const LICELL_INTERNAL_PROBE_VALUE = 'deploy-marker-v1';
export const LICELL_INTERNAL_PROBE_KIND = 'licell-deploy-marker@1';

export function computeDeploymentMarker(source: string) {
  return createHash('sha256').update(source).digest('hex').slice(0, 24);
}

export function createInternalDeploymentProbePayload() {
  return JSON.stringify({
    [LICELL_INTERNAL_PROBE_FIELD]: LICELL_INTERNAL_PROBE_VALUE
  });
}

export function isInternalDeploymentProbeEvent(event: unknown) {
  if (typeof event !== 'object' || event === null || Array.isArray(event)) return false;
  return (event as Record<string, unknown>)[LICELL_INTERNAL_PROBE_FIELD] === LICELL_INTERNAL_PROBE_VALUE;
}

export function createInternalDeploymentProbeResponse(marker: string) {
  return {
    ok: true,
    kind: LICELL_INTERNAL_PROBE_KIND,
    marker
  };
}

export function parseInternalDeploymentProbeResponse(body: string) {
  if (!body.trim()) return undefined;
  try {
    const parsed = JSON.parse(body) as { kind?: unknown; marker?: unknown };
    if (parsed.kind !== LICELL_INTERNAL_PROBE_KIND) return undefined;
    return typeof parsed.marker === 'string' ? parsed.marker : undefined;
  } catch {
    return undefined;
  }
}

export async function waitForFunctionDeploymentMarker(
  functionName: string,
  expectedMarker: string,
  options: {
    qualifier?: string;
    timeoutMs?: number;
    intervalMs?: number;
  } = {}
) {
  const timeoutMs = options.timeoutMs ?? 90_000;
  const intervalMs = options.intervalMs ?? 2_000;
  const deadline = Date.now() + timeoutMs;
  let lastMarker: string | undefined;
  let lastBody: string | undefined;
  let lastError: string | undefined;

  while (Date.now() < deadline) {
    try {
      const result = await invokeFunction(functionName, {
        qualifier: options.qualifier,
        payload: createInternalDeploymentProbePayload()
      });
      lastBody = result.body;
      const marker = parseInternalDeploymentProbeResponse(result.body);
      if (marker === expectedMarker) return;
      lastMarker = marker;
      lastError = undefined;
    } catch (err: unknown) {
      lastError = formatErrorMessage(err);
    }
    await sleep(intervalMs);
  }

  const qualifierText = options.qualifier ? `@${options.qualifier}` : '';
  throw new Error(
    `等待函数调用收敛超时: ${functionName}${qualifierText}\n` +
    `expectedMarker=${expectedMarker}\n` +
    `lastMarker=${lastMarker || '-'}\n` +
    `lastError=${lastError || '-'}\n` +
    `lastBody=${lastBody || '-'}`
  );
}
