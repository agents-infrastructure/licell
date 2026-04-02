import { chmodSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync } from 'crypto';
import { gunzipSync, gzipSync } from 'zlib';
import { dirname, join, resolve } from 'path';
import { homedir } from 'os';
import { ensureSecureDir, normalizeAuth } from './config';

const LICELL_GLOBAL_DIR = join(homedir(), '.licell-cli');
const LICELL_AUTH_FILE = 'auth.json';
const LICELL_GLOBAL_CONFIG_FILE = 'config.json';
const LICELL_ACME_DIR = 'acme';
const AUTH_BUNDLE_SCHEMA_VERSION = '1.0';
const AUTH_TOKEN_PREFIX = 'licell-auth-v1';
const SECURE_FILE_MODE = 0o600;

export interface AuthTransferFile {
  path: string;
  contentBase64: string;
}

export interface AuthTransferArchive {
  schemaVersion: string;
  kind: 'licell-auth-archive';
  createdAt: string;
  files: AuthTransferFile[];
}

export interface AuthTransferEnvelope {
  schemaVersion: string;
  kind: 'licell-auth-envelope';
  algorithm: 'aes-256-gcm';
  kdf: {
    name: 'scrypt';
    salt: string;
  };
  iv: string;
  tag: string;
  payload: string;
}

export interface AuthTransferTokenPayload {
  schemaVersion: string;
  kind: 'licell-auth-restore';
  bucket: string;
  key: string;
  region: string;
  signedGetUrl: string;
  expiresAt: string;
  objectSha256: string;
  createdAt: string;
}

export interface AuthTransferSnapshot {
  files: AuthTransferFile[];
  includedAuth: boolean;
  includedGlobalConfig: boolean;
  includedAcmeFiles: number;
}

export type AuthTransferBucketRegistry = Record<string, string>;

function nowIso() {
  return new Date().toISOString();
}

function toBase64Url(value: Buffer | string) {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value, 'utf8');
  return buffer.toString('base64url');
}

function fromBase64Url(value: string) {
  return Buffer.from(value, 'base64url');
}

function normalizeRelativeFilePath(relativePath: string) {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized) throw new Error('bundle 文件路径不能为空');
  const segments = normalized.split('/').filter(Boolean);
  if (segments.length === 0 || segments.some((segment) => segment === '.' || segment === '..')) {
    throw new Error(`bundle 文件路径非法: ${relativePath}`);
  }
  return segments.join('/');
}

function resolveBundleTargetPath(relativePath: string) {
  const normalized = normalizeRelativeFilePath(relativePath);
  const targetPath = resolve(LICELL_GLOBAL_DIR, normalized);
  const globalDir = resolve(LICELL_GLOBAL_DIR);
  if (targetPath !== globalDir && !targetPath.startsWith(`${globalDir}/`)) {
    throw new Error(`bundle 目标路径越界: ${relativePath}`);
  }
  return targetPath;
}

function collectFilesRecursively(rootDir: string, prefix: string, files: AuthTransferFile[]) {
  if (!existsSync(rootDir)) return;
  const entries = readdirSync(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    const absolutePath = join(rootDir, entry.name);
    const relativePath = normalizeRelativeFilePath(join(prefix, entry.name));
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      collectFilesRecursively(absolutePath, relativePath, files);
      continue;
    }
    if (!entry.isFile()) continue;
    files.push({
      path: relativePath,
      contentBase64: readFileSync(absolutePath).toString('base64')
    });
  }
}

export function collectAuthTransferSnapshot(): AuthTransferSnapshot {
  const files: AuthTransferFile[] = [];
  const authPath = join(LICELL_GLOBAL_DIR, LICELL_AUTH_FILE);
  const globalConfigPath = join(LICELL_GLOBAL_DIR, LICELL_GLOBAL_CONFIG_FILE);
  const acmeDir = join(LICELL_GLOBAL_DIR, LICELL_ACME_DIR);

  if (!existsSync(authPath) || !lstatSync(authPath).isFile()) {
    throw new Error('未找到 ~/.licell-cli/auth.json，请先执行 `licell login`');
  }

  files.push({
    path: LICELL_AUTH_FILE,
    contentBase64: readFileSync(authPath).toString('base64')
  });

  let includedGlobalConfig = false;
  if (existsSync(globalConfigPath) && lstatSync(globalConfigPath).isFile()) {
    includedGlobalConfig = true;
    files.push({
      path: LICELL_GLOBAL_CONFIG_FILE,
      contentBase64: readFileSync(globalConfigPath).toString('base64')
    });
  }

  const beforeAcmeCount = files.length;
  collectFilesRecursively(acmeDir, LICELL_ACME_DIR, files);
  files.sort((left, right) => left.path.localeCompare(right.path));

  return {
    files,
    includedAuth: true,
    includedGlobalConfig,
    includedAcmeFiles: files.length - beforeAcmeCount
  };
}

