import { brotliDecompressSync } from 'node:zlib';
import { ALICLOUD_CAPABILITY_INDEX_BROTLI_BASE64 } from '../generated/alicloud-capability-index';
import type {
  AlicloudCapabilityIndex,
  GeneratedCapability,
  GeneratedCapabilityAction,
  GeneratedCapabilityProduct,
  GeneratedCapabilitySafety
} from './alicloud-capability-generator';

export const ALICLOUD_CAPABILITY_DOCUMENT_KIND = 'licell-alicloud-capability';
export const ALICLOUD_CAPABILITY_SEARCH_KIND = 'licell-alicloud-capability-search';
export const ALICLOUD_PRODUCT_SEARCH_KIND = 'licell-alicloud-product-search';
export const ALICLOUD_CAPABILITY_SCHEMA = '1.0';

let indexCache: AlicloudCapabilityIndex | undefined;

function capabilityIndex() {
  if (!indexCache) {
    const json = brotliDecompressSync(Buffer.from(ALICLOUD_CAPABILITY_INDEX_BROTLI_BASE64, 'base64')).toString('utf8');
    indexCache = JSON.parse(json) as AlicloudCapabilityIndex;
  }
  return indexCache;
}

const INTENT_ALIASES: Array<[RegExp, string]> = [
  [/(列出|列表|所有|全部|几个|多少|数量)/g, ' inspect collection '],
  [/(创建|新增|添加|开通|申请)/g, ' create '],
  [/(查询|查看|看看|看下|查下|查一下|获取|搜索|描述|盘点|统计)/g, ' inspect '],
  [/(修改|更新|设置|调整|升级)/g, ' update '],
  [/(删除|移除|释放|关闭|注销)/g, ' delete '],
  [/(执行|调用|触发|运行)/g, ' execute ']
];

const QUERY_NOISE = /(?:用\s*licell|licell|阿里云上|阿里云|帮我|给我|我想|我要|我有|请|一下|当前|现在)/gi;
const QUERY_STOP_WORDS = new Set(['我', '有', '的', '上', '台', '个', '服务']);
const PRODUCT_SEARCH_RESOURCE_WORDS = new Set(['实例', 'instance', 'instances', '集群', 'cluster', 'clusters', '节点', 'node', 'nodes']);

const QUERY_EXPANSIONS: Array<[RegExp, string]> = [
  [/\b(?:k8s|kubernetes|ack|acs)\b/gi, ' cs '],
  [/(?:云服务器|虚拟机)/g, ' ecs 实例 ']
];

// These are cloud vocabulary aliases, not per-operation routing rules. Product
// names and operation/resource names still come from the protocol snapshot.
const TERM_ALIASES: Record<string, string[]> = {
  k8s: ['k8s', 'kubernetes', 'ack', 'acs', 'cs', 'container'],
  kubernetes: ['k8s', 'kubernetes', 'ack', 'acs', 'cs', 'container'],
  ack: ['k8s', 'kubernetes', 'ack', 'cs', 'container'],
  acs: ['k8s', 'kubernetes', 'acs', 'cs', 'container'],
  '集群': ['集群', 'cluster', 'clusters'],
  '容器': ['容器', 'container', 'kubernetes'],
  '实例': ['实例', 'instance', 'instances'],
  '节点': ['节点', 'node', 'nodes'],
  '项目': ['项目', 'project', 'projects'],
  '存储桶': ['存储桶', 'bucket', 'buckets'],
  '函数': ['函数', 'function', 'functions', 'fc', 'serverless'],
  '云服务器': ['云服务器', 'server', 'instance', 'ecs', 'vm'],
  '虚拟机': ['虚拟机', 'server', 'instance', 'ecs', 'vm'],
  '对象存储': ['对象存储', 'object', 'storage', 'oss', 'bucket'],
  '数据库': ['数据库', 'database', 'db', 'rds'],
  '缓存': ['缓存', 'cache', 'redis', 'tair'],
  '日志': ['日志', 'log', 'logs', 'sls']
};

