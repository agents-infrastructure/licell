import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  describeAlicloudCapability,
  getAlicloudCapabilityIndexStats,
  searchAlicloudCapabilities,
  searchAlicloudProducts
} from '../utils/alicloud-capabilities';

describe('Alibaba Cloud capability index', () => {
  it('exposes the complete protocol snapshot with provenance', () => {
    const stats = getAlicloudCapabilityIndexStats();
    expect(stats.productCount).toBe(156);
    expect(stats.capabilityCount).toBe(16242);
    expect(stats.source).toMatchObject({
      protocolSchemaVersion: 'licell-alicloud-openapi-snapshot@1.0',
      metadataCommit: '2563691c22229a0b493606e11166b95896707095'
    });
  });

  it('keeps every REST path placeholder backed by a normalized Path parameter', () => {
    const index = JSON.parse(readFileSync('protocol/alicloud-openapi/capabilities.json', 'utf8')) as {
      capabilities: Array<{
        apiStyle: string;
        pathPattern: string;
        parameters: Array<{ name: string; position: string }>;
      }>;
    };
    const normalize = (value: string) => value.replace(/[^a-z0-9]/gi, '').toLowerCase();
    const missing: string[] = [];
    let pathSegmentCount = 0;
    for (const capability of index.capabilities.filter((item) => item.apiStyle === 'restful')) {
      const pathParameters = new Set(capability.parameters
        .filter((parameter) => parameter.position.toLowerCase() === 'path')
        .map((parameter) => normalize(parameter.name)));
      for (const match of capability.pathPattern.matchAll(/\[([^\]]+)\]/g)) {
        pathSegmentCount += 1;
        if (!pathParameters.has(normalize(match[1]!))) missing.push(match[1]!);
      }
    }

    expect(pathSegmentCount).toBe(2421);
    expect(missing).toEqual([]);
  });

  it('maps a Chinese intent to the expected product operation', () => {
    const result = searchAlicloudCapabilities({ intent: '创建 VPC', limit: 5 });
    expect(result.documentKind).toBe('licell-alicloud-capability-search');
    expect(result.capabilities[0]).toMatchObject({
      shorthand: 'vpc.CreateVpc',
      maturity: 'raw',
      action: 'create',
      safetyHint: 'mutating'
    });
    expect(result.truncated).toBe(true);
  });

  it('discovers the complete product space before narrowing to operations', () => {
    const all = searchAlicloudProducts({ limit: 200 });
    expect(all.documentKind).toBe('licell-alicloud-product-search');
    expect(all.total).toBe(156);
    expect(all.products).toHaveLength(156);

    const kubernetes = searchAlicloudProducts({ query: 'k8s', limit: 5 });
    expect(kubernetes.products[0]).toMatchObject({
      directory: 'cs',
      code: 'CS',
      apiCount: 139,
      searchCommand: 'licell capability search --product cs --output json'
    });
  });

  it('ranks collection operations from natural intent across products', () => {
    const clusters = searchAlicloudCapabilities({
      intent: '用 licell 帮我看下我阿里云上有几个 k8s 集群',
      action: 'inspect',
      limit: 5
    });
    expect(clusters.capabilities[0]?.shorthand).toBe('cs.DescribeClusters');
    expect(clusters.nextActions[0]?.commandTemplate).toBe(
      'licell capability describe cs.DescribeClusters --output json'
    );

    const instances = searchAlicloudCapabilities({
      intent: '我有多少台云服务器',
      action: 'inspect',
      limit: 5
    });
    expect(instances.capabilities[0]?.shorthand).toBe('ecs.DescribeInstances');
  });

  it('ignores conversational modifiers after identifying a product and collection intent', () => {
    const products = searchAlicloudProducts({
      query: '杭州区域有几个容器服务，都部署了什么服务',
      limit: 5
    });
    expect(products.products[0]?.directory).toBe('cs');

    const capabilities = searchAlicloudCapabilities({
      intent: '杭州区域有几个容器服务，都部署了什么服务',
      action: 'inspect',
      limit: 5
    });
    expect(capabilities.capabilities[0]?.shorthand).toBe('cs.DescribeClusters');
    expect(capabilities.nextActions[0]?.commandTemplate).toBe(
      'licell capability describe cs.DescribeClusters --output json'
    );
  });

  it('filters by product, action, transport style and method', () => {
    const result = searchAlicloudCapabilities({
      product: 'Ecs',
      action: 'inspect',
      apiStyle: 'rpc',
      method: 'GET',
      limit: 10
    });
    expect(result.count).toBe(10);
    expect(result.capabilities.every((capability) => (
      capability.product === 'ecs'
      && capability.action === 'inspect'
      && capability.apiStyle === 'rpc'
    ))).toBe(true);
  });

  it.each([
    ['vpc', 'list vpcs', 'vpc.DescribeVpcs'],
    ['ram', 'list users', 'ram.ListUsers'],
    ['cdn', 'describe user domains', 'cdn.DescribeUserDomains'],
    ['sls', 'list project', 'sls.ListProject'],
    ['rds', 'list db instances', 'rds.DescribeDBInstances']
  ])('routes a concise agent intent for %s through the raw capability index', (product, intent, expected) => {
    const result = searchAlicloudCapabilities({ product, intent, action: 'inspect', limit: 5 });
    expect(result.capabilities[0]?.shorthand).toBe(expected);
  });

  it('describes input JSON Schema and raw provenance case-insensitively', () => {
    const result = describeAlicloudCapability('ALICLOUD:VPC:CREATEVPC');
    expect(result.documentKind).toBe('licell-alicloud-capability');
    expect(result.capability).toMatchObject({
      ref: 'alicloud:vpc:CreateVpc',
      maturity: 'raw',
      operation: 'CreateVpc',
      safety: { level: 'mutating', confidence: 'heuristic' },
      provenance: {
        metadataPath: 'metadatas/vpc/CreateVpc.json',
        metadataCommit: '2563691c22229a0b493606e11166b95896707095'
      },
      inputSchema: {
        type: 'object',
        required: ['RegionId'],
        additionalProperties: false
      }
    });
    expect(result.capability.inputSchema.properties.RegionId).toMatchObject({
      type: 'string',
      'x-alicloud-type': 'String',
      'x-alicloud-position': 'Query'
    });
  });

  it('returns search suggestions for an inexact ref', () => {
    expect(() => describeAlicloudCapability('vpc.CreateVp')).toThrow(/候选: vpc\.CreateVpc/);
  });
});