export function createEncryptedAuthTransferBundle(passkey: string, snapshot: AuthTransferSnapshot) {
  const trimmedPasskey = passkey.trim();
  if (trimmedPasskey.length < 12) {
    throw new Error('passkey 长度至少需要 12 个字符');
  }

  const archive: AuthTransferArchive = {
    schemaVersion: AUTH_BUNDLE_SCHEMA_VERSION,
    kind: 'licell-auth-archive',
    createdAt: nowIso(),
    files: snapshot.files
  };
  const compressed = gzipSync(Buffer.from(JSON.stringify(archive), 'utf8'));
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = scryptSync(trimmedPasskey, salt, 32);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(`${AUTH_TOKEN_PREFIX}:${AUTH_BUNDLE_SCHEMA_VERSION}`, 'utf8'));
  const encrypted = Buffer.concat([cipher.update(compressed), cipher.final()]);
  const tag = cipher.getAuthTag();
  const envelope: AuthTransferEnvelope = {
    schemaVersion: AUTH_BUNDLE_SCHEMA_VERSION,
    kind: 'licell-auth-envelope',
    algorithm: 'aes-256-gcm',
    kdf: {
      name: 'scrypt',
      salt: toBase64Url(salt)
    },
    iv: toBase64Url(iv),
    tag: toBase64Url(tag),
    payload: toBase64Url(encrypted)
  };
  const content = Buffer.from(JSON.stringify(envelope), 'utf8');

  return {
    content,
    sha256: createHash('sha256').update(content).digest('hex'),
    fileCount: snapshot.files.length
  };
}

export function decodeAuthTransferBundle(content: Buffer, passkey: string): AuthTransferArchive {
  const trimmedPasskey = passkey.trim();
  if (trimmedPasskey.length < 12) {
    throw new Error('passkey 长度至少需要 12 个字符');
  }

  let envelope: AuthTransferEnvelope;
  try {
    envelope = JSON.parse(content.toString('utf8')) as AuthTransferEnvelope;
  } catch {
    throw new Error('auth bundle 不是合法的 JSON 包');
  }

  if (envelope.kind !== 'licell-auth-envelope' || envelope.algorithm !== 'aes-256-gcm' || envelope.kdf?.name !== 'scrypt') {
    throw new Error('auth bundle 协议版本不受支持');
  }

  try {
    const key = scryptSync(trimmedPasskey, fromBase64Url(envelope.kdf.salt), 32);
    const decipher = createDecipheriv('aes-256-gcm', key, fromBase64Url(envelope.iv));
    decipher.setAAD(Buffer.from(`${AUTH_TOKEN_PREFIX}:${AUTH_BUNDLE_SCHEMA_VERSION}`, 'utf8'));
    decipher.setAuthTag(fromBase64Url(envelope.tag));
    const decrypted = Buffer.concat([
      decipher.update(fromBase64Url(envelope.payload)),
      decipher.final()
    ]);
    const archive = JSON.parse(gunzipSync(decrypted).toString('utf8')) as AuthTransferArchive;
    if (archive.kind !== 'licell-auth-archive' || !Array.isArray(archive.files) || archive.files.length === 0) {
      throw new Error('auth bundle 内容为空或格式非法');
    }
    return archive;
  } catch (err: unknown) {
    const message = String((err as { message?: unknown })?.message || err || '');
    if (message.includes('Unsupported state or unable to authenticate data')) {
      throw new Error('passkey 不正确，或 auth bundle 已损坏');
    }
    throw err;
  }
}

export function listAuthTransferTargetPaths(archive: AuthTransferArchive) {
  return archive.files.map((file) => resolveBundleTargetPath(file.path));
}

export function hasExistingAuthTransferTargets(archive: AuthTransferArchive) {
  return listAuthTransferTargetPaths(archive).filter((filePath) => existsSync(filePath));
}

export function restoreAuthTransferArchive(archive: AuthTransferArchive) {
  const authEntry = archive.files.find((file) => file.path === LICELL_AUTH_FILE);
  if (!authEntry) {
    throw new Error('auth bundle 中缺少 auth.json');
  }

  try {
    const auth = normalizeAuth(JSON.parse(Buffer.from(authEntry.contentBase64, 'base64').toString('utf8')));
    if (!auth) {
      throw new Error('auth.json 内容非法');
    }
  } catch (err: unknown) {
    throw new Error(`auth bundle 内的 auth.json 非法: ${String((err as { message?: unknown })?.message || err)}`);
  }

  for (const file of archive.files) {
    const targetPath = resolveBundleTargetPath(file.path);
    ensureSecureDir(dirname(targetPath));
    writeFileSync(targetPath, Buffer.from(file.contentBase64, 'base64'), { mode: SECURE_FILE_MODE });
    try {
      chmodSync(targetPath, SECURE_FILE_MODE);
    } catch {
      // ignore chmod failures on non-posix filesystems
    }
    if (file.path === LICELL_GLOBAL_CONFIG_FILE) {
      try {
        const parsed = JSON.parse(readFileSync(targetPath, 'utf8')) as unknown;
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          throw new Error('config.json 必须是对象');
        }
      } catch {
        throw new Error('auth bundle 内的 config.json 非法');
      }
    }
  }

  return {
    restoredFiles: archive.files.length,
    targetDir: LICELL_GLOBAL_DIR
  };
}

