import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { brotliCompressSync, constants as zlibConstants } from 'node:zlib';
import { basename, dirname, join, resolve } from 'node:path';
import type { AlicloudProtocolManifest } from './alicloud-protocol';

export const ALICLOUD_CAPABILITY_INDEX_KIND = 'licell-alicloud-capability-index';
export const ALICLOUD_CAPABILITY_INDEX_SCHEMA = '1.0';

export type GeneratedCapabilityAction = 'inspect' | 'create' | 'update' | 'delete' | 'execute' | 'unknown';
export type GeneratedCapabilitySafety = 'safe' | 'mutating' | 'destructive' | 'unknown';

export interface GeneratedCapabilityParameter {
  name: string;
  position: string;
  type: string;
  required: boolean;
  subParameters?: GeneratedCapabilityParameter[];
}

export interface GeneratedCapabilityProduct {
  directory: string;
  code: string;
  version: string;
  name: {
    en: string;
    zh: string;
  };
  apiStyle: string;
  globalEndpoint: string;
  locationServiceCode: string;
  regionalEndpoints: Record<string, string>;
  regionalVpcEndpoints: Record<string, string>;
  apiCount: number;
}

export interface GeneratedCapability {
  ref: string;
  shorthand: string;
  maturity: 'raw';
  product: string;
  productCode: string;
  version: string;
  apiStyle: string;
  operation: string;
  protocol: string;
  method: string;
  pathPattern: string;
  action: GeneratedCapabilityAction;
  resource: string;
  safetyHint: GeneratedCapabilitySafety;
  parameters: GeneratedCapabilityParameter[];
  metadataPath: string;
}

export interface AlicloudCapabilityIndex {
  kind: typeof ALICLOUD_CAPABILITY_INDEX_KIND;
  schemaVersion: typeof ALICLOUD_CAPABILITY_INDEX_SCHEMA;
  source: {
    protocolSchemaVersion: string;
    metadataRepository: string;
    metadataCommit: string;
    metadataCommitDate: string;
    protocolTreeSha256: string;
  };
  stats: {
    productCount: number;
    capabilityCount: number;
  };
  products: GeneratedCapabilityProduct[];
  capabilities: GeneratedCapability[];
}

interface RawProduct {
  code?: unknown;
  version?: unknown;
  name?: unknown;
  api_style?: unknown;
  global_endpoint?: unknown;
  location_service_code?: unknown;
  regional_endpoints?: unknown;
  regional_vpc_endpoints?: unknown;
  apis?: unknown;
}

interface RawApi {
  name?: unknown;
  protocol?: unknown;
  method?: unknown;
  pathPattern?: unknown;
  parameters?: unknown;
}

const ACTION_PREFIXES: Array<[GeneratedCapabilityAction, string[]]> = [
  ['inspect', ['Describe', 'Get', 'List', 'Query', 'Search', 'Check', 'Read', 'Lookup']],
  ['create', ['Create', 'Add', 'Allocate', 'Apply', 'Attach', 'Associate', 'Bind', 'Enable', 'Import', 'Open', 'Purchase', 'Register', 'Start']],
  ['update', ['Change', 'Modify', 'Move', 'Renew', 'Reset', 'Resize', 'Scale', 'Set', 'Update', 'Upgrade']],
  ['delete', ['Cancel', 'Close', 'Delete', 'Detach', 'Disable', 'Release', 'Remove', 'Revoke', 'Stop', 'Terminate', 'Unassociate', 'Unbind', 'Unregister']],
  ['execute', ['Execute', 'Invoke', 'Run', 'Send', 'Submit', 'Trigger']]
];

function parseJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function stringMap(value: unknown) {
  return Object.fromEntries(
    Object.entries(record(value))
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
      .sort(([left], [right]) => left.localeCompare(right))
  );
}

function inferAction(operation: string): GeneratedCapabilityAction {
  for (const [action, prefixes] of ACTION_PREFIXES) {
    if (prefixes.some((prefix) => operation.startsWith(prefix))) return action;
  }
  return 'unknown';
}