const PRODUCT_ALIASES: Record<string, string[]> = {
  cs: ['ack', 'acs', 'k8s', 'kubernetes', '容器计算服务'],
  ecs: ['vm', '虚拟机', '云服务器'],
  fc: ['faas', 'serverless', '函数计算'],
  'fc-open': ['faas', 'serverless', '函数计算'],
  oss: ['object-storage', '对象存储'],
  rds: ['database', 'db', '云数据库'],
  'r-kvstore': ['redis', 'tair', 'cache', '缓存'],
  sls: ['log-service', '日志服务']
};

export interface CapabilitySearchOptions {
  query?: string;
  intent?: string;
  product?: string;
  action?: GeneratedCapabilityAction;
  apiStyle?: string;
  method?: string;
  limit?: number;
  offset?: number;
}

export interface CapabilitySearchItem {
  ref: string;
  shorthand: string;
  maturity: 'raw';
  product: string;
  productCode: string;
  productName: { en: string; zh: string };
  version: string;
  apiStyle: string;
  operation: string;
  action: GeneratedCapabilityAction;
  resource: string;
  safetyHint: GeneratedCapabilitySafety;
  parameterCount: number;
  requiredParameterCount: number;
  describeCommand: string;
}

export interface ProductSearchOptions {
  query?: string;
  limit?: number;
  offset?: number;
}

function words(value: string) {
  let normalized = value;
  for (const [pattern, replacement] of QUERY_EXPANSIONS) normalized = normalized.replace(pattern, replacement);
  for (const [pattern, replacement] of INTENT_ALIASES) normalized = normalized.replace(pattern, replacement);
  for (const phrase of Object.keys(TERM_ALIASES)
    .filter((item) => /[\u4e00-\u9fff]/.test(item))
    .sort((left, right) => right.length - left.length)) {
    normalized = normalized.replaceAll(phrase, ` ${phrase} `);
  }
  return normalized
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([a-z0-9])([\u4e00-\u9fff])/gi, '$1 $2')
    .replace(/([\u4e00-\u9fff])([a-z0-9])/gi, '$1 $2')
    .replace(QUERY_NOISE, ' ')
    .toLowerCase()
    .split(/[^a-z0-9\u4e00-\u9fff]+/)
    .filter((word) => Boolean(word) && !QUERY_STOP_WORDS.has(word));
}

function termAlternatives(word: string) {
  return TERM_ALIASES[word] || [word];
}

function productAliases(product: GeneratedCapabilityProduct | undefined) {
  return product ? PRODUCT_ALIASES[product.directory.toLowerCase()] || [] : [];
}

function matchesSearchTerm(candidate: string, alternative: string) {
  if (candidate === alternative) return true;
  const canUsePrefix = alternative.length >= 4 || /[\u4e00-\u9fff]{2,}/.test(alternative);
  return canUsePrefix && (candidate.startsWith(alternative) || alternative.startsWith(candidate));
}

function productText(product: GeneratedCapabilityProduct | undefined) {
  return product
    ? [product.directory, product.code, product.name.en, product.name.zh].join(' ')
    : '';
}

