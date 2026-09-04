import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  checkAlicloudProtocol,
  classifyProtocolChanges,
  updateAlicloudProtocol
} from '../utils/alicloud-protocol';
import {
  checkAlicloudCapabilityIndex,
  writeAlicloudCapabilityIndex
} from '../utils/alicloud-capability-generator';

const SOURCE = {
  repository: 'https://example.test/aliyun-openapi-meta.git',
  aliyunCliCommit: 'a'.repeat(40),
  metadataCommit: 'b'.repeat(40),
  metadataCommitDate: '2026-09-03T00:00:00Z'
};

function writeJson(path: string, value: unknown) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function fixtureRoot() {
  const root = mkdtempSync(join(tmpdir(), 'licell-protocol-test-'));
  const metadataRoot = join(root, 'upstream');
  mkdirSync(join(metadataRoot, 'metadatas', 'ecs'), { recursive: true });
  writeFileSync(join(metadataRoot, 'LICENSE'), 'Apache License 2.0\n');
  writeJson(join(metadataRoot, 'metadatas', 'products.json'), {
    products: [{
      code: 'Ecs',
      version: '2014-05-26',
      api_style: 'rpc',
      apis: ['DescribeInstances']
    }]
  });
  writeJson(join(metadataRoot, 'metadatas', 'ecs', 'DescribeInstances.json'), {
    name: 'DescribeInstances',
    protocol: 'HTTPS',
    method: 'POST',
    pathPattern: '',
    parameters: [{ name: 'RegionId', position: 'Query', type: 'String', required: true }]
  });
  return { root, metadataRoot, targetRoot: join(root, 'protocol', 'alicloud-openapi') };
}

