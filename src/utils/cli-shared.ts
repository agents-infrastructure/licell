import { confirm, outro, spinner, isCancel } from '@clack/prompts';
import pc from 'picocolors';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { Config } from './config';
import { formatErrorMessage } from './errors';
import { parseRootAndSubdomain } from './domain';
import { normalizeFcRuntime } from '../providers/fc';
import { listFunctionVersions } from '../providers/fc';

export function toPromptValue(input: unknown, fieldName: string) {
  if (isCancel(input)) process.exit(0);
  if (typeof input !== 'string') throw new Error(`${fieldName} 输入无效`);
  const value = input.trim();
  if (!value) throw new Error(`${fieldName} 不能为空`);
  return value;
}

export function ensureAuthOrExit() {
  const auth = Config.getAuth();
  if (!auth) {
    outro(pc.red('未登录，请先执行 `licell login`'));
    process.exit(1);
  }
  return auth;
}

export function requireAppName(project: { appName?: string }, message = '请先执行 licell deploy 部署项目'): asserts project is { appName: string } {
  if (!project.appName) {
    outro(pc.red(message));
    process.exit(1);
  }
}

export async function withSpinner<T>(
  s: ReturnType<typeof spinner>,
  startMsg: string,
  failMsg: string,
  fn: () => Promise<T>
): Promise<T | undefined> {
  s.start(startMsg);
  try {
    return await fn();
  } catch (err: unknown) {
    s.stop(pc.red(failMsg));
    console.error(formatErrorMessage(err));
    process.exitCode = 1;
    return undefined;
  }
}

export function normalizeDomainSuffix(input: string) {
  const value = input.trim().toLowerCase().replace(/^\.+|\.+$/g, '');
  if (!value) throw new Error('域名后缀不能为空');
  if (!/^[a-z0-9.-]+$/.test(value)) throw new Error('域名后缀仅允许小写字母、数字、点和短横线');
  parseRootAndSubdomain(`a.${value}`);
  return value;
}

export function normalizeCustomDomain(input: string) {
  const value = input.trim().toLowerCase().replace(/^\.+|\.+$/g, '');
  if (!value) throw new Error('域名不能为空');
  parseRootAndSubdomain(value);
  return value;
}

export function tryNormalizeDomainSuffix(input: unknown) {
  if (typeof input !== 'string') return undefined;
  const value = input.trim();
  if (!value) return undefined;
  try {
    return normalizeDomainSuffix(value);
  } catch {
    return undefined;
  }
}

export function tryNormalizeCustomDomain(input: unknown) {
  if (typeof input !== 'string') return undefined;
  const value = input.trim();
  if (!value) return undefined;
  try {
    return normalizeCustomDomain(value);
  } catch {
    return undefined;
  }
}

export function tryNormalizeFcRuntime(input: unknown) {
  if (typeof input !== 'string') return undefined;
  const value = input.trim();
  if (!value) return undefined;
  try {
    return normalizeFcRuntime(value);
  } catch {
    return undefined;
  }
}

export function ensureEnvIgnored() {
  const gitignore = '.gitignore';
  const ignoreEntry = '.env';
  if (!existsSync(gitignore)) return;
  const current = readFileSync(gitignore, 'utf-8');
  if (/^\.env$/m.test(current)) return;
  const suffix = current.endsWith('\n') || current.length === 0 ? '' : '\n';
  writeFileSync(gitignore, `${current}${suffix}${ignoreEntry}\n`);
}

