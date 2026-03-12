function toRecord(input: unknown): Record<string, unknown> {
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    return input as Record<string, unknown>;
  }
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return { raw: input };
    }
  }
  return {};
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clampSleepMs(input: unknown) {
  const value = Number(input ?? 0);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(Math.floor(value), 120000);
}

export async function handler(event: unknown) {
  const payload = toRecord(event);
  const job = typeof payload.job === 'string' && payload.job.trim() ? payload.job.trim() : 'demo-job';
  const mode = typeof payload.mode === 'string' ? payload.mode : 'ok';
  const sleepMs = clampSleepMs(payload.sleepMs);
  const attempt = Number.isFinite(Number(payload.attempt)) ? Number(payload.attempt) : 1;
  const metadata = payload.metadata && typeof payload.metadata === 'object' && !Array.isArray(payload.metadata)
    ? payload.metadata
    : {};

  if (mode === 'sleep' && sleepMs > 0) {
    await sleep(sleepMs);
  }

  return {
    ok: true,
    service: 'node22-task-worker',
    runtime: process.env.LICELL_FC_RUNTIME || process.env.FC_RUNTIME || process.env.RUNTIME || 'nodejs22',
    job,
    mode,
    attempt,
    sleepMs,
    metadata,
    now: new Date().toISOString()
  };
}
