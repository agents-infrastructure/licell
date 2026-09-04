import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { createHash } from 'node:crypto';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';

export const ALICLOUD_PROTOCOL_SCHEMA = 'licell-alicloud-openapi-snapshot@1.0';

export type ProtocolChangeKind =
  | 'additive'
  | 'parameter-breaking'
  | 'removed'
  | 'endpoint-version'
  | 'behavior-unknown';

export interface AlicloudProtocolSource {
  repository: string;
  aliyunCliCommit?: string;
  metadataCommit: string;
  metadataCommitDate: string;
}

export interface AlicloudProtocolScope {
  mode: 'selected-products' | 'full';
  products: string[];
}

export interface AlicloudProtocolProductManifest {
  directory: string;
  code: string;
  version: string;
  apiStyle: string;
  apiCount: number;
  treeSha256: string;
}

export interface AlicloudProtocolManifest {
  schemaVersion: typeof ALICLOUD_PROTOCOL_SCHEMA;
  source: AlicloudProtocolSource;
  scope: AlicloudProtocolScope;
  content: {
    fileCount: number;
    treeSha256: string;
  };
  products: AlicloudProtocolProductManifest[];
  generator: {
    path: 'scripts/update-alicloud-protocol.ts';
    version: 1;
  };
}

export interface ProtocolChange {
  kind: ProtocolChangeKind;
  path: string;
  reason: string;
}

export interface ProtocolUpdateResult {
  manifest: AlicloudProtocolManifest;
  changes: ProtocolChange[];
}

export interface ProtocolCheckResult {
  ok: boolean;
  manifest?: AlicloudProtocolManifest;
  issues: string[];
}

interface UpstreamProduct {
  code?: unknown;
  version?: unknown;
  api_style?: unknown;
  apis?: unknown;
}

interface ApiParameter {
  name?: unknown;
  position?: unknown;
  type?: unknown;
  required?: unknown;
}

interface ApiMetadata {
  name?: unknown;
  protocol?: unknown;
  method?: unknown;
  pathPattern?: unknown;
  parameters?: unknown;
}

const GENERATED_README = `# 阿里云 OpenAPI 协议快照

本目录保存从 \`aliyun-openapi-meta\` 复制的仓库内协议快照。Licell 在运行时只读
取本地快照，不连接上游仓库。

- 修改 \`scope.json\` 可调整纳入快照的产品。
- 运行 \`bun run protocol:update --source /path/to/aliyun-cli\` 人工升级快照。
- 运行 \`bun run protocol:check\` 校验文件哈希和 metadata 结构。
- 不要手工修改 \`metadatas/\` 或 \`manifest.json\`。
- \`capabilities.json\` 和 \`src/generated/alicloud-capability-index.ts\` 由升级命令确定性生成，分别用于审查和 CLI 内嵌读取。

复制的 metadata 继续遵循本目录内的 Apache-2.0 许可证。
`;

function sha256(value: Buffer | string) {
  return createHash('sha256').update(value).digest('hex');
}

function parseJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeProducts(products: readonly string[]) {
  return [...new Set(products.map((product) => product.trim().toLowerCase()).filter(Boolean))].sort();
}

function listFiles(root: string): string[] {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(root, entry.name);
      return entry.isDirectory() ? listFiles(path) : entry.isFile() ? [path] : [];
    })
    .sort();
}

function snapshotFiles(root: string) {
  return listFiles(join(root, 'metadatas'))
    .concat(existsSync(join(root, 'LICENSE')) ? [join(root, 'LICENSE')] : [])
    .sort();
}

function hashFiles(root: string, files: string[]) {
  const hash = createHash('sha256');
  for (const path of files) {
    const filePath = relative(root, path).split(sep).join('/');
    hash.update(filePath);
    hash.update('\0');
    hash.update(sha256(readFileSync(path)));
    hash.update('\n');
  }
  return hash.digest('hex');
}

function requireProductsIndex(metadataRoot: string): UpstreamProduct[] {
  const value = parseJson(join(metadataRoot, 'metadatas', 'products.json'));
  if (!isRecord(value) || !Array.isArray(value.products)) {
    throw new Error('metadatas/products.json 缺少 products 数组');
  }
  return value.products as UpstreamProduct[];
}

function productCode(product: UpstreamProduct) {
  return typeof product.code === 'string' ? product.code : '';
}

function productApis(product: UpstreamProduct) {
  return Array.isArray(product.apis)
    ? product.apis.filter((api): api is string => typeof api === 'string').sort()
    : [];
}