export function buildAuthTransferBucketName(accountId: string, region: string) {
  const normalizedAccountId = accountId.trim().toLowerCase();
  const normalizedRegion = region.trim().toLowerCase();
  if (!normalizedAccountId || !normalizedRegion) {
    throw new Error('无法推导 auth transfer bucket 名称');
  }
  return `licell-auth-${normalizedAccountId}-${normalizedRegion}`.slice(0, 63);
}

export function buildAuthTransferBucketScope(accountId: string, region: string) {
  const normalizedAccountId = accountId.trim().toLowerCase();
  const normalizedRegion = region.trim().toLowerCase();
  if (!normalizedAccountId || !normalizedRegion) {
    throw new Error('无法推导 auth transfer bucket scope');
  }
  return `${normalizedAccountId}@${normalizedRegion}`;
}

export function normalizeAuthTransferBucketRegistry(input: unknown): AuthTransferBucketRegistry {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return {};
  const normalized: AuthTransferBucketRegistry = {};
  for (const [scope, bucket] of Object.entries(input as Record<string, unknown>)) {
    if (typeof scope !== 'string' || typeof bucket !== 'string') continue;
    const normalizedScope = scope.trim().toLowerCase();
    const normalizedBucket = bucket.trim().toLowerCase();
    if (!normalizedScope || !normalizedBucket) continue;
    normalized[normalizedScope] = normalizedBucket;
  }
  return normalized;
}

export function getConfiguredAuthTransferBucket(input: unknown, accountId: string, region: string) {
  const registry = normalizeAuthTransferBucketRegistry(input);
  return registry[buildAuthTransferBucketScope(accountId, region)];
}

export function setConfiguredAuthTransferBucket(input: unknown, accountId: string, region: string, bucket: string) {
  const registry = normalizeAuthTransferBucketRegistry(input);
  registry[buildAuthTransferBucketScope(accountId, region)] = bucket.trim().toLowerCase();
  return registry;
}

export function buildAuthTransferBucketCandidates(accountId: string, region: string, randomCount = 4) {
  const base = buildAuthTransferBucketName(accountId, region);
  const candidates = [base];
  for (let index = 0; index < randomCount; index += 1) {
    const suffix = randomBytes(3).toString('hex');
    const prefix = base.slice(0, Math.max(0, 63 - suffix.length - 1)).replace(/-+$/g, '');
    candidates.push(`${prefix}-${suffix}`);
  }
  return Array.from(new Set(candidates));
}

export function buildAuthTransferObjectKey(now = new Date()) {
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const stamp = now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const suffix = randomBytes(6).toString('hex');
  return `auth-transfer/${year}/${month}/${day}/${stamp}-${suffix}.json`;
}

export function encodeAuthTransferToken(payload: AuthTransferTokenPayload) {
  return `${AUTH_TOKEN_PREFIX}.${toBase64Url(JSON.stringify(payload))}`;
}

export function decodeAuthTransferToken(token: string): AuthTransferTokenPayload {
  const trimmed = token.trim();
  const prefix = `${AUTH_TOKEN_PREFIX}.`;
  if (!trimmed.startsWith(prefix)) {
    throw new Error('restore token 格式非法');
  }
  try {
    const payload = JSON.parse(fromBase64Url(trimmed.slice(prefix.length)).toString('utf8')) as AuthTransferTokenPayload;
    if (
      payload.kind !== 'licell-auth-restore'
      || typeof payload.schemaVersion !== 'string'
      || typeof payload.bucket !== 'string'
      || typeof payload.key !== 'string'
      || typeof payload.region !== 'string'
      || typeof payload.signedGetUrl !== 'string'
      || typeof payload.expiresAt !== 'string'
      || typeof payload.objectSha256 !== 'string'
      || typeof payload.createdAt !== 'string'
    ) {
      throw new Error('restore token 内容不完整');
    }
    return payload;
  } catch (err: unknown) {
    throw new Error(`restore token 无法解析: ${String((err as { message?: unknown })?.message || err)}`);
  }
}
