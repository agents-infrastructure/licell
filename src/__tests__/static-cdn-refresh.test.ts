import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildStaticCdnRefreshPlan,
  normalizeStaticCdnRefreshMode
} from '../utils/static-cdn-refresh';

describe('normalizeStaticCdnRefreshMode', () => {
  it('accepts the supported values', () => {
    expect(normalizeStaticCdnRefreshMode('off')).toBe('off');
    expect(normalizeStaticCdnRefreshMode('entrypoints')).toBe('entrypoints');
    expect(normalizeStaticCdnRefreshMode('all')).toBe('all');
  });

  it('rejects unsupported values', () => {
    expect(() => normalizeStaticCdnRefreshMode('on')).toThrow('--cdn-refresh 仅支持 off、entrypoints 或 all');
  });
});

describe('buildStaticCdnRefreshPlan', () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    while (tempDirs.length > 0) {
      rmSync(tempDirs.pop()!, { recursive: true, force: true });
    }
  });

  it('builds an entrypoints refresh plan from root entry files', () => {
    const distDir = mkdtempSync(join(tmpdir(), 'licell-cdn-refresh-'));
    tempDirs.push(distDir);
    writeFileSync(join(distDir, 'index.html'), '<html></html>');
    writeFileSync(join(distDir, 'about.html'), '<html></html>');
    writeFileSync(join(distDir, 'manifest.json'), '{}');
    writeFileSync(join(distDir, 'sw.js'), 'self.addEventListener("install", () => {});');
    writeFileSync(join(distDir, 'app.abc123.js'), 'console.log("hashed");');

    expect(buildStaticCdnRefreshPlan('static.example.com', distDir, 'entrypoints')).toEqual({
      mode: 'entrypoints',
      requests: [
        {
          objectType: 'File',
          objectPaths: [
            'https://static.example.com/',
            'https://static.example.com/about.html',
            'https://static.example.com/index.html',
            'https://static.example.com/manifest.json',
            'https://static.example.com/sw.js'
          ]
        }
      ]
    });
  });

  it('uses directory refresh for all mode', () => {
    expect(buildStaticCdnRefreshPlan('static.example.com', '/tmp/missing-dir', 'all')).toEqual({
      mode: 'all',
      requests: [
        {
          objectType: 'Directory',
          objectPaths: ['https://static.example.com/']
        }
      ]
    });
  });
});
