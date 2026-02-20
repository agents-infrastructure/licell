import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';
import { rmSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { compareVersions, checkForUpdate, printUpdateTip } from '../utils/update-check';

const CACHE_FILE = join(homedir(), '.licell-cli', 'update-check.json');

describe('update-check', () => {
  describe('compareVersions', () => {
    it('returns 0 for equal versions', () => {
      expect(compareVersions('1.2.3', '1.2.3')).toBe(0);
    });

    it('returns positive when a > b', () => {
      expect(compareVersions('1.2.4', '1.2.3')).toBeGreaterThan(0);
      expect(compareVersions('1.3.0', '1.2.9')).toBeGreaterThan(0);
      expect(compareVersions('2.0.0', '1.9.9')).toBeGreaterThan(0);
    });

    it('returns negative when a < b', () => {
      expect(compareVersions('0.9.25', '0.9.26')).toBeLessThan(0);
      expect(compareVersions('0.8.0', '0.9.0')).toBeLessThan(0);
    });

    it('handles different segment lengths', () => {
      expect(compareVersions('1.2', '1.2.0')).toBe(0);
      expect(compareVersions('1.2.1', '1.2')).toBeGreaterThan(0);
    });
  });

  describe('checkForUpdate', () => {
    beforeEach(() => {
      rmSync(CACHE_FILE, { force: true });
    });

    afterEach(() => {
      rmSync(CACHE_FILE, { force: true });
      vi.restoreAllMocks();
    });

    it('returns null for dev version', async () => {
      expect(await checkForUpdate('dev')).toBeNull();
    });

    it('returns null for empty version', async () => {
      expect(await checkForUpdate('')).toBeNull();
    });

    it('returns update info when newer version available', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ tag_name: 'v99.0.0' })
      }));
      const result = await checkForUpdate('0.9.25');
      expect(result).toEqual({ currentVersion: '0.9.25', latestVersion: '99.0.0' });
    });

    it('returns null when current version is up to date', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ tag_name: 'v0.9.25' })
      }));
      expect(await checkForUpdate('0.9.25')).toBeNull();
    });

    it('returns null when fetch fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
      expect(await checkForUpdate('0.9.25')).toBeNull();
    });

    it('returns null when API returns non-ok status', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
      expect(await checkForUpdate('0.9.25')).toBeNull();
    });
  });

  describe('printUpdateTip', () => {
    it('prints update box to stderr', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      printUpdateTip({ currentVersion: '0.9.25', latestVersion: '0.9.28' });
      const output = spy.mock.calls.map((c) => c[0]).join('\n');
      expect(output).toContain('0.9.25');
      expect(output).toContain('0.9.28');
      expect(output).toContain('licell upgrade');
      spy.mockRestore();
    });
  });
});
