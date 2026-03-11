import { mkdtempSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockPreparePython313RuntimeInCode } = vi.hoisted(() => ({
  mockPreparePython313RuntimeInCode: vi.fn(async () => ({ pythonBinaryInCode: '/code/.licell/runtime/python3.13' }))
}));
vi.mock('../utils/python313-runtime', () => ({
  preparePython313RuntimeInCode: mockPreparePython313RuntimeInCode
}));

import { python313Handler } from '../providers/fc/runtimes/python313';

describe('python3.13 runtime bootstrap', () => {
  afterEach(() => {
    delete process.env.LICELL_FC_INCLUDE_RUNTIME_FALLBACK;
    mockPreparePython313RuntimeInCode.mockClear();
  });

  it('writes a managed-runtime launcher without fallback by default', async () => {
    const outdir = mkdtempSync(join(tmpdir(), 'licell-python313-runtime-'));
    try {
      const config = await python313Handler.resolveConfig(outdir, 'src/main.py');
      const bootstrap = readFileSync(join(outdir, '.licell/python313-bootstrap.py'), 'utf-8');
      const launcher = readFileSync(join(outdir, '.licell/python313-launcher.sh'), 'utf-8');
      expect(bootstrap).toContain('ENTRY_PATH = "/code/src/main.py"');
      expect(launcher).toContain('/var/fc/lang/python3.13/bin/python3.13');
      expect(launcher).not.toContain('/code/.licell/runtime/python3.13');
      expect(launcher).toContain('/code/.licell/python313-bootstrap.py');
      expect(bootstrap).toContain('"x-fc-control-path"');
      expect(bootstrap).toContain('_decode_invoke_payload');
      expect(bootstrap).toContain('json.loads');
      expect(config.customRuntimeConfig?.command).toEqual(['/bin/sh']);
      expect(config.customRuntimeConfig?.args).toEqual(['/code/.licell/python313-launcher.sh']);
      expect(mockPreparePython313RuntimeInCode).not.toHaveBeenCalled();
    } finally {
      rmSync(outdir, { recursive: true, force: true });
    }
  });

  it('can include fallback runtime explicitly', async () => {
    process.env.LICELL_FC_INCLUDE_RUNTIME_FALLBACK = '1';
    const outdir = mkdtempSync(join(tmpdir(), 'licell-python313-runtime-'));
    try {
      await python313Handler.resolveConfig(outdir, 'src/main.py');
      const launcher = readFileSync(join(outdir, '.licell/python313-launcher.sh'), 'utf-8');
      expect(launcher).toContain('/code/.licell/runtime/python3.13');
      expect(mockPreparePython313RuntimeInCode).toHaveBeenCalledTimes(1);
    } finally {
      rmSync(outdir, { recursive: true, force: true });
    }
  });
});
