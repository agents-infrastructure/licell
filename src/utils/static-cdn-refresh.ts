import { existsSync, readdirSync, statSync } from 'fs';

export type StaticCdnRefreshMode = 'off' | 'entrypoints' | 'all';
export type StaticCdnRefreshObjectType = 'File' | 'Directory';

export interface StaticCdnRefreshRequest {
  objectType: StaticCdnRefreshObjectType;
  objectPaths: string[];
}

export interface StaticCdnRefreshPlan {
  mode: Exclude<StaticCdnRefreshMode, 'off'>;
  requests: StaticCdnRefreshRequest[];
}

const STATIC_CDN_ENTRYPOINT_FILES = new Set([
  'manifest.json',
  'manifest.webmanifest',
  'asset-manifest.json',
  'sw.js',
  'service-worker.js'
]);

export function normalizeStaticCdnRefreshMode(input: unknown): StaticCdnRefreshMode {
  const value = String(input || '').trim().toLowerCase();
  if (!value) throw new Error('--cdn-refresh 不能为空');
  if (value === 'off' || value === 'entrypoints' || value === 'all') return value;
  throw new Error('--cdn-refresh 仅支持 off、entrypoints 或 all');
}

function normalizeDomain(domain: string) {
  const value = domain.trim().toLowerCase();
  if (!value) throw new Error('CDN 刷新域名不能为空');
  return value;
}

function buildUrl(domain: string, pathname: string) {
  const normalizedDomain = normalizeDomain(domain);
  if (pathname === '/') return `https://${normalizedDomain}/`;
  const normalizedPathname = pathname.replace(/^\/+/, '');
  return `https://${normalizedDomain}/${normalizedPathname}`;
}

function listStaticEntrypointFiles(distDir: string) {
  if (!existsSync(distDir) || !statSync(distDir).isDirectory()) return [];
  const files: string[] = [];
  for (const entry of readdirSync(distDir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (entry.name.toLowerCase().endsWith('.html') || STATIC_CDN_ENTRYPOINT_FILES.has(entry.name)) {
      files.push(entry.name);
    }
  }
  return files.sort((left, right) => left.localeCompare(right));
}

export function buildStaticCdnRefreshPlan(
  domain: string,
  distDir: string,
  mode: Exclude<StaticCdnRefreshMode, 'off'>
): StaticCdnRefreshPlan {
  const normalizedDomain = normalizeDomain(domain);
  if (mode === 'all') {
    return {
      mode,
      requests: [
        {
          objectType: 'Directory',
          objectPaths: [buildUrl(normalizedDomain, '/')]
        }
      ]
    };
  }

  const entrypointFiles = listStaticEntrypointFiles(distDir);
  const fileTargets = new Set<string>([buildUrl(normalizedDomain, '/')]);
  for (const fileName of entrypointFiles) {
    fileTargets.add(buildUrl(normalizedDomain, fileName));
  }
  return {
    mode,
    requests: [
      {
        objectType: 'File',
        objectPaths: [...fileTargets]
      }
    ]
  };
}