function scoreCapability(capability: GeneratedCapability, product: GeneratedCapabilityProduct | undefined, query: string) {
  const queryWords = [...new Set(words(query))];
  if (queryWords.length === 0) return 1;
  const operationWords = words(capability.operation);
  const productWords = words(productText(product));
  const resourceWords = words(capability.resource);
  const collection = capability.operation.startsWith('List')
    || Boolean(resourceWords.at(-1)?.endsWith('s'));
  const haystack = new Set([
    ...words(capability.ref),
    ...words(capability.shorthand),
    ...operationWords,
    ...words(capability.resource),
    ...productWords,
    ...productAliases(product).flatMap(words),
    capability.action,
    ...(collection ? ['collection', 'list', 'count'] : [])
  ]);
  const matches = (word: string) => termAlternatives(word).some((alternative) => (
    [...haystack].some((candidate) => matchesSearchTerm(candidate, alternative))
  ));
  const lowerQuery = query.toLowerCase();
  const referencePrefix = capability.ref.toLowerCase().startsWith(lowerQuery)
    || capability.shorthand.toLowerCase().startsWith(lowerQuery);
  if (!referencePrefix && !queryWords.every(matches)) return 0;

  let score = queryWords.length * 10;
  if (capability.ref.toLowerCase() === lowerQuery || capability.shorthand.toLowerCase() === lowerQuery) score += 1000;
  if (capability.operation.toLowerCase() === lowerQuery) score += 800;
  if (referencePrefix) score += 600;
  if (capability.product.toLowerCase() === lowerQuery || capability.productCode.toLowerCase() === lowerQuery) score += 400;
  if (queryWords.includes(capability.product.toLowerCase()) || queryWords.includes(capability.productCode.toLowerCase())) score += 300;
  if (queryWords.some((word) => productAliases(product).includes(word))) score += 300;
  if (queryWords.includes('collection') && collection) score += 100;
  const resourceQueryWords = queryWords.filter((word) => ![
    'inspect', 'create', 'update', 'delete', 'execute', 'collection'
  ].includes(word)
    && word !== capability.product.toLowerCase()
    && word !== capability.productCode.toLowerCase()
    && !productAliases(product).includes(word));
  if (resourceQueryWords.length > 0 && resourceQueryWords.every((word) => termAlternatives(word).some((alternative) => (
    resourceWords.some((candidate) => matchesSearchTerm(candidate, alternative))
  )))) score += 100;
  if (capability.product.toLowerCase() === capability.resource.toLowerCase()) score += 50;
  if (operationWords.join(' ') === queryWords.join(' ')) score += 200;
  return score - operationWords.length;
}

function searchItem(capability: GeneratedCapability, product: GeneratedCapabilityProduct): CapabilitySearchItem {
  return {
    ref: capability.ref,
    shorthand: capability.shorthand,
    maturity: capability.maturity,
    product: capability.product,
    productCode: capability.productCode,
    productName: product.name,
    version: capability.version,
    apiStyle: capability.apiStyle,
    operation: capability.operation,
    action: capability.action,
    resource: capability.resource,
    safetyHint: capability.safetyHint,
    parameterCount: capability.parameters.length,
    requiredParameterCount: capability.parameters.filter((parameter) => parameter.required).length,
    describeCommand: `licell capability describe ${capability.shorthand} --output json`
  };
}

function boundedInteger(value: number | undefined, fallback: number, min: number, max: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(value!)));
}

