import { describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  getFcApiDeploySpecDocument,
  getFcApiRuntimeDeploySpec,
  runFcApiDeployPrecheck
} from '../providers/fc';

function withTempProject(run: (root: string) => void) {
  const root = mkdtempSync(join(tmpdir(), 'licell-fc-spec-'));
  try {
    run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

describe('fc deploy spec', () => {
  it('returns runtime specs and resource constraints', () => {
    const doc = getFcApiDeploySpecDocument();
    const runtimes = doc.runtimes.map((item) => item.runtime);
    expect(runtimes).toContain('nodejs22');
    expect(runtimes).toContain('python3.13');
    expect(runtimes).toContain('docker');
    expect(doc.resources.defaults.memoryMb).toBe(512);
    expect(doc.resources.constraints.memoryToVcpuRatio.expression).toContain('[1, 4]');
    const node22 = doc.runtimes.find((item) => item.runtime === 'nodejs22');
    expect(node22?.handlerContract.kind).toBe('function');
    expect(node22?.handlerContract.oneOfExports).toEqual([['handler'], ['default']]);
    expect(node22?.examples.minimalPassExample).toContain('export default');
    expect(node22?.validationRules.some((rule) => rule.id === 'entry.runtime_contract')).toBe(true);
  });

  it('returns single runtime spec', () => {
    const spec = getFcApiRuntimeDeploySpec('python3.13');
    expect(spec.defaultEntry).toBe('src/main.py');
    expect(spec.handlerRule).toContain('handler(event, context)');
    expect(spec.handlerContract.requiredExports).toEqual(['handler']);
    expect(spec.examples.commonFailExample).toContain('def app');
    expect(spec.eventSchema.requiredFields).toContain('requestContext.http.method');
  });
});

describe('runFcApiDeployPrecheck', () => {
  it('fails when python entry lacks handler', () => {
    withTempProject((root) => {
      mkdirSync(join(root, 'src'), { recursive: true });
      writeFileSync(join(root, 'src/main.py'), 'def main(event, context):\n  return {"statusCode": 200}\n', 'utf-8');
      const result = runFcApiDeployPrecheck({
        projectRoot: root,
        runtime: 'python3.13',
        entry: 'src/main.py'
      });
      expect(result.ok).toBe(false);
      expect(result.issues.some((item) => item.id === 'entry.runtime_contract' && item.level === 'error')).toBe(true);
    });
  });

  it('passes for nodejs22 default export', () => {
    withTempProject((root) => {
      mkdirSync(join(root, 'src'), { recursive: true });
      writeFileSync(join(root, 'src/index.ts'), 'export default async function app() { return { statusCode: 200 }; }\n', 'utf-8');
      const result = runFcApiDeployPrecheck({
        projectRoot: root,
        runtime: 'nodejs22',
        entry: 'src/index.ts'
      });
      expect(result.ok).toBe(true);
      expect(result.issues.filter((item) => item.level === 'error')).toHaveLength(0);
    });
  });

  it('fails docker auto-generation for ts project without build script', () => {
    withTempProject((root) => {
      writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'demo', scripts: {} }, null, 2), 'utf-8');
      writeFileSync(join(root, 'tsconfig.json'), JSON.stringify({ compilerOptions: {} }, null, 2), 'utf-8');
      const result = runFcApiDeployPrecheck({
        projectRoot: root,
        runtime: 'docker'
      });
      expect(result.ok).toBe(false);
      expect(result.issues.some((item) => item.id === 'docker.node_ts_no_build_script' && item.level === 'error')).toBe(true);
    });
  });
});