export function isInteractiveTTY() {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

export interface DestructiveConfirmOptions {
  yes?: boolean;
  interactiveTTY?: boolean;
  confirmPrompt?: (message: string) => Promise<boolean>;
}

export async function ensureDestructiveActionConfirmed(
  actionLabel: string,
  options: DestructiveConfirmOptions = {}
) {
  if (options.yes) return;
  const interactiveTTY = options.interactiveTTY ?? isInteractiveTTY();
  if (!interactiveTTY) {
    throw new Error(`${actionLabel} 属于删除操作；非交互模式请添加 --yes 明确确认`);
  }

  const confirmPrompt = options.confirmPrompt || (async (message: string) => {
    const answered = await confirm({ message });
    if (isCancel(answered)) process.exit(0);
    return Boolean(answered);
  });

  const firstConfirm = await confirmPrompt(`${actionLabel} 将删除云端资源，是否继续？`);
  if (!firstConfirm) throw new Error('操作已取消');

  const secondConfirm = await confirmPrompt(`请再次确认：继续执行${actionLabel}？`);
  if (!secondConfirm) throw new Error('操作已取消');
}

export const DEPLOY_TYPES = ['api', 'static'] as const;
export type DeployType = (typeof DEPLOY_TYPES)[number];

export function normalizeDeployType(input: string): DeployType {
  const value = input.trim().toLowerCase();
  if (value !== 'api' && value !== 'static') {
    throw new Error('--type 仅支持 api 或 static');
  }
  return value;
}

export function normalizeDbType(input: string) {
  const value = input.trim().toLowerCase();
  if (value !== 'postgres' && value !== 'mysql') throw new Error('--type 仅支持 postgres 或 mysql');
  return value;
}

export function toOptionalString(input: unknown) {
  if (input === null || input === undefined) return undefined;
  const value = String(input).trim();
  return value.length > 0 ? value : undefined;
}

export function normalizeRegion(input: string) {
  const value = input.trim().toLowerCase();
  if (!value) throw new Error('region 不能为空');
  if (!/^[a-z0-9-]+$/.test(value)) throw new Error('region 格式无效');
  return value;
}

export function maskAccessKeyId(ak: string) {
  if (ak.length <= 8) return `${ak.slice(0, 2)}***${ak.slice(-2)}`;
  return `${ak.slice(0, 4)}***${ak.slice(-4)}`;
}

export function normalizeEnvKey(input: string) {
  const key = input.trim();
  if (!key) throw new Error('环境变量名不能为空');
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
    throw new Error('环境变量名仅支持字母、数字、下划线，且不能以数字开头');
  }
  return key;
}

export function normalizeAutoPause(input: unknown) {
  const value = toOptionalString(input)?.toLowerCase();
  if (!value) throw new Error('--auto-pause 不能为空');
  if (value === 'on' || value === 'true' || value === '1') return true;
  if (value === 'off' || value === 'false' || value === '0') return false;
  throw new Error('--auto-pause 仅支持 on/off');
}

export function parseOptionalNumber(input: unknown, fieldName: string) {
  const normalized = toOptionalString(input);
  if (!normalized) return undefined;
  const value = Number(normalized);
  if (!Number.isFinite(value)) throw new Error(`${fieldName} 必须是数字`);
  return value;
}

export function parseOptionalPositiveInt(input: unknown, fieldName: string) {
  const normalized = toOptionalString(input);
  if (!normalized) return undefined;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0 || !Number.isInteger(value)) {
    throw new Error(`${fieldName} 必须是正整数`);
  }
  return value;
}

export function parseListLimit(input: unknown, fallback: number, max = 500) {
  const normalized = toOptionalString(input);
  if (!normalized) return fallback;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.min(Math.floor(value), max);
}

export function isNoChangesPublishError(err: unknown) {
  if (typeof err !== 'object' || err === null) return false;
  const message = 'message' in err ? String((err as { message?: unknown }).message || '') : '';
  const code = 'code' in err ? String((err as { code?: unknown }).code || '') : '';
  return (code === 'VersionPublishError' || message.includes('VersionPublishError'))
    && message.includes('No changes were made since last publish');
}

export async function getLatestPublishedVersionId(appName: string) {
  const versions = await listFunctionVersions(appName, 1);
  const latest = versions[0]?.versionId;
  if (!latest) throw new Error('未找到可用的已发布版本，请先执行 deploy 或 release promote 发布版本');
  return latest;
}