export function searchAlicloudCapabilities(options: CapabilitySearchOptions = {}) {
  const index = capabilityIndex();
  const query = [options.query, options.intent].filter(Boolean).join(' ').trim();
  const productByDirectory = new Map(index.products.map((product) => [product.directory, product]));
  const productFilter = options.product?.trim().toLowerCase();
  const apiStyleFilter = options.apiStyle?.trim().toLowerCase();
  const methodFilter = options.method?.trim().toUpperCase();
  const scored = index.capabilities.flatMap((capability) => {
    if (productFilter && capability.product.toLowerCase() !== productFilter && capability.productCode.toLowerCase() !== productFilter) return [];
    if (options.action && capability.action !== options.action) return [];
    if (apiStyleFilter && capability.apiStyle.toLowerCase() !== apiStyleFilter) return [];
    if (methodFilter && !capability.method.toUpperCase().split('|').includes(methodFilter)) return [];
    const score = scoreCapability(capability, productByDirectory.get(capability.product), query);
    return score > 0 ? [{ capability, score }] : [];
  }).sort((left, right) => right.score - left.score || left.capability.ref.localeCompare(right.capability.ref));
  const offset = boundedInteger(options.offset, 0, 0, Number.MAX_SAFE_INTEGER);
  const limit = boundedInteger(options.limit, 20, 1, 100);
  const capabilities = scored.slice(offset, offset + limit).map(({ capability }) => (
    searchItem(capability, productByDirectory.get(capability.product)!)
  ));

  return {
    documentKind: ALICLOUD_CAPABILITY_SEARCH_KIND,
    documentSchemaVersion: ALICLOUD_CAPABILITY_SCHEMA,
    source: index.source,
    query: {
      text: query,
      product: options.product || null,
      action: options.action || null,
      apiStyle: options.apiStyle || null,
      method: options.method || null,
      offset,
      limit
    },
    total: scored.length,
    count: capabilities.length,
    truncated: offset + capabilities.length < scored.length,
    capabilities,
    nextActions: capabilities.length > 0 ? [{
      title: '查看首个 capability 的执行定义',
      description: '读取完整参数 schema，并由 execution 字段决定使用领域命令还是 raw fallback。',
      commandTemplate: capabilities[0]!.describeCommand,
      phase: 'inspect',
      priority: 'primary',
      source: 'capability-search'
    }] : [],
    limitations: [
      'raw capability 仅来自 OpenAPI metadata，尚未包含经过审核的业务语义、幂等性、前置条件、响应 schema 或回滚策略。',
      'safetyHint 由 operation 名称启发式推断，执行任何写操作前必须由领域命令或人工复核。'
    ]
  };
}

function scoreProduct(product: GeneratedCapabilityProduct, query: string) {
  const queryWords = [...new Set(words(query))].filter((word) => ![
    'inspect', 'create', 'update', 'delete', 'execute', 'collection'
  ].includes(word) && !PRODUCT_SEARCH_RESOURCE_WORDS.has(word));
  if (queryWords.length === 0) return 1;
  const haystack = new Set([...words(productText(product)), ...productAliases(product).flatMap(words)]);
  const matched = queryWords.every((word) => termAlternatives(word).some((alternative) => (
    [...haystack].some((candidate) => matchesSearchTerm(candidate, alternative))
  )));
  if (!matched) return 0;
  let score = queryWords.length * 10;
  if (queryWords.includes(product.directory.toLowerCase()) || queryWords.includes(product.code.toLowerCase())) score += 400;
  if (queryWords.some((word) => productAliases(product).includes(word))) score += 300;
  return score;
}

