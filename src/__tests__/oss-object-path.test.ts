import { describe, expect, it } from 'vitest';
import { join } from 'path';
import {
  buildOssDownloadPath,
  normalizeOssObjectKey,
  resolveDefaultOssDownloadDir,
  resolveDefaultOssDownloadFilePath
} from '../providers/oss';

describe('oss object path helpers', () => {
  it('normalizes object key and strips leading slash', () => {
    expect(normalizeOssObjectKey('/site/index.html')).toBe('site/index.html');
    expect(normalizeOssObjectKey('\\site\\app.js')).toBe('site/app.js');
  });

  it('derives default local file name from object key', () => {
    expect(resolveDefaultOssDownloadFilePath('site/index.html')).toBe('index.html');
  });

  it('derives default local download directory from bucket', () => {
    expect(resolveDefaultOssDownloadDir('demo-bucket')).toBe(join('oss-download', 'demo-bucket'));
  });

  it('maps object key to local file path under destination dir', () => {
    expect(buildOssDownloadPath('downloads', 'site/assets/app.js', 'site')).toBe(join('downloads', 'assets', 'app.js'));
    expect(buildOssDownloadPath('downloads', 'assets/app.js')).toBe(join('downloads', 'assets', 'app.js'));
  });

  it('rejects traversal-like object key segments when mapping to local path', () => {
    expect(() => buildOssDownloadPath('downloads', '../etc/passwd')).toThrow('不安全路径段');
  });
});
