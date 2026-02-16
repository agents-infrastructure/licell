import { mkdtempSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../utils/node22-runtime', () => ({
  prepareNode22RuntimeInCode: vi.fn(async () => ({ nodeBinaryInCode: '/code/.licell/runtime/node' }))
}));

import { nodejs22Handler } from '../providers/fc/runtimes/nodejs22';

describe('nodejs22 runtime bootstrap', () => {
  it('resolves entry path relative to bootstrap file location', async () => {
    const outdir = mkdtempSync(join(tmpdir(), 'licell-node22-runtime-'));
    try {
      await nodejs22Handler.resolveConfig(outdir, 'entry/index.js');
      const bootstrap = readFileSync(join(outdir, '.licell/node22-bootstrap.cjs'), 'utf-8');
      expect(bootstrap).toContain('require("./../entry/index.js")');
    } finally {
      rmSync(outdir, { recursive: true, force: true });
    }
  });
});