export function searchAlicloudProducts(options: ProductSearchOptions = {}) {
  const index = capabilityIndex();
  const query = options.query?.trim() || '';
  const scored = index.products
    .map((product) => ({ product, score: scoreProduct(product, query) }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.product.directory.localeCompare(right.product.directory));
  const offset = boundedInteger(options.offset, 0, 0, Number.MAX_SAFE_INTEGER);
  const limit = boundedInteger(options.limit, 50, 1, 200);
  const products = scored.slice(offset, offset + limit).map(({ product }) => ({
    directory: product.directory,
    code: product.code,
    name: product.name,
    version: product.version,
    apiStyle: product.apiStyle,
    apiCount: product.apiCount,
    searchCommand: `licell capability search --product ${product.directory} --output json`
  }));
  return {
    documentKind: ALICLOUD_PRODUCT_SEARCH_KIND,
    documentSchemaVersion: ALICLOUD_CAPABILITY_SCHEMA,
    source: index.source,
    query: { text: query, offset, limit },
    total: scored.length,
    count: products.length,
    truncated: offset + products.length < scored.length,
    products,
    nextActions: products.length > 0 ? [{
      title: '搜索首个产品的 capability',
      description: '进入该产品的 operation 能力空间。',
      commandTemplate: products[0]!.searchCommand,
      phase: 'inspect',
      priority: 'primary',
      source: 'capability-products'
    }] : []
  };
}

function resolveCapability(ref: string) {
  const index = capabilityIndex();
  const normalized = ref.trim().toLowerCase();
  return index.capabilities.find((capability) => (
    capability.ref.toLowerCase() === normalized
    || capability.shorthand.toLowerCase() === normalized
  ));
}

function jsonSchemaProperty(parameter: GeneratedCapability['parameters'][number]): Record<string, unknown> {
  const common = {
    'x-alicloud-type': parameter.type,
    'x-alicloud-position': parameter.position
  };
  if (parameter.type === 'String') return { type: 'string', ...common };
  if (parameter.type === 'Integer' || parameter.type === 'Long') return { type: 'integer', ...common };
  if (parameter.type === 'Float' || parameter.type === 'Double') return { type: 'number', ...common };
  if (parameter.type === 'Boolean') return { type: 'boolean', ...common };
  if (parameter.type === 'RepeatList' || parameter.type === 'Array') {
    const items: Record<string, unknown> = parameter.subParameters?.length
      ? {
          type: 'object',
          required: parameter.subParameters.filter((item) => item.required).map((item) => item.name),
          properties: Object.fromEntries(parameter.subParameters.map((item) => [item.name, jsonSchemaProperty(item)])),
          additionalProperties: false
        }
      : {};
    return { type: 'array', items, ...common };
  }
  if (parameter.type === 'Json' || parameter.type === 'Struct') return { type: 'object', ...common };
  return { ...common };
}

function inputSchema(capability: GeneratedCapability) {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    required: capability.parameters.filter((parameter) => parameter.required).map((parameter) => parameter.name),
    properties: Object.fromEntries(capability.parameters.map((parameter) => [parameter.name, jsonSchemaProperty(parameter)])),
    additionalProperties: false
  };
}

export function describeAlicloudCapability(ref: string) {
  const index = capabilityIndex();
  const capability = resolveCapability(ref);
  if (!capability) {
    const suggestions = searchAlicloudCapabilities({ query: ref, limit: 5 }).capabilities.map((item) => item.shorthand);
    const suffix = suggestions.length > 0 ? `；候选: ${suggestions.join(', ')}` : '';
    throw new Error(`未找到 capability: ${ref}${suffix}`);
  }
  const product = index.products.find((item) => item.directory === capability.product)!;
  return {
    documentKind: ALICLOUD_CAPABILITY_DOCUMENT_KIND,
    documentSchemaVersion: ALICLOUD_CAPABILITY_SCHEMA,
    source: index.source,
    capability: {
      ...capability,
      product: {
        directory: product.directory,
        code: product.code,
        version: product.version,
        name: product.name,
        apiStyle: product.apiStyle,
        endpoint: {
          global: product.globalEndpoint || null,
          locationServiceCode: product.locationServiceCode || null,
          regional: product.regionalEndpoints,
          regionalVpc: product.regionalVpcEndpoints
        }
      },
      inputSchema: inputSchema(capability),
      safety: {
        level: capability.safetyHint,
        confidence: 'heuristic',
        reason: '由 operation 名称前缀推断，未经过 capability overlay 审核。'
      },
      provenance: {
        metadataPath: capability.metadataPath,
        metadataCommit: index.source.metadataCommit,
        protocolTreeSha256: index.source.protocolTreeSha256
      }
    },
    nextActions: [
      {
        title: '优先查找 Licell 领域命令',
        description: 'raw metadata 没有完整业务语义，执行前先确认是否已有经过审核的领域命令。',
        commandTemplate: `licell catalog --root-command ${capability.product} --output json`,
        phase: 'inspect',
        priority: 'primary',
        source: 'capability-describe'
      }
    ],
    limitations: [
      '该 capability 的 maturity 为 raw，不能替代 Licell workflow 或经过审核的领域命令。',
      'metadata 不提供响应 schema、幂等性、前置条件和回滚策略。'
    ]
  };
}

export function getAlicloudCapabilityIndexStats() {
  const index = capabilityIndex();
  return { ...index.stats, source: index.source };
}
