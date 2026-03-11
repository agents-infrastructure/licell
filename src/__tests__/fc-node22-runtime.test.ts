import { mkdtempSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockPrepareNode22RuntimeInCode } = vi.hoisted(() => ({
  mockPrepareNode22RuntimeInCode: vi.fn(async () => ({ nodeBinaryInCode: '/code/.licell/runtime/node' }))
}));
vi.mock('../utils/node22-runtime', () => ({
  prepareNode22RuntimeInCode: mockPrepareNode22RuntimeInCode
}));

import { nodejs22Handler } from '../providers/fc/runtimes/nodejs22';

describe('nodejs22 runtime bootstrap', () => {
  afterEach(() => {
    delete process.env.LICELL_FC_INCLUDE_RUNTIME_FALLBACK;
    mockPrepareNode22RuntimeInCode.mockClear();
  });

  it('resolves entry path relative to bootstrap file location and uses managed runtime only by default', async () => {
    const outdir = mkdtempSync(join(tmpdir(), 'licell-node22-runtime-'));
    try {
      const config = await nodejs22Handler.resolveConfig(outdir, 'entry/index.js');
      const bootstrap = readFileSync(join(outdir, '.licell/node22-bootstrap.cjs'), 'utf-8');
      const launcher = readFileSync(join(outdir, '.licell/node22-launcher.sh'), 'utf-8');
      expect(bootstrap).toContain('require("./../entry/index.js")');
      expect(launcher).toContain("/var/fc/lang/nodejs22/bin/node");
      expect(launcher).not.toContain("/code/.licell/runtime/node");
      expect(launcher).toContain("/code/.licell/node22-bootstrap.cjs");
      expect(bootstrap).toContain("x-fc-control-path");
      expect(bootstrap).toContain("decodeInvokePayload");
      expect(bootstrap).toContain("JSON.parse");
      expect(config.customRuntimeConfig?.command).toEqual(['/bin/sh']);
      expect(config.customRuntimeConfig?.args).toEqual(['/code/.licell/node22-launcher.sh']);
      expect(mockPrepareNode22RuntimeInCode).not.toHaveBeenCalled();
    } finally {
      rmSync(outdir, { recursive: true, force: true });
    }
  });

  it('can include fallback runtime explicitly', async () => {
    process.env.LICELL_FC_INCLUDE_RUNTIME_FALLBACK = '1';
    const outdir = mkdtempSync(join(tmpdir(), 'licell-node22-runtime-'));
    try {
      await nodejs22Handler.resolveConfig(outdir, 'entry/index.js');
      const launcher = readFileSync(join(outdir, '.licell/node22-launcher.sh'), 'utf-8');
      expect(launcher).toContain("/code/.licell/runtime/node");
      expect(mockPrepareNode22RuntimeInCode).toHaveBeenCalledTimes(1);
    } finally {
      rmSync(outdir, { recursive: true, force: true });
    }
  });
});
