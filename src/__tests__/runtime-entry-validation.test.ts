import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { validateRuntimeEntrypoint } from '../providers/fc/runtime-utils';

function withTempEntry(content: string, ext: string, run: (entry: string) => void) {
  const root = mkdtempSync(join(tmpdir(), 'licell-entry-check-'));
  const entry = join(root, `entry${ext}`);
  try {
    writeFileSync(entry, content, 'utf-8');
    run(entry);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

describe('validateRuntimeEntrypoint', () => {
  it('accepts python entry with handler', () => {
    withTempEntry('def handler(event, context):\n  return {"statusCode": 200}\n', '.py', (entry) => {
      expect(() => validateRuntimeEntrypoint(entry, 'python3.13')).not.toThrow();
    });
  });

  it('rejects python entry without handler', () => {
    withTempEntry('def main(event, context):\n  return {"statusCode": 200}\n', '.py', (entry) => {
      expect(() => validateRuntimeEntrypoint(entry, 'python3.13')).toThrow('缺少 handler');
    });
  });

  it('accepts nodejs20 entry with handler export', () => {
    withTempEntry('export const handler = async () => ({ statusCode: 200 });\n', '.ts', (entry) => {
      expect(() => validateRuntimeEntrypoint(entry, 'nodejs20')).not.toThrow();
    });
  });

  it('accepts nodejs20 entry with re-exported default as handler', () => {
    withTempEntry("export { default as handler } from './app';\n", '.ts', (entry) => {
      expect(() => validateRuntimeEntrypoint(entry, 'nodejs20')).not.toThrow();
    });
  });

  it('rejects nodejs20 entry when only default export exists', () => {
    withTempEntry('export default async function app() { return { statusCode: 200 }; }\n', '.ts', (entry) => {
      expect(() => validateRuntimeEntrypoint(entry, 'nodejs20')).toThrow('缺少 handler 导出');
    });
  });

  it('accepts nodejs22 entry with default export', () => {
    withTempEntry('export default async function app() { return { statusCode: 200 }; }\n', '.ts', (entry) => {
      expect(() => validateRuntimeEntrypoint(entry, 'nodejs22')).not.toThrow();
    });
  });
});
