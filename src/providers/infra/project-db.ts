import { Config } from '../../utils/config';

interface ParsedDatabaseUrl {
  protocol: 'postgresql' | 'mysql';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

interface ProjectDatabaseLike {
  instanceId?: string;
  user?: string;
  name?: string;
}

export function parseDatabaseUrl(raw?: string): ParsedDatabaseUrl | null {
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    const protocol = parsed.protocol === 'postgresql:' ? 'postgresql' : parsed.protocol === 'mysql:' ? 'mysql' : null;
    if (!protocol || !parsed.hostname) return null;
    const portRaw = parsed.port || (protocol === 'postgresql' ? '5432' : '3306');
    const port = Number(portRaw);
    if (!Number.isFinite(port) || port <= 0) return null;
    const database = parsed.pathname.replace(/^\//, '') || 'main';
    return {
      protocol,
      host: parsed.hostname,
      port,
      database,
      username: decodeURIComponent(parsed.username || ''),
      password: decodeURIComponent(parsed.password || '')
    };
  } catch {
    return null;
  }
}

export function readProjectDatabase(project: ReturnType<typeof Config.getProject>): ProjectDatabaseLike {
  const candidate = (project as Record<string, unknown>).database;
  if (typeof candidate !== 'object' || candidate === null) return {};
  const db = candidate as Record<string, unknown>;
  return {
    instanceId: typeof db.instanceId === 'string' ? db.instanceId : undefined,
    user: typeof db.user === 'string' ? db.user : undefined,
    name: typeof db.name === 'string' ? db.name : undefined
  };
}

export function inferDbProtocol(engine?: string): 'postgresql' | 'mysql' {
  return (engine || '').toLowerCase().includes('postgres') ? 'postgresql' : 'mysql';
}
