import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { describe, expect, it } from 'vitest';
import { detectStaticDistDir } from '../utils/static-dist';

describe('detectStaticDistDir', () => {
  it('uses current directory when index.html exists in root', () => {
    const root = mkdtempSync(join(tmpdir(), 'licell-static-dist-root-'));
    try {
      writeFileSync(join(root, 'index.html'), '<h1>hello</h1>\n');
      expect(detectStaticDistDir(root)).toBe('.');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('prefers candidate directory that contains index.html', () => {
    const root = mkdtempSync(join(tmpdir(), 'licell-static-dist-candidate-'));
    try {
      mkdirSync(join(root, 'build'), { recursive: true });
      writeFileSync(join(root, 'build', 'index.html'), '<h1>build</h1>\n');
      expect(detectStaticDistDir(root)).toBe('build');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('prefers directory with index.html over earlier non-empty candidate', () => {
    const root = mkdtempSync(join(tmpdir(), 'licell-static-dist-priority-'));
    try {
      mkdirSync(join(root, 'dist'), { recursive: true });
      writeFileSync(join(root, 'dist', 'asset.js'), 'console.log(1)\n');
      mkdirSync(join(root, 'build'), { recursive: true });
      writeFileSync(join(root, 'build', 'index.html'), '<h1>build</h1>\n');
      expect(detectStaticDistDir(root)).toBe('build');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('falls back to first non-empty candidate directory', () => {
    const root = mkdtempSync(join(tmpdir(), 'licell-static-dist-non-empty-'));
    try {
      mkdirSync(join(root, 'out'), { recursive: true });
      writeFileSync(join(root, 'out', 'main.js'), 'console.log(1)\n');
      expect(detectStaticDistDir(root)).toBe('out');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('falls back to dist when nothing matches', () => {
    const root = mkdtempSync(join(tmpdir(), 'licell-static-dist-default-'));
    try {
      expect(detectStaticDistDir(root)).toBe('dist');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
