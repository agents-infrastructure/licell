interface HttpResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

function toObject(event: unknown): Record<string, unknown> {
  if (typeof event === 'string') {
    try {
      const parsed = JSON.parse(event);
      if (typeof parsed === 'object' && parsed !== null) return parsed as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof event === 'object' && event !== null) return event as Record<string, unknown>;
  return {};
}

function pickPath(event: Record<string, unknown>) {
  const direct = typeof event.path === 'string' ? event.path : undefined;
  if (direct) return direct;
  const rawPath = typeof event.rawPath === 'string' ? event.rawPath : undefined;
  if (rawPath) return rawPath;

  const requestContext = event.requestContext as Record<string, unknown> | undefined;
  const http = requestContext?.http as Record<string, unknown> | undefined;
  if (typeof http?.path === 'string') return http.path;
  return '/';
}

function pickMethod(event: Record<string, unknown>) {
  if (typeof event.httpMethod === 'string') return event.httpMethod;
  const requestContext = event.requestContext as Record<string, unknown> | undefined;
  const http = requestContext?.http as Record<string, unknown> | undefined;
  if (typeof http?.method === 'string') return http.method;
  return 'GET';
}

export async function handler(event: unknown): Promise<HttpResponse> {
  const normalized = toObject(event);
  const path = pickPath(normalized);
  const method = pickMethod(normalized);
  const payload = path === '/healthz'
    ? { ok: true }
    : {
      message: 'Hello from Licell CLI smoke app',
      method,
      path,
      region: process.env.LICELL_REGION || process.env.ALI_REGION || process.env.REGION || process.env.FC_REGION || 'unknown'
    };

  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload)
  };
}