function inferSafety(action: GeneratedCapabilityAction): GeneratedCapabilitySafety {
  if (action === 'inspect') return 'safe';
  if (action === 'delete') return 'destructive';
  if (action === 'create' || action === 'update' || action === 'execute') return 'mutating';
  return 'unknown';
}

function inferResource(operation: string, action: GeneratedCapabilityAction) {
  const prefix = ACTION_PREFIXES.find(([candidate]) => candidate === action)?.[1]
    .find((candidate) => operation.startsWith(candidate));
  return prefix ? operation.slice(prefix.length) || operation : operation;
}

function normalizeParameters(value: unknown): GeneratedCapabilityParameter[] {
  if (!Array.isArray(value)) return [];
  return value.map((parameter) => {
    const item = record(parameter);
    const subParameters = normalizeParameters(item.sub_parameters);
    return {
      name: stringValue(item.name),
      position: stringValue(item.position),
      type: stringValue(item.type),
      required: item.required === true,
      ...(subParameters.length > 0 ? { subParameters } : {})
    };
  });
}

function productName(value: unknown) {
  const name = record(value);
  return { en: stringValue(name.en), zh: stringValue(name.zh) };
}

function requireManifest(protocolRoot: string) {
  const manifest = parseJson(join(protocolRoot, 'manifest.json')) as AlicloudProtocolManifest;
  if (!manifest || !Array.isArray(manifest.products) || !manifest.source || !manifest.content) {
    throw new Error('protocol manifest 格式无效');
  }
  return manifest;
}

function requireProducts(protocolRoot: string) {
  const value = record(parseJson(join(protocolRoot, 'metadatas', 'products.json')));
  if (!Array.isArray(value.products)) throw new Error('protocol products.json 缺少 products 数组');
  return value.products as RawProduct[];
}

export function buildAlicloudCapabilityIndex(protocolRoot: string): AlicloudCapabilityIndex {
  const manifest = requireManifest(protocolRoot);
  const rawProducts = requireProducts(protocolRoot);
  const productByDirectory = new Map(rawProducts.map((product) => [stringValue(product.code).toLowerCase(), product]));
  const products: GeneratedCapabilityProduct[] = [];
  const capabilities: GeneratedCapability[] = [];

  for (const manifestProduct of manifest.products) {
    const rawProduct = productByDirectory.get(manifestProduct.directory.toLowerCase());
    if (!rawProduct) throw new Error(`products.json 缺少 ${manifestProduct.directory}`);
    const product: GeneratedCapabilityProduct = {
      directory: manifestProduct.directory,
      code: manifestProduct.code,
      version: manifestProduct.version,
      name: productName(rawProduct.name),
      apiStyle: manifestProduct.apiStyle,
      globalEndpoint: stringValue(rawProduct.global_endpoint),
      locationServiceCode: stringValue(rawProduct.location_service_code),
      regionalEndpoints: stringMap(rawProduct.regional_endpoints),
      regionalVpcEndpoints: stringMap(rawProduct.regional_vpc_endpoints),
      apiCount: manifestProduct.apiCount
    };
    products.push(product);

    const operations = Array.isArray(rawProduct.apis)
      ? rawProduct.apis.filter((operation): operation is string => typeof operation === 'string').sort()
      : [];
    for (const operation of operations) {
      const metadataPath = `metadatas/${manifestProduct.directory}/${operation}.json`;
      const api = parseJson(join(protocolRoot, metadataPath)) as RawApi;
      const action = inferAction(operation);
      capabilities.push({
        ref: `alicloud:${manifestProduct.directory}:${operation}`,
        shorthand: `${manifestProduct.directory}.${operation}`,
        maturity: 'raw',
        product: manifestProduct.directory,
        productCode: manifestProduct.code,
        version: manifestProduct.version,
        apiStyle: manifestProduct.apiStyle,
        operation,
        protocol: stringValue(api.protocol),
        method: stringValue(api.method),
        pathPattern: stringValue(api.pathPattern),
        action,
        resource: inferResource(operation, action),
        safetyHint: inferSafety(action),
        parameters: normalizeParameters(api.parameters),
        metadataPath
      });
    }
  }

  products.sort((left, right) => left.directory.localeCompare(right.directory));
  capabilities.sort((left, right) => left.ref.localeCompare(right.ref));
  return {
    kind: ALICLOUD_CAPABILITY_INDEX_KIND,
    schemaVersion: ALICLOUD_CAPABILITY_INDEX_SCHEMA,
    source: {
      protocolSchemaVersion: manifest.schemaVersion,
      metadataRepository: manifest.source.repository,
      metadataCommit: manifest.source.metadataCommit,
      metadataCommitDate: manifest.source.metadataCommitDate,
      protocolTreeSha256: manifest.content.treeSha256
    },
    stats: {
      productCount: products.length,
      capabilityCount: capabilities.length
    },
    products,
    capabilities
  };
}

