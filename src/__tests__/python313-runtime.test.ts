import { describe, expect, it } from 'vitest';
import { parsePython313SpecFromRelease } from '../utils/python313-runtime';

describe('python313 runtime spec parser', () => {
  it('extracts stripped linux x64 asset with sha256 digest', () => {
    const spec = parsePython313SpecFromRelease({
      assets: [
        {
          name: 'cpython-3.13.12+20260211-x86_64-unknown-linux-gnu-install_only_stripped.tar.gz',
          browser_download_url: 'https://example.com/python313.tar.gz',
          digest: 'sha256:D0EBD5143348D50151D28054F0CFF3D0740692FF5C3FD025E7F3DA776F936F9C'
        }
      ]
    });
    expect(spec).toEqual({
      tarballName: 'cpython-3.13.12+20260211-x86_64-unknown-linux-gnu-install_only_stripped.tar.gz',
      downloadUrl: 'https://example.com/python313.tar.gz',
      sha256: 'd0ebd5143348d50151d28054f0cff3d0740692ff5c3fd025e7f3da776f936f9c'
    });
  });

  it('returns null when digest is missing', () => {
    const spec = parsePython313SpecFromRelease({
      assets: [
        {
          name: 'cpython-3.13.12+20260211-x86_64-unknown-linux-gnu-install_only_stripped.tar.gz',
          browser_download_url: 'https://example.com/python313.tar.gz'
        }
      ]
    });
    expect(spec).toBeNull();
  });

  it('returns null for incompatible asset name', () => {
    const spec = parsePython313SpecFromRelease({
      assets: [
        {
          name: 'cpython-3.12.9+20260211-x86_64-unknown-linux-gnu-install_only_stripped.tar.gz',
          browser_download_url: 'https://example.com/python312.tar.gz',
          digest: 'sha256:d0ebd5143348d50151d28054f0cff3d0740692ff5c3fd025e7f3da776f936f9c'
        }
      ]
    });
    expect(spec).toBeNull();
  });
});