function loadScope(targetRoot: string, requested?: AlicloudProtocolScope): AlicloudProtocolScope {
  if (requested) {
    return { mode: requested.mode, products: normalizeProducts(requested.products) };
  }

  const path = join(targetRoot, 'scope.json');
  if (existsSync(path)) {
    const value = parseJson(path);
    if (!isRecord(value) || (value.mode !== 'selected-products' && value.mode !== 'full') || !Array.isArray(value.products)) {
      throw new Error(`${path} 格式无效`);
    }
    return {
      mode: value.mode,
      products: normalizeProducts(value.products.filter((item): item is string => typeof item === 'string'))
    };
  }

  return {
    mode: 'full',
    products: []
  };
}

function validateTargetRoot(targetRoot: string) {
  const absolute = resolve(targetRoot);
  if (
    absolute === resolve('/')
    || absolute === resolve(process.cwd())
    || basename(absolute) !== 'alicloud-openapi'
  ) {
    throw new Error(`拒绝使用危险的 protocol 目标目录: ${absolute}`);
  }
  if (
    existsSync(absolute)
    && readdirSync(absolute).length > 0
    && !existsSync(join(absolute, 'scope.json'))
    && !existsSync(join(absolute, 'manifest.json'))
  ) {
    throw new Error(`拒绝覆盖非 protocol 目录: ${absolute}`);
  }
}