describe('Alibaba Cloud protocol snapshot', () => {
  it('defaults a new snapshot to the complete upstream metadata set', () => {
    const fixture = fixtureRoot();
    const result = updateAlicloudProtocol({
      metadataRoot: fixture.metadataRoot,
      targetRoot: fixture.targetRoot,
      source: SOURCE
    });

    expect(result.manifest.scope).toEqual({ mode: 'full', products: [] });
    expect(result.manifest.products).toMatchObject([{ directory: 'ecs', apiCount: 1 }]);
  });

  it('creates a deterministic repository-local snapshot and validates it offline', () => {
    const fixture = fixtureRoot();
    const options = {
      metadataRoot: fixture.metadataRoot,
      targetRoot: fixture.targetRoot,
      source: SOURCE,
      scope: { mode: 'selected-products' as const, products: ['ecs'] }
    };
    const first = updateAlicloudProtocol(options);
    const second = updateAlicloudProtocol(options);

    expect(first.manifest.content.treeSha256).toBe(second.manifest.content.treeSha256);
    expect(second.changes).toEqual([]);
    expect(second.manifest.products).toMatchObject([{ directory: 'ecs', code: 'Ecs', apiCount: 1 }]);
    expect(checkAlicloudProtocol(fixture.targetRoot)).toMatchObject({ ok: true, issues: [] });
  });

  it('generates and checks both reviewable and embedded capability indexes', () => {
    const fixture = fixtureRoot();
    updateAlicloudProtocol({
      metadataRoot: fixture.metadataRoot,
      targetRoot: fixture.targetRoot,
      source: SOURCE,
      scope: { mode: 'selected-products', products: ['ecs'] }
    });
    const embeddedPath = join(fixture.root, 'src', 'generated', 'alicloud-capability-index.ts');
    const generated = writeAlicloudCapabilityIndex(fixture.targetRoot, embeddedPath);

    expect(generated.index.stats).toEqual({ productCount: 1, capabilityCount: 1 });
    expect(checkAlicloudCapabilityIndex(fixture.targetRoot, embeddedPath)).toMatchObject({ ok: true, issues: [] });
    writeFileSync(generated.path, '{}\n');
    expect(checkAlicloudCapabilityIndex(fixture.targetRoot, embeddedPath)).toMatchObject({
      ok: false,
      issues: ['capabilities.json 已过期，请运行 protocol:update']
    });
  });

  it('detects hand-edited protocol files', () => {
    const fixture = fixtureRoot();
    updateAlicloudProtocol({
      metadataRoot: fixture.metadataRoot,
      targetRoot: fixture.targetRoot,
      source: SOURCE,
      scope: { mode: 'selected-products', products: ['ecs'] }
    });
    const apiPath = join(fixture.targetRoot, 'metadatas', 'ecs', 'DescribeInstances.json');
    writeFileSync(apiPath, `${readFileSync(apiPath, 'utf8')}\n`);

    const result = checkAlicloudProtocol(fixture.targetRoot);
    expect(result.ok).toBe(false);
    expect(result.issues).toContain('协议文件 SHA-256 不一致，请勿手工修改 metadatas/');
  });

  it('classifies required parameter additions as breaking', () => {
    const previous = fixtureRoot();
    const next = fixtureRoot();
    updateAlicloudProtocol({
      metadataRoot: previous.metadataRoot,
      targetRoot: previous.targetRoot,
      source: SOURCE,
      scope: { mode: 'selected-products', products: ['ecs'] }
    });
    const nextApi = join(next.metadataRoot, 'metadatas', 'ecs', 'DescribeInstances.json');
    const metadata = JSON.parse(readFileSync(nextApi, 'utf8'));
    metadata.parameters.push({ name: 'VpcId', position: 'Query', type: 'String', required: true });
    writeJson(nextApi, metadata);
    updateAlicloudProtocol({
      metadataRoot: next.metadataRoot,
      targetRoot: next.targetRoot,
      source: SOURCE,
      scope: { mode: 'selected-products', products: ['ecs'] }
    });

    expect(classifyProtocolChanges(previous.targetRoot, next.targetRoot)).toContainEqual({
      kind: 'parameter-breaking',
      path: 'metadatas/ecs/DescribeInstances.json',
      reason: '新增必填参数 VpcId'
    });
  });

  it('classifies an existing parameter becoming required as breaking', () => {
    const previous = fixtureRoot();
    const next = fixtureRoot();
    for (const fixture of [previous, next]) {
      const apiPath = join(fixture.metadataRoot, 'metadatas', 'ecs', 'DescribeInstances.json');
      const metadata = JSON.parse(readFileSync(apiPath, 'utf8'));
      metadata.parameters[0].required = fixture === next;
      writeJson(apiPath, metadata);
      updateAlicloudProtocol({
        metadataRoot: fixture.metadataRoot,
        targetRoot: fixture.targetRoot,
        source: SOURCE,
        scope: { mode: 'selected-products', products: ['ecs'] }
      });
    }

    expect(classifyProtocolChanges(previous.targetRoot, next.targetRoot)).toContainEqual({
      kind: 'parameter-breaking',
      path: 'metadatas/ecs/DescribeInstances.json',
      reason: '参数 RegionId 从可选变为必填'
    });
  });

  it('refuses to replace a target that is not an alicloud-openapi directory', () => {
    const fixture = fixtureRoot();
    expect(() => updateAlicloudProtocol({
      metadataRoot: fixture.metadataRoot,
      targetRoot: join(fixture.root, 'unrelated'),
      source: SOURCE,
      scope: { mode: 'selected-products', products: ['ecs'] }
    })).toThrow('拒绝使用危险的 protocol 目标目录');
  });

  it('rejects malformed upstream API metadata before replacing the snapshot', () => {
    const fixture = fixtureRoot();
    const apiPath = join(fixture.metadataRoot, 'metadatas', 'ecs', 'DescribeInstances.json');
    writeJson(apiPath, {
      name: 'DescribeInstances',
      protocol: 'HTTPS',
      method: 'POST',
      pathPattern: '',
      parameters: [{ name: 'RegionId', position: 'Query', type: 'String' }]
    });

    expect(() => updateAlicloudProtocol({
      metadataRoot: fixture.metadataRoot,
      targetRoot: fixture.targetRoot,
      source: SOURCE,
      scope: { mode: 'selected-products', products: ['ecs'] }
    })).toThrow('parameters[0].required 必须是 boolean');
    expect(checkAlicloudProtocol(fixture.targetRoot)).toMatchObject({ ok: false });
  });
});