export function serializeAlicloudCapabilityIndex(index: AlicloudCapabilityIndex) {
  return `${JSON.stringify(index)}\n`;
}

function defaultEmbeddedIndexPath(protocolRoot: string) {
  return resolve(protocolRoot, '..', '..', 'src', 'generated', 'alicloud-capability-index.ts');
}

export function serializeEmbeddedAlicloudCapabilityIndex(content: string) {
  const compressed = brotliCompressSync(Buffer.from(content), {
    params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 9 }
  }).toString('base64');
  return `// Generated by scripts/generate-alicloud-capabilities.ts. Do not edit.\nexport const ALICLOUD_CAPABILITY_INDEX_BROTLI_BASE64 = '${compressed}';\n`;
}

export function writeAlicloudCapabilityIndex(protocolRoot: string, embeddedPath = defaultEmbeddedIndexPath(protocolRoot)) {
  const index = buildAlicloudCapabilityIndex(protocolRoot);
  const path = join(protocolRoot, 'capabilities.json');
  const content = serializeAlicloudCapabilityIndex(index);
  const embeddedContent = serializeEmbeddedAlicloudCapabilityIndex(content);
  const indexUpdated = !existsSync(path) || readFileSync(path, 'utf8') !== content;
  const embeddedUpdated = !existsSync(embeddedPath) || readFileSync(embeddedPath, 'utf8') !== embeddedContent;
  if (indexUpdated) writeFileSync(path, content);
  if (embeddedUpdated) {
    mkdirSync(dirname(embeddedPath), { recursive: true });
    writeFileSync(embeddedPath, embeddedContent);
  }
  return { path, embeddedPath, index, updated: indexUpdated || embeddedUpdated, indexUpdated, embeddedUpdated };
}

export function checkAlicloudCapabilityIndex(protocolRoot: string, embeddedPath = defaultEmbeddedIndexPath(protocolRoot)) {
  const path = join(protocolRoot, 'capabilities.json');
  const issues: string[] = [];
  if (!existsSync(path)) return { ok: false, path, embeddedPath, issues: ['缺少 capabilities.json'] };
  const expected = serializeAlicloudCapabilityIndex(buildAlicloudCapabilityIndex(protocolRoot));
  const actual = readFileSync(path, 'utf8');
  if (actual !== expected) issues.push('capabilities.json 已过期，请运行 protocol:update');
  const expectedEmbedded = serializeEmbeddedAlicloudCapabilityIndex(expected);
  if (!existsSync(embeddedPath)) issues.push('缺少嵌入式 capability 索引');
  else if (readFileSync(embeddedPath, 'utf8') !== expectedEmbedded) {
    issues.push('嵌入式 capability 索引已过期，请运行 protocol:update');
  }
  return { ok: issues.length === 0, path, embeddedPath, issues };
}

export function capabilityOperationFromPath(path: string) {
  return basename(path, '.json');
}