function copyProtocolMetadata(metadataRoot: string, stagingRoot: string, scope: AlicloudProtocolScope) {
  const sourceMetadatas = join(metadataRoot, 'metadatas');
  const targetMetadatas = join(stagingRoot, 'metadatas');
  mkdirSync(targetMetadatas, { recursive: true });
  cpSync(join(sourceMetadatas, 'products.json'), join(targetMetadatas, 'products.json'));
  cpSync(join(metadataRoot, 'LICENSE'), join(stagingRoot, 'LICENSE'));

  const products = requireProductsIndex(metadataRoot);
  const productByDirectory = new Map(products.map((product) => [productCode(product).toLowerCase(), product]));
  const selected = scope.mode === 'full'
    ? readdirSync(sourceMetadatas, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()
    : scope.products;

  for (const directory of selected) {
    const sourceDirectory = join(sourceMetadatas, directory);
    if (!existsSync(sourceDirectory) || !statSync(sourceDirectory).isDirectory()) {
      throw new Error(`上游 metadata 不存在产品目录: ${directory}`);
    }
    const product = productByDirectory.get(directory.toLowerCase());
    if (!product) {
      throw new Error(`products.json 不存在产品声明: ${directory}`);
    }
    cpSync(sourceDirectory, join(targetMetadatas, directory), { recursive: true });
  }

  return { products, selected };
}

function createProductManifest(
  stagingRoot: string,
  products: UpstreamProduct[],
  selected: string[]
): AlicloudProtocolProductManifest[] {
  const productByDirectory = new Map(products.map((product) => [productCode(product).toLowerCase(), product]));
  return selected.map((directory) => {
    const product = productByDirectory.get(directory.toLowerCase());
    if (!product) throw new Error(`products.json 不存在产品声明: ${directory}`);
    const apiFiles = listFiles(join(stagingRoot, 'metadatas', directory))
      .filter((path) => path.endsWith('.json'));
    const expectedApis = productApis(product);
    const actualApis = apiFiles.map((path) => basename(path, '.json')).sort();
    if (JSON.stringify(actualApis) !== JSON.stringify(expectedApis)) {
      throw new Error(`${directory} API 文件与 products.json 声明不一致`);
    }
    for (const path of apiFiles) validateApiMetadata(path, basename(path, '.json'));
    return {
      directory,
      code: productCode(product),
      version: typeof product.version === 'string' ? product.version : '',
      apiStyle: typeof product.api_style === 'string' ? product.api_style : '',
      apiCount: apiFiles.length,
      treeSha256: hashFiles(stagingRoot, apiFiles)
    };
  });
}

function writeJson(path: string, value: unknown) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function parameterMap(metadata: ApiMetadata) {
  const parameters = Array.isArray(metadata.parameters) ? metadata.parameters as ApiParameter[] : [];
  return new Map(parameters.map((parameter) => [String(parameter.name), parameter]));
}

function validateApiMetadata(path: string, expectedName: string): ApiMetadata {
  const value = parseJson(path);
  if (!isRecord(value)) throw new Error(`${path} 必须是 JSON object`);
  const metadata = value as ApiMetadata;
  if (metadata.name !== expectedName) throw new Error(`${path} 的 name 必须是 ${expectedName}`);
  for (const field of ['protocol', 'method', 'pathPattern'] as const) {
    if (typeof metadata[field] !== 'string') throw new Error(`${path} 的 ${field} 必须是 string`);
  }
  if (!Array.isArray(metadata.parameters)) throw new Error(`${path} 的 parameters 必须是 array`);
  for (const [index, parameter] of (metadata.parameters as ApiParameter[]).entries()) {
    if (!isRecord(parameter)) throw new Error(`${path} 的 parameters[${index}] 必须是 object`);
    for (const field of ['name', 'position', 'type'] as const) {
      if (typeof parameter[field] !== 'string') {
        throw new Error(`${path} 的 parameters[${index}].${field} 必须是 string`);
      }
    }
    if (typeof parameter.required !== 'boolean') {
      throw new Error(`${path} 的 parameters[${index}].required 必须是 boolean`);
    }
  }
  return metadata;
}

function classifyChangedApi(previous: ApiMetadata, next: ApiMetadata): Pick<ProtocolChange, 'kind' | 'reason'> {
  if (
    previous.protocol !== next.protocol
    || previous.method !== next.method
    || previous.pathPattern !== next.pathPattern
  ) {
    return { kind: 'endpoint-version', reason: 'protocol、method 或 pathPattern 发生变化' };
  }

  const previousParameters = parameterMap(previous);
  const nextParameters = parameterMap(next);
  for (const [name, parameter] of previousParameters) {
    const replacement = nextParameters.get(name);
    if (!replacement) {
      return { kind: 'parameter-breaking', reason: `参数 ${name} 被删除` };
    }
    if (parameter.type !== replacement.type || parameter.position !== replacement.position) {
      return { kind: 'parameter-breaking', reason: `参数 ${name} 的类型或位置发生变化` };
    }
    if (parameter.required !== true && replacement.required === true) {
      return { kind: 'parameter-breaking', reason: `参数 ${name} 从可选变为必填` };
    }
  }
  for (const [name, parameter] of nextParameters) {
    if (parameter.required === true && !previousParameters.has(name)) {
      return { kind: 'parameter-breaking', reason: `新增必填参数 ${name}` };
    }
  }
  return { kind: 'behavior-unknown', reason: 'metadata 内容变化，需要人工审查' };
}

export function classifyProtocolChanges(previousRoot: string, nextRoot: string): ProtocolChange[] {
  if (!existsSync(previousRoot)) {
    return snapshotFiles(nextRoot).map((path) => ({
      kind: 'additive',
      path: relative(nextRoot, path).split(sep).join('/'),
      reason: '初始协议快照'
    }));
  }

  const previousFiles = new Map(snapshotFiles(previousRoot).map((path) => [relative(previousRoot, path).split(sep).join('/'), path]));
  const nextFiles = new Map(snapshotFiles(nextRoot).map((path) => [relative(nextRoot, path).split(sep).join('/'), path]));
  const paths = [...new Set([...previousFiles.keys(), ...nextFiles.keys()])].sort();
  const changes: ProtocolChange[] = [];

  for (const path of paths) {
    const previousPath = previousFiles.get(path);
    const nextPath = nextFiles.get(path);
    if (!previousPath && nextPath) {
      changes.push({ kind: 'additive', path, reason: '新增协议文件' });
      continue;
    }
    if (previousPath && !nextPath) {
      changes.push({ kind: 'removed', path, reason: '协议文件被删除' });
      continue;
    }
    if (!previousPath || !nextPath || sha256(readFileSync(previousPath)) === sha256(readFileSync(nextPath))) continue;

    if (path === 'metadatas/products.json') {
      changes.push({ kind: 'endpoint-version', path, reason: '产品版本、endpoint 或 API 索引发生变化' });
      continue;
    }
    if (path.endsWith('.json')) {
      const classification = classifyChangedApi(parseJson(previousPath) as ApiMetadata, parseJson(nextPath) as ApiMetadata);
      changes.push({ ...classification, path });
      continue;
    }
    changes.push({ kind: 'behavior-unknown', path, reason: '协议附属文件发生变化' });
  }
  return changes;
}

function replaceDirectory(stagingRoot: string, targetRoot: string) {
  validateTargetRoot(targetRoot);
  mkdirSync(dirname(targetRoot), { recursive: true });
  const backupRoot = `${targetRoot}.backup-${process.pid}`;
  rmSync(backupRoot, { recursive: true, force: true });
  if (existsSync(targetRoot)) renameSync(targetRoot, backupRoot);
  try {
    renameSync(stagingRoot, targetRoot);
    rmSync(backupRoot, { recursive: true, force: true });
  } catch (error) {
    if (existsSync(backupRoot) && !existsSync(targetRoot)) renameSync(backupRoot, targetRoot);
    throw error;
  }
}

export function updateAlicloudProtocol(options: {
  metadataRoot: string;
  targetRoot: string;
  source: AlicloudProtocolSource;
  scope?: AlicloudProtocolScope;
}): ProtocolUpdateResult {
  const metadataRoot = resolve(options.metadataRoot);
  const targetRoot = resolve(options.targetRoot);
  validateTargetRoot(targetRoot);
  const scope = loadScope(targetRoot, options.scope);
  mkdirSync(dirname(targetRoot), { recursive: true });
  const stagingRoot = mkdtempSync(join(dirname(targetRoot), '.alicloud-openapi-'));

  try {
    if (existsSync(join(targetRoot, 'README.md'))) {
      cpSync(join(targetRoot, 'README.md'), join(stagingRoot, 'README.md'));
    } else {
      writeFileSync(join(stagingRoot, 'README.md'), GENERATED_README);
    }
    writeJson(join(stagingRoot, 'scope.json'), scope);
    const { products, selected } = copyProtocolMetadata(metadataRoot, stagingRoot, scope);
    const productManifests = createProductManifest(stagingRoot, products, selected);
    const files = snapshotFiles(stagingRoot);
    const manifest: AlicloudProtocolManifest = {
      schemaVersion: ALICLOUD_PROTOCOL_SCHEMA,
      source: options.source,
      scope,
      content: {
        fileCount: files.length,
        treeSha256: hashFiles(stagingRoot, files)
      },
      products: productManifests,
      generator: {
        path: 'scripts/update-alicloud-protocol.ts',
        version: 1
      }
    };
    writeJson(join(stagingRoot, 'manifest.json'), manifest);
    const changes = classifyProtocolChanges(targetRoot, stagingRoot);
    replaceDirectory(stagingRoot, targetRoot);
    return { manifest, changes };
  } catch (error) {
    rmSync(stagingRoot, { recursive: true, force: true });
    throw error;
  }
}

export function checkAlicloudProtocol(targetRoot: string): ProtocolCheckResult {
  const root = resolve(targetRoot);
  const issues: string[] = [];
  const manifestPath = join(root, 'manifest.json');
  if (!existsSync(manifestPath)) return { ok: false, issues: ['缺少 manifest.json'] };

  let manifest: AlicloudProtocolManifest;
  try {
    manifest = parseJson(manifestPath) as AlicloudProtocolManifest;
  } catch (error) {
    return { ok: false, issues: [`manifest.json 无法解析: ${error instanceof Error ? error.message : String(error)}`] };
  }
  if (manifest.schemaVersion !== ALICLOUD_PROTOCOL_SCHEMA) {
    issues.push(`不支持的 schemaVersion: ${String(manifest.schemaVersion)}`);
  }

  const requiredPaths = ['README.md', 'LICENSE', 'scope.json', 'metadatas/products.json'];
  for (const path of requiredPaths) {
    if (!existsSync(join(root, path))) issues.push(`缺少 ${path}`);
  }

  let scope: AlicloudProtocolScope | undefined;
  try {
    scope = loadScope(root);
    if (JSON.stringify(scope) !== JSON.stringify(manifest.scope)) {
      issues.push('scope.json 与 manifest.scope 不一致，请运行 protocol:update');
    }
  } catch (error) {
    issues.push(error instanceof Error ? error.message : String(error));
  }

  const files = snapshotFiles(root);
  if (files.length !== manifest.content?.fileCount) {
    issues.push(`文件数量不一致: manifest=${String(manifest.content?.fileCount)}, actual=${files.length}`);
  }
  const actualTreeHash = hashFiles(root, files);
  if (actualTreeHash !== manifest.content?.treeSha256) {
    issues.push('协议文件 SHA-256 不一致，请勿手工修改 metadatas/');
  }

  try {
    const products = requireProductsIndex(root);
    const selected = scope?.mode === 'full'
      ? readdirSync(join(root, 'metadatas'), { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()
      : scope?.products || [];
    const actualProducts = createProductManifest(root, products, selected);
    if (JSON.stringify(actualProducts) !== JSON.stringify(manifest.products)) {
      issues.push('产品 manifest 与协议文件不一致，请运行 protocol:update');
    }
  } catch (error) {
    issues.push(error instanceof Error ? error.message : String(error));
  }

  return { ok: issues.length === 0, manifest, issues };
}
