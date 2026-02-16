import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { detectProjectType, generateDockerfile } from '../utils/dockerfile';

describe('dockerfile generation', () => {
  let projectRoot: string;

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), 'licell-dockerfile-'));
  });

  afterEach(() => {
    rmSync(projectRoot, { recursive: true, force: true });
  });

  describe('detectProjectType', () => {
    it('detects nodejs project by package.json', () => {
      writeFileSync(join(projectRoot, 'package.json'), '{}');
      const detector = detectProjectType(projectRoot);
      expect(detector).not.toBeNull();
      expect(detector!.name).toBe('nodejs');
    });

    it('detects python project by requirements.txt', () => {
      writeFileSync(join(projectRoot, 'requirements.txt'), 'flask\n');
      const detector = detectProjectType(projectRoot);
      expect(detector).not.toBeNull();
      expect(detector!.name).toBe('python');
    });

    it('detects python project by pyproject.toml', () => {
      writeFileSync(join(projectRoot, 'pyproject.toml'), '[project]\nname="test"\n');
      const detector = detectProjectType(projectRoot);
      expect(detector).not.toBeNull();
      expect(detector!.name).toBe('python');
    });

    it('returns null for empty project', () => {
      expect(detectProjectType(projectRoot)).toBeNull();
    });

    it('prefers nodejs over python when both exist', () => {
      writeFileSync(join(projectRoot, 'package.json'), '{}');
      writeFileSync(join(projectRoot, 'requirements.txt'), 'flask\n');
      const detector = detectProjectType(projectRoot);
      expect(detector!.name).toBe('nodejs');
    });
  });

  describe('generateDockerfile — nodejs', () => {
    it('generates npm-based Dockerfile by default', () => {
      writeFileSync(join(projectRoot, 'package.json'), JSON.stringify({ name: 'test' }));
      const df = generateDockerfile(projectRoot);
      expect(df).toContain('FROM node:22-slim');
      expect(df).toContain('npm ci --omit=dev');
      expect(df).toContain('EXPOSE 9000');
      expect(df).toContain('CMD ["node", "src/index.js"]');
    });

    it('uses bun image when bun.lockb exists', () => {
      writeFileSync(join(projectRoot, 'package.json'), JSON.stringify({ name: 'test' }));
      writeFileSync(join(projectRoot, 'bun.lockb'), '');
      const df = generateDockerfile(projectRoot);
      expect(df).toContain('FROM oven/bun:1-slim');
      expect(df).toContain('bun install');
      expect(df).toContain('CMD ["bun", "run"');
    });

    it('uses pnpm when pnpm-lock.yaml exists', () => {
      writeFileSync(join(projectRoot, 'package.json'), JSON.stringify({ name: 'test' }));
      writeFileSync(join(projectRoot, 'pnpm-lock.yaml'), '');
      const df = generateDockerfile(projectRoot);
      expect(df).toContain('pnpm install');
      expect(df).toContain('pnpm-lock.yaml');
    });

    it('uses yarn when yarn.lock exists', () => {
      writeFileSync(join(projectRoot, 'package.json'), JSON.stringify({ name: 'test' }));
      writeFileSync(join(projectRoot, 'yarn.lock'), '');
      const df = generateDockerfile(projectRoot);
      expect(df).toContain('yarn install');
      expect(df).toContain('yarn.lock');
    });

    it('adds build step when build script exists', () => {
      writeFileSync(join(projectRoot, 'package.json'), JSON.stringify({ name: 'test', scripts: { build: 'tsc' } }));
      const df = generateDockerfile(projectRoot);
      expect(df).toContain('RUN npm run build');
    });

    it('uses dist/index.js entry when tsconfig exists', () => {
      writeFileSync(join(projectRoot, 'package.json'), JSON.stringify({ name: 'test' }));
      writeFileSync(join(projectRoot, 'tsconfig.json'), '{}');
      const df = generateDockerfile(projectRoot);
      expect(df).toContain('CMD ["node", "dist/index.js"]');
    });

    it('uses custom entry file when provided', () => {
      writeFileSync(join(projectRoot, 'package.json'), JSON.stringify({ name: 'test' }));
      const df = generateDockerfile(projectRoot, 'app/server.js');
      expect(df).toContain('CMD ["node", "app/server.js"]');
    });
  });

  describe('generateDockerfile — python', () => {
    it('generates requirements.txt-based Dockerfile', () => {
      writeFileSync(join(projectRoot, 'requirements.txt'), 'flask\n');
      const df = generateDockerfile(projectRoot);
      expect(df).toContain('FROM python:3.13-slim');
      expect(df).toContain('pip install --no-cache-dir -r requirements.txt');
      expect(df).toContain('EXPOSE 9000');
      expect(df).toContain('CMD ["python", "src/main.py"]');
    });

    it('generates pyproject.toml-based Dockerfile', () => {
      writeFileSync(join(projectRoot, 'pyproject.toml'), '[project]\nname="test"\n');
      const df = generateDockerfile(projectRoot);
      expect(df).toContain('pip install --no-cache-dir .');
    });

    it('uses custom entry file when provided', () => {
      writeFileSync(join(projectRoot, 'requirements.txt'), 'flask\n');
      const df = generateDockerfile(projectRoot, 'app.py');
      expect(df).toContain('CMD ["python", "app.py"]');
    });
  });

  describe('generateDockerfile — error', () => {
    it('throws for unrecognized project', () => {
      expect(() => generateDockerfile(projectRoot)).toThrow('无法自动探测项目类型');
    });
  });
});
