import type { CAC } from 'cac';
import { defineCommandModule, commandInvocation, defineCliCommand, registerCliCommand } from './module';
import pc from 'picocolors';
import { cpSync, mkdirSync, existsSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { basename, join, resolve } from 'path';
import { spawnSync } from 'child_process';
import { executeWithAuthRecovery } from '../utils/auth-recovery';
import { Config, type AuthConfig, type GlobalConfig } from '../utils/config';
import { deleteOssBucketRecursively } from '../providers/oss';
import { getRuntime } from '../providers/fc/runtime';
import {
  ensureDestructiveActionConfirmed,
  isInteractiveTTY,
  normalizeCustomDomain,
  normalizeDomainSuffix,
  showIntro,
  showOutro,
  toOptionalString
} from '../utils/cli-shared';
import {
  type E2eManagedDomainResource,
  type E2eManifest,
  type E2eStepRecord,
  buildE2eManagedBucketName,
  buildE2eManagedDomain,
  compactE2eToken,
  ensureEmptyOrMissingDir,
  generateE2eRunId,
  getE2eManifestPath,
  loadE2eManifest,
  normalizeE2eSuite,
  resolveDefaultE2eManifestRunId,
  resolveSelfCliInvocation,
  saveE2eManifest,
  listE2eManifestRunIds,
  hasSuccessfulE2eStep
} from '../utils/e2e';
import { parseRootAndSubdomain } from '../utils/domain';
import { formatErrorMessage } from '../utils/errors';
import { resolveAuthoritativeDnsSnapshot } from '../providers/dns';
import { probeHttpHealth, type ProbeHttpHealthOptions } from '../utils/health-check';
import {
  emitCliError,
  emitCliEvent,
  emitCommandResult,
  extractJsonRecordsFromOutput,
  isJsonOutput,
  sanitizeCapturedCliOutput
} from '../utils/output';
import { sleep } from '../utils/runtime';
import { readLicellEnv } from '../utils/env';
import { AUTOMATION_SECTION } from './sections';

interface E2eRunOptions {
  suite?: unknown;
  runId?: unknown;
  runtime?: unknown;
  target?: unknown;
  enableVpc?: unknown;
  domain?: unknown;
  domainSuffix?: unknown;
  dbInstance?: unknown;
  cacheInstance?: unknown;
  skipStatic?: unknown;
  enableCdn?: unknown;
  cleanup?: unknown;
  yes?: unknown;
  workspace?: unknown;
  preview?: unknown;
}

interface E2eCleanupOptions {
  yes?: unknown;
  manifest?: unknown;
  keepWorkspace?: unknown;
}

interface E2eStepContext {
  invocation: ReturnType<typeof resolveSelfCliInvocation>;
  workspaceDir: string;
  manifest: E2eManifest;
  state: { hasDeployedApi: boolean; hasDeployedStatic: boolean };
}

const e2eRunCommand = defineCliCommand({
  rawName: 'e2e run',
  description: '执行固定 E2E 套件（默认 smoke）',
  options: [
    { rawName: '--suite <suite>', description: '套件：smoke/full（默认 smoke）' },
    { rawName: '--run-id <id>', description: '指定 runId（默认自动生成）' },
    { rawName: '--runtime <runtime>', description: '部署 runtime（默认 nodejs22）' },
    { rawName: '--target <alias>', description: '部署 target alias（默认 preview）' },
    { rawName: '--enable-vpc', description: 'API 部署启用 VPC（默认关闭，便于无残留清理）' },
    { rawName: '--domain <domain>', description: '固定完整域名（可选）' },
    { rawName: '--domain-suffix <suffix>', description: '固定域名后缀（可选）' },
    { rawName: '--db-instance <instanceId>', description: 'full 套件时附加验证 db info/connect（复用已有实例）' },
    { rawName: '--cache-instance <instanceId>', description: 'full 套件时附加验证 cache info/connect（复用已有实例）' },
    { rawName: '--skip-static', description: 'full 套件时跳过 static + oss upload 场景' },
    { rawName: '--enable-cdn', description: '部署时启用 CDN（需配合 domain/domain-suffix）' },
    { rawName: '--preview', description: '测试 preview 部署流程（需配合 --domain-suffix）' },
    { rawName: '--cleanup', description: '执行完后自动清理' },
    { rawName: '--workspace <dir>', description: '指定 E2E 工作目录（默认 .licell/e2e-work/<runId>）' },
    { rawName: '--yes', description: '自动清理时跳过二次确认' }
  ]
});

const e2eCleanupCommand = defineCliCommand({
  rawName: 'e2e cleanup [runId]',
  description: '清理指定 E2E run 产生的资源',
  options: [
    { rawName: '--manifest <path>', description: '直接指定 manifest 文件路径' },
    { rawName: '--keep-workspace', description: '保留本地 workspace 目录' },
    { rawName: '--yes', description: '跳过二次确认（危险）' }
  ]
});

const e2eListCommand = defineCliCommand({
  rawName: 'e2e list',
  description: '查看本项目 e2e 运行记录'
});

function nowIso() {
  return new Date().toISOString();
}

function printSection(title: string, lines: string[]) {
  if (lines.length === 0) return;
  console.log(pc.bold(title));
  for (const line of lines) {
    console.log(`- ${line}`);
  }
  console.log('');
}

function resolveDefaultRuntimeEntry(runtime: string) {
  const defaultEntry = getRuntime(runtime).defaultEntry.trim();
  return defaultEntry.length > 0 ? defaultEntry : null;
}

export function buildE2eApiDeployArgs(options: {
  runtime: string;
  target?: string;
  useVpc: boolean;
  domain?: string;
  domainSuffix?: string;
  enableCdn: boolean;
  preview?: boolean;
}) {
  const args = ['deploy', '--type', 'api', '--runtime', options.runtime];
  if (options.preview) args.push('--preview');
  else if (options.target) args.push('--target', options.target);

  const defaultEntry = resolveDefaultRuntimeEntry(options.runtime);
  if (defaultEntry) args.push('--entry', defaultEntry);

  args.push(options.useVpc ? '--enable-vpc' : '--disable-vpc');
  if (options.domain) args.push('--domain', options.domain);
  if (options.domainSuffix) args.push('--domain-suffix', options.domainSuffix);
  if (options.enableCdn) args.push('--enable-cdn');
  return args;
}

function resolveE2eTaskEntry(runtime: string) {
  return runtime.startsWith('python') ? 'src/task.py' : 'src/task.ts';
}

export function buildE2eTaskDeployArgs(options: {
  runtime: string;
  target?: string;
  useVpc: boolean;
  entry?: string;
}) {
  const args = ['deploy', '--type', 'task', '--runtime', options.runtime];
  if (options.target) args.push('--target', options.target);
  args.push('--entry', options.entry || resolveE2eTaskEntry(options.runtime));
  args.push(options.useVpc ? '--enable-vpc' : '--disable-vpc');
  return args;
}

function getProjectConfigPaths(workspaceDir: string) {
  return [join(workspaceDir, '.licell', 'project.json'), join(workspaceDir, '.ali', 'project.json')];
}

function readProjectAppName(workspaceDir: string) {
  for (const path of getProjectConfigPaths(workspaceDir)) {
    if (!existsSync(path)) continue;
    try {
      const data = JSON.parse(readFileSync(path, 'utf8')) as { appName?: unknown };
      if (typeof data.appName === 'string' && data.appName.trim().length > 0) {
        return data.appName.trim();
      }
    } catch {
      // ignore invalid file and fallback
    }
  }
  return undefined;
}

function clearProjectDomainSuffix(workspaceDir: string) {
  for (const path of getProjectConfigPaths(workspaceDir)) {
    if (!existsSync(path)) continue;
    try {
      const data = JSON.parse(readFileSync(path, 'utf8')) as { domainSuffix?: unknown };
      if (data.domainSuffix === undefined || data.domainSuffix === null) continue;
      delete data.domainSuffix;
      writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
      return true;
    } catch {
      // ignore invalid file and fallback
    }
  }
  return false;
}

function readProjectNetwork(workspaceDir: string) {
  for (const path of getProjectConfigPaths(workspaceDir)) {
    if (!existsSync(path)) continue;
    try {
      const data = JSON.parse(readFileSync(path, 'utf8')) as {
        network?: { vpcId?: unknown; vswId?: unknown; sgId?: unknown };
      };
      const network = data.network;
      if (!network || typeof network !== 'object') continue;
      const vpcId = typeof network.vpcId === 'string' && network.vpcId.trim().length > 0
        ? network.vpcId.trim()
        : undefined;
      const vswId = typeof network.vswId === 'string' && network.vswId.trim().length > 0
        ? network.vswId.trim()
        : undefined;
      const sgId = typeof network.sgId === 'string' && network.sgId.trim().length > 0
        ? network.sgId.trim()
        : undefined;
      if (!vpcId || !vswId) continue;
      return { vpcId, vswId, sgId };
    } catch {
      // ignore invalid file and fallback
    }
  }
  return undefined;
}

function getE2eTempDir(cwd: string) {
  const tempDir = join('/tmp', 'licell-e2e-tmp', basename(cwd));
  mkdirSync(tempDir, { recursive: true });
  return tempDir;
}

function getE2eBunCacheDir(cwd: string) {
  const cacheDir = join('/tmp', 'licell-e2e-bun-cache', basename(cwd));
  mkdirSync(cacheDir, { recursive: true });
  return cacheDir;
}

function getE2eHomeDir(cwd: string) {
  const homeDir = join(getE2eTempDir(cwd), 'home');
  mkdirSync(homeDir, { recursive: true });
  return homeDir;
}

export function seedE2eChildHome(
  cwd: string,
  options: {
    auth?: AuthConfig;
    globalConfig?: GlobalConfig;
    sourceAcmeDir?: string;
  } = {}
) {
  const homeDir = getE2eHomeDir(cwd);
  const globalDir = join(homeDir, '.licell-cli');
  mkdirSync(globalDir, { recursive: true });

  const authPath = join(globalDir, 'auth.json');
  if (!existsSync(authPath)) {
    const auth = options.auth ?? Config.requireAuth();
    writeFileSync(authPath, `${JSON.stringify(auth, null, 2)}\n`);
  }

  const globalConfigPath = join(globalDir, 'config.json');
  if (!existsSync(globalConfigPath)) {
    const nextGlobalConfig = { ...(options.globalConfig ?? Config.getGlobalConfig()) };
    delete nextGlobalConfig.domainSuffix;
    writeFileSync(globalConfigPath, `${JSON.stringify(nextGlobalConfig, null, 2)}\n`);
  }

  const sourceAcmeDir = options.sourceAcmeDir ?? join(homedir(), '.licell-cli', 'acme');
  const targetAcmeDir = join(globalDir, 'acme');
  if (!existsSync(targetAcmeDir) && existsSync(sourceAcmeDir)) {
    cpSync(sourceAcmeDir, targetAcmeDir, { recursive: true });
  }

  return homeDir;
}

export interface CapturedCliCommandResult {
  status: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
}

export function resolveE2eCleanupCommandCwd(
  workspaceDir: string,
  projectRoot: string,
  exists: (path: string) => boolean = existsSync
) {
  return exists(workspaceDir) ? workspaceDir : projectRoot;
}

export function classifyE2eCleanupCommandResult(
  result: CapturedCliCommandResult,
  args: string[],
  ignoreErrorPatterns: string[] = []
) {
  if (result.status === 0) {
    return { outcome: 'ok' as const, message: undefined };
  }

  const signal = result.signal ? ` signal=${result.signal}` : '';
  const stderrMessage = sanitizeCapturedCliOutput(result.stderr);
  const stdoutMessage = sanitizeCapturedCliOutput(result.stdout);
  const outputMessage = stderrMessage || stdoutMessage;
  const message = outputMessage
    || `命令失败: licell ${args.join(' ')} (exit=${String(result.status)}${signal})`;
  const lowerMessage = message.toLowerCase();
  const ignored = ignoreErrorPatterns.some((pattern) => lowerMessage.includes(pattern));
  return { outcome: ignored ? 'skipped' as const : 'failed' as const, message };
}

function buildE2eChildEnv(cwd: string) {
  const tempDir = getE2eTempDir(cwd);
  const homeDir = seedE2eChildHome(cwd);
  const sslAcmeDirectory = readLicellEnv(process.env, 'SSL_ACME_DIRECTORY')?.trim().toLowerCase();
  return {
    ...process.env,
    HOME: homeDir,
    USERPROFILE: homeDir,
    LICELL_INTERACTIVE: '0',
    LICELL_DOMAIN_SUFFIX: '',
    ALI_DOMAIN_SUFFIX: '',
    ...(sslAcmeDirectory === 'staging' && process.env.NODE_TLS_REJECT_UNAUTHORIZED === undefined
      ? { NODE_TLS_REJECT_UNAUTHORIZED: '0' }
      : {}),
    TMPDIR: tempDir,
    TMP: tempDir,
    TEMP: tempDir
  };
}

function runCliCommand(
  invocation: ReturnType<typeof resolveSelfCliInvocation>,
  args: string[],
  cwd: string
) {
  const argv = [...invocation.prefixArgs, ...args];
  const result = spawnSync(invocation.command, argv, {
    cwd,
    stdio: 'inherit',
    env: buildE2eChildEnv(cwd)
  });
  if (result.status !== 0) {
    const signal = result.signal ? ` signal=${result.signal}` : '';
    throw new Error(`命令失败: licell ${args.join(' ')} (exit=${String(result.status)}${signal})`);
  }
}

function runCliCommandCapture(
  invocation: ReturnType<typeof resolveSelfCliInvocation>,
  args: string[],
  cwd: string,
  options: { replayOutput?: boolean } = {}
) {
  const argv = [...invocation.prefixArgs, ...args];
  const result = spawnSync(invocation.command, argv, {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: buildE2eChildEnv(cwd),
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024
  });
  const stdout = result.stdout || '';
  const stderr = result.stderr || '';
  if (options.replayOutput) {
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
  }
  return {
    status: result.status,
    signal: result.signal,
    stdout,
    stderr
  };
}

function runSystemCommand(command: string, args: string[], cwd: string) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: buildE2eChildEnv(cwd)
  });
  if (result.status !== 0) {
    const signal = result.signal ? ` signal=${result.signal}` : '';
    throw new Error(`命令失败: ${command} ${args.join(' ')} (exit=${String(result.status)}${signal})`);
  }
}

function deriveE2eAppName(runId: string) {
  return `licell-e2e-${runId}`.toLowerCase();
}

function createStaticFixture(workspaceDir: string, runId: string) {
  const distDir = join(workspaceDir, 'e2e-static-dist');
  mkdirSync(distDir, { recursive: true });
  writeFileSync(
    join(distDir, 'index.html'),
    `<!doctype html>
<html>
  <head><meta charset="UTF-8"><title>licell-e2e</title></head>
  <body><h1>licell e2e ${runId}</h1></body>
</html>
`
  );
  writeFileSync(join(distDir, 'health.txt'), `ok:${runId}\n`);
  return distDir;
}

function renderNodeTaskFixture(runId: string) {
  return `function toRecord(input: unknown): Record<string, unknown> {
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    return input as Record<string, unknown>;
  }
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return { raw: input };
    }
  }
  return {};
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function handler(event: unknown) {
  const payload = toRecord(event);
  const mode = typeof payload.mode === 'string' ? payload.mode : 'ok';
  const runId = typeof payload.runId === 'string' ? payload.runId : '';
  const rawSleepMs = Number(payload.sleepMs ?? 0);
  const sleepMs = Number.isFinite(rawSleepMs) && rawSleepMs > 0
    ? Math.min(Math.floor(rawSleepMs), 120000)
    : 0;

  if (mode === 'sleep' && sleepMs > 0) {
    await sleep(sleepMs);
  }

  return {
    ok: true,
    fixture: 'licell-task-node',
    expectedRunId: '${runId}',
    runId,
    mode,
    sleepMs
  };
}
`;
}

function renderPythonTaskFixture(runId: string) {
  return `from __future__ import annotations

import json
import time
from typing import Any


def _to_dict(event: Any) -> dict[str, Any]:
    if isinstance(event, dict):
        return event
    if isinstance(event, str):
        try:
            parsed = json.loads(event)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            return {"raw": event}
    return {}


def handler(event: Any, context: Any):
    payload = _to_dict(event)
    mode = payload.get("mode") if isinstance(payload.get("mode"), str) else "ok"
    run_id = payload.get("runId") if isinstance(payload.get("runId"), str) else ""
    sleep_ms_value = payload.get("sleepMs", 0)
    try:
        sleep_ms = int(sleep_ms_value)
    except Exception:
        sleep_ms = 0
    if sleep_ms < 0:
        sleep_ms = 0
    if sleep_ms > 120000:
        sleep_ms = 120000

    if mode == "sleep" and sleep_ms > 0:
        time.sleep(sleep_ms / 1000.0)

    return {
        "ok": True,
        "fixture": "licell-task-python",
        "expectedRunId": "${runId}",
        "runId": run_id,
        "mode": mode,
        "sleepMs": sleep_ms,
    }
`;
}

function createTaskFixture(workspaceDir: string, runtime: string, runId: string) {
  const relativeEntry = resolveE2eTaskEntry(runtime);
  mkdirSync(join(workspaceDir, 'src'), { recursive: true });
  writeFileSync(
    join(workspaceDir, relativeEntry),
    runtime.startsWith('python') ? renderPythonTaskFixture(runId) : renderNodeTaskFixture(runId)
  );
  return relativeEntry;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function appendJsonOutputArgs(args: string[]) {
  return args.some((token) => token === '--output' || token.startsWith('--output='))
    ? [...args]
    : [...args, '--output', 'json'];
}

function getLatestCliResultRecord(output: string) {
  const records = extractJsonRecordsFromOutput(output);
  for (let index = records.length - 1; index >= 0; index -= 1) {
    const record = records[index];
    if (isRecord(record) && record.type === 'result') return record;
  }
  return undefined;
}

function getLatestCliErrorMessage(output: string) {
  const records = extractJsonRecordsFromOutput(output);
  for (let index = records.length - 1; index >= 0; index -= 1) {
    const record = records[index];
    if (!isRecord(record) || record.type !== 'error') continue;
    const error = isRecord(record.error) ? record.error : undefined;
    if (error && typeof error.message === 'string' && error.message.trim().length > 0) {
      return error.message.trim();
    }
  }
  return undefined;
}

function readRequiredString(value: unknown, label: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} 缺失或为空`);
  }
  return value.trim();
}

function readRequiredRecord(value: unknown, label: string) {
  if (!isRecord(value)) {
    throw new Error(`${label} 缺失或格式非法`);
  }
  return value;
}

function runJsonCommandCapture<T extends Record<string, unknown>>(
  invocation: ReturnType<typeof resolveSelfCliInvocation>,
  args: string[],
  cwd: string
) {
  const jsonArgs = appendJsonOutputArgs(args);
  const result = runCliCommandCapture(invocation, jsonArgs, cwd);
  const combinedOutput = `${result.stdout}\n${result.stderr}`;
  if (result.status !== 0) {
    const signal = result.signal ? ` signal=${result.signal}` : '';
    const message = getLatestCliErrorMessage(combinedOutput)
      || `命令失败: licell ${jsonArgs.join(' ')} (exit=${String(result.status)}${signal})`;
    throw new Error(message);
  }
  const payload = getLatestCliResultRecord(combinedOutput);
  if (!payload) {
    throw new Error(`命令未返回 JSON 结果: licell ${jsonArgs.join(' ')}`);
  }
  return payload as T;
}

function persistManifest(manifest: E2eManifest) {
  manifest.updatedAt = nowIso();
  saveE2eManifest(manifest, manifest.projectRoot);
}

function applyStepRecord(manifest: E2eManifest, step: E2eStepRecord) {
  manifest.steps.push(step);
  manifest.updatedAt = nowIso();
}

function ensureDnsRecordIds(manifest: E2eManifest) {
  manifest.resources.dnsRecordIds = manifest.resources.dnsRecordIds || [];
  return manifest.resources.dnsRecordIds;
}

function ensureManagedBuckets(manifest: E2eManifest) {
  manifest.resources.managedBuckets = manifest.resources.managedBuckets || [];
  return manifest.resources.managedBuckets;
}

function ensureManagedDomains(manifest: E2eManifest) {
  manifest.resources.managedDomains = manifest.resources.managedDomains || [];
  return manifest.resources.managedDomains;
}

function sameManagedDomain(left: E2eManagedDomainResource, right: E2eManagedDomainResource) {
  return left.workflow === right.workflow && left.domain === right.domain && (left.bucket || '') === (right.bucket || '');
}

function trackDnsRecordId(ctx: E2eStepContext, recordId: string) {
  const list = ensureDnsRecordIds(ctx.manifest);
  if (!list.includes(recordId)) {
    list.push(recordId);
    persistManifest(ctx.manifest);
  }
}

function untrackDnsRecordId(ctx: E2eStepContext, recordId: string) {
  const list = ensureDnsRecordIds(ctx.manifest);
  const next = list.filter((item) => item !== recordId);
  if (next.length !== list.length) {
    ctx.manifest.resources.dnsRecordIds = next;
    persistManifest(ctx.manifest);
  }
}

function trackManagedBucket(ctx: E2eStepContext, bucket: string) {
  const list = ensureManagedBuckets(ctx.manifest);
  if (!list.includes(bucket)) {
    list.push(bucket);
    persistManifest(ctx.manifest);
  }
}

function untrackManagedBucket(ctx: E2eStepContext, bucket: string) {
  const list = ensureManagedBuckets(ctx.manifest);
  const next = list.filter((item) => item !== bucket);
  if (next.length !== list.length) {
    ctx.manifest.resources.managedBuckets = next;
    persistManifest(ctx.manifest);
  }
}

function trackManagedDomain(ctx: E2eStepContext, domainResource: E2eManagedDomainResource) {
  const list = ensureManagedDomains(ctx.manifest);
  if (!list.some((item) => sameManagedDomain(item, domainResource))) {
    list.push(domainResource);
    persistManifest(ctx.manifest);
  }
}

function untrackManagedDomain(ctx: E2eStepContext, domainResource: E2eManagedDomainResource) {
  const list = ensureManagedDomains(ctx.manifest);
  const next = list.filter((item) => !sameManagedDomain(item, domainResource));
  if (next.length !== list.length) {
    ctx.manifest.resources.managedDomains = next;
    persistManifest(ctx.manifest);
  }
}

function runStep(ctx: E2eStepContext, name: string, args: string[]) {
  const startedAt = nowIso();
  const command = `licell ${args.join(' ')}`;
  emitCliEvent({
    stage: `e2e.${name}`,
    action: name,
    status: 'start',
    data: { command }
  });
  try {
    runCliCommand(ctx.invocation, args, ctx.workspaceDir);
    applyStepRecord(ctx.manifest, {
      name,
      command,
      status: 'ok',
      startedAt,
      endedAt: nowIso()
    });
    saveE2eManifest(ctx.manifest, ctx.manifest.projectRoot);
    emitCliEvent({ stage: `e2e.${name}`, action: name, status: 'ok' });
  } catch (err: unknown) {
    applyStepRecord(ctx.manifest, {
      name,
      command,
      status: 'failed',
      startedAt,
      endedAt: nowIso(),
      error: formatErrorMessage(err)
    });
    saveE2eManifest(ctx.manifest, ctx.manifest.projectRoot);
    emitCliEvent({
      stage: `e2e.${name}`,
      action: name,
      status: 'failed',
      message: formatErrorMessage(err)
    });
    throw err;
  }
}

function runJsonStep<T extends Record<string, unknown>>(
  ctx: E2eStepContext,
  name: string,
  args: string[],
  validate?: (payload: T) => void
): T {
  const jsonArgs = appendJsonOutputArgs(args);
  const startedAt = nowIso();
  const command = `licell ${jsonArgs.join(' ')}`;
  emitCliEvent({
    stage: `e2e.${name}`,
    action: name,
    status: 'start',
    data: { command }
  });
  try {
    const result = runCliCommandCapture(ctx.invocation, jsonArgs, ctx.workspaceDir);
    const combinedOutput = `${result.stdout}\n${result.stderr}`;
    if (result.status !== 0) {
      if (result.stdout) process.stdout.write(result.stdout);
      if (result.stderr) process.stderr.write(result.stderr);
      const signal = result.signal ? ` signal=${result.signal}` : '';
      const message = getLatestCliErrorMessage(combinedOutput)
        || `命令失败: licell ${jsonArgs.join(' ')} (exit=${String(result.status)}${signal})`;
      throw new Error(message);
    }
    const payload = getLatestCliResultRecord(combinedOutput);
    if (!payload) {
      throw new Error(`命令未返回 JSON 结果: licell ${jsonArgs.join(' ')}`);
    }
    const typedPayload = payload as T;
    validate?.(typedPayload);
    applyStepRecord(ctx.manifest, {
      name,
      command,
      status: 'ok',
      startedAt,
      endedAt: nowIso()
    });
    saveE2eManifest(ctx.manifest, ctx.manifest.projectRoot);
    emitCliEvent({ stage: `e2e.${name}`, action: name, status: 'ok' });
    return typedPayload;
  } catch (err: unknown) {
    applyStepRecord(ctx.manifest, {
      name,
      command,
      status: 'failed',
      startedAt,
      endedAt: nowIso(),
      error: formatErrorMessage(err)
    });
    saveE2eManifest(ctx.manifest, ctx.manifest.projectRoot);
    emitCliEvent({
      stage: `e2e.${name}`,
      action: name,
      status: 'failed',
      message: formatErrorMessage(err)
    });
    throw err;
  }
}

export function buildE2eInvokePayload(runId: string) {
  return JSON.stringify({
    path: '/healthz',
    rawPath: '/healthz',
    rawQueryString: `runId=${encodeURIComponent(runId)}&ping=pong`,
    httpMethod: 'GET',
    headers: {
      accept: 'application/json'
    },
    queryParameters: {
      runId,
      ping: 'pong'
    },
    body: '',
    isBase64Encoded: false,
    requestContext: {
      http: {
        method: 'GET',
        path: '/healthz',
        sourceIp: '127.0.0.1'
      }
    }
  });
}

export function assertE2eInvokeResult(payload: Record<string, unknown>) {
  const statusCode = Number(payload.statusCode || 0);
  if (statusCode !== 200) {
    throw new Error(`fn invoke 返回非 200 状态码: ${statusCode}`);
  }

  const body = typeof payload.body === 'string' ? payload.body : '';
  if (!body.trim()) {
    throw new Error('fn invoke 返回空响应');
  }
  if (body.includes('Cannot POST /invoke')) {
    throw new Error('fn invoke 命中了 runtime HTTP 控制面，而不是 handler(event, context)');
  }

  try {
    const parsed = JSON.parse(body) as { ok?: unknown };
    if (parsed.ok === true) return;
  } catch {
    // handled below
  }

  throw new Error(`fn invoke 返回非预期响应: ${body}`);
}

export function buildE2eTaskPayload(
  runId: string,
  options: { mode?: 'ok' | 'sleep'; sleepMs?: number } = {}
) {
  const mode = options.mode || 'ok';
  const sleepMs = Number.isFinite(options.sleepMs) ? Math.max(0, Math.floor(options.sleepMs || 0)) : 0;
  return JSON.stringify({
    runId,
    mode,
    ...(sleepMs > 0 ? { sleepMs } : {})
  });
}

export function assertE2eTaskInvokeResult(payload: Record<string, unknown>) {
  const statusCode = Number(payload.statusCode || 0);
  if (statusCode !== 202) {
    throw new Error(`task invoke 返回非 202 状态码: ${statusCode}`);
  }
  const invocationType = readRequiredString(payload.invocationType, 'task invoke.invocationType');
  if (invocationType !== 'Async') {
    throw new Error(`task invoke 返回非 Async invocationType: ${invocationType}`);
  }
  return readRequiredString(payload.taskId, 'task invoke.taskId');
}

function isTerminalTaskStatus(status: string | undefined) {
  return status === 'Succeeded' || status === 'Failed' || status === 'Stopped';
}

function parseTaskReturnPayload(payload: Record<string, unknown>) {
  const raw = toOptionalString(payload.returnPayload);
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    return isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function assertE2eTaskReturnPayload(payload: Record<string, unknown>, expected: { runId: string; mode: 'ok' | 'sleep' }) {
  const parsed = parseTaskReturnPayload(payload);
  if (!parsed) {
    throw new Error('task info.returnPayload 不是可解析的 JSON 对象');
  }
  if (parsed.ok !== true) {
    throw new Error(`task info.returnPayload.ok !== true: ${JSON.stringify(parsed)}`);
  }
  if (parsed.runId !== expected.runId) {
    throw new Error(`task info.returnPayload.runId 不匹配: ${JSON.stringify(parsed)}`);
  }
  if (parsed.mode !== expected.mode) {
    throw new Error(`task info.returnPayload.mode 不匹配: ${JSON.stringify(parsed)}`);
  }
}

function runStepIf(ctx: E2eStepContext, condition: boolean, name: string, args: string[]) {
  if (!condition) {
    applyStepRecord(ctx.manifest, {
      name,
      command: `licell ${args.join(' ')}`,
      status: 'skipped',
      startedAt: nowIso(),
      endedAt: nowIso()
    });
    saveE2eManifest(ctx.manifest, ctx.manifest.projectRoot);
    return;
  }
  runStep(ctx, name, args);
}

function runExternalStep(ctx: E2eStepContext, name: string, command: string, args: string[]) {
  const startedAt = nowIso();
  const displayCommand = `${command} ${args.join(' ')}`.trim();
  emitCliEvent({
    stage: `e2e.${name}`,
    action: name,
    status: 'start',
    data: { command: displayCommand }
  });
  try {
    runSystemCommand(command, args, ctx.workspaceDir);
    applyStepRecord(ctx.manifest, {
      name,
      command: displayCommand,
      status: 'ok',
      startedAt,
      endedAt: nowIso()
    });
    saveE2eManifest(ctx.manifest, ctx.manifest.projectRoot);
    emitCliEvent({ stage: `e2e.${name}`, action: name, status: 'ok' });
  } catch (err: unknown) {
    applyStepRecord(ctx.manifest, {
      name,
      command: displayCommand,
      status: 'failed',
      startedAt,
      endedAt: nowIso(),
      error: formatErrorMessage(err)
    });
    saveE2eManifest(ctx.manifest, ctx.manifest.projectRoot);
    emitCliEvent({
      stage: `e2e.${name}`,
      action: name,
      status: 'failed',
      message: formatErrorMessage(err)
    });
    throw err;
  }
}

async function runInlineStep(
  ctx: E2eStepContext,
  name: string,
  command: string,
  action: () => Promise<void> | void
) {
  const startedAt = nowIso();
  emitCliEvent({
    stage: `e2e.${name}`,
    action: name,
    status: 'start',
    data: { command }
  });
  try {
    await action();
    applyStepRecord(ctx.manifest, {
      name,
      command,
      status: 'ok',
      startedAt,
      endedAt: nowIso()
    });
    saveE2eManifest(ctx.manifest, ctx.manifest.projectRoot);
    emitCliEvent({ stage: `e2e.${name}`, action: name, status: 'ok' });
  } catch (err: unknown) {
    applyStepRecord(ctx.manifest, {
      name,
      command,
      status: 'failed',
      startedAt,
      endedAt: nowIso(),
      error: formatErrorMessage(err)
    });
    saveE2eManifest(ctx.manifest, ctx.manifest.projectRoot);
    emitCliEvent({
      stage: `e2e.${name}`,
      action: name,
      status: 'failed',
      message: formatErrorMessage(err)
    });
    throw err;
  }
}

async function pollTaskInfoStep(
  ctx: E2eStepContext,
  name: string,
  options: {
    functionName: string;
    target: string;
    taskId: string;
    timeoutMs?: number;
    intervalMs?: number;
    until: (payload: Record<string, unknown>, status: string | undefined) => { done: boolean; error?: string };
  }
) {
  const timeoutMs = Math.max(1_000, options.timeoutMs || 60_000);
  const intervalMs = Math.max(500, options.intervalMs || 2_000);
  await runInlineStep(ctx, name, `poll task info ${options.taskId}`, async () => {
    const deadline = Date.now() + timeoutMs;
    let lastStatus: string | undefined;
    while (Date.now() < deadline) {
      const payload = runJsonCommandCapture<Record<string, unknown>>(
        ctx.invocation,
        ['task', 'info', options.taskId, options.functionName, '--target', options.target],
        ctx.workspaceDir
      );
      const status = toOptionalString(payload.status);
      lastStatus = status;
      const outcome = options.until(payload, status);
      if (outcome.error) {
        throw new Error(outcome.error);
      }
      if (outcome.done) {
        return;
      }
      await sleep(intervalMs);
    }
    throw new Error(`task info 轮询超时: taskId=${options.taskId}, lastStatus=${lastStatus || '<empty>'}`);
  });
}

async function pollTaskListStep(
  ctx: E2eStepContext,
  name: string,
  options: {
    functionName: string;
    target: string;
    taskId: string;
    prefix?: string;
    timeoutMs?: number;
    intervalMs?: number;
  }
) {
  const timeoutMs = Math.max(1_000, options.timeoutMs || 30_000);
  const intervalMs = Math.max(500, options.intervalMs || 2_000);
  await runInlineStep(ctx, name, `poll task list ${options.taskId}`, async () => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const payload = runJsonCommandCapture<Record<string, unknown>>(
        ctx.invocation,
        [
          'task', 'list', options.functionName,
          '--target', options.target,
          '--limit', '10',
          ...(options.prefix ? ['--prefix', options.prefix] : [])
        ],
        ctx.workspaceDir
      );
      const tasks = Array.isArray(payload.tasks) ? payload.tasks : [];
      if (tasks.some((task) => isRecord(task) && toOptionalString(task.taskId) === options.taskId)) {
        return;
      }
      await sleep(intervalMs);
    }
    throw new Error(`task list 轮询超时: 未返回 taskId=${options.taskId}`);
  });
}

async function runProbeStep(
  ctx: E2eStepContext,
  name: string,
  baseUrl: string,
  options: ProbeHttpHealthOptions = {}
) {
  await runInlineStep(ctx, name, `probe ${baseUrl}`, async () => {
    const result = await probeHttpHealth(baseUrl, options);
    if (!result.ok) {
      throw new Error(result.error);
    }
  });
}

async function runStaticDomainProbeStep(
  ctx: E2eStepContext,
  name: string,
  domain: string,
  baseUrl: string,
  options: ProbeHttpHealthOptions = {}
) {
  await runInlineStep(ctx, name, `probe ${baseUrl}`, async () => {
    const result = await probeHttpHealth(baseUrl, options);
    if (result.ok) return;
    const snapshot = await resolveAuthoritativeDnsSnapshot(domain);
    throw new Error(
      `${result.error}; authoritativeCname=${snapshot.cname.join(',') || '∅'}; ` +
      `authoritativeAddresses=${snapshot.addresses.join(',') || '∅'}`
    );
  });
}

function resolveRunCapabilities(options: {
  domain?: string;
  domainSuffix?: string;
  enableCdn: boolean;
  includeStatic: boolean;
  includeDomainWorkflows: boolean;
  useVpc: boolean;
}): Array<'fc' | 'dns' | 'oss' | 'rds' | 'redis' | 'cdn' | 'logs' | 'vpc'> {
  const caps: Array<'fc' | 'dns' | 'oss' | 'rds' | 'redis' | 'cdn' | 'logs' | 'vpc'> = ['fc', 'oss', 'rds', 'redis', 'logs'];
  if (options.domain || options.domainSuffix || options.includeDomainWorkflows) caps.push('dns');
  if (options.enableCdn || options.includeDomainWorkflows) caps.push('cdn');
  if (options.includeStatic) caps.push('oss');
  if (options.useVpc) caps.push('vpc');
  return [...new Set(caps)];
}

function resolveStaticBucketName(appName: string, accountId: string) {
  return `licell-${appName}-${accountId.substring(0, 4)}`.toLowerCase();
}

function resolveFullSmokeRootDomain(domain?: string, domainSuffix?: string) {
  if (domainSuffix) return domainSuffix;
  if (!domain) return undefined;
  return parseRootAndSubdomain(domain).rootDomain;
}

async function executeE2eRun(options: E2eRunOptions) {
  const projectRoot = process.cwd();
  const interactiveTTY = isInteractiveTTY();
  const suite = normalizeE2eSuite(toOptionalString(options.suite));
  const runId = toOptionalString(options.runId) || generateE2eRunId();
  const appName = deriveE2eAppName(runId);
  const runtime = toOptionalString(options.runtime) || 'nodejs22';
  const target = toOptionalString(options.target) || 'preview';
  const useVpc = Boolean(options.enableVpc);
  const domainInput = toOptionalString(options.domain);
  const domainSuffixInput = toOptionalString(options.domainSuffix);
  const dbInstance = toOptionalString(options.dbInstance);
  const cacheInstance = toOptionalString(options.cacheInstance);
  const skipStatic = Boolean(options.skipStatic);
  const domain = domainInput ? normalizeCustomDomain(domainInput) : undefined;
  const domainSuffix = domainSuffixInput ? normalizeDomainSuffix(domainSuffixInput) : undefined;
  const sslAcmeMode = readLicellEnv(process.env, 'SSL_ACME_DIRECTORY')?.trim().toLowerCase();
  if (sslAcmeMode === 'staging' && process.env.NODE_TLS_REJECT_UNAUTHORIZED === undefined) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
  if (domain && domainSuffix) throw new Error('--domain 与 --domain-suffix 不能同时使用');

  const fullSmokeRootDomain = resolveFullSmokeRootDomain(domain, domainSuffix);
  const enableCdn = Boolean(options.enableCdn);
  if (enableCdn && !domain && !domainSuffix) {
    throw new Error('--enable-cdn 需要配合 --domain 或 --domain-suffix');
  }
  const enablePreview = Boolean(options.preview);
  if (enablePreview && !domainSuffix) {
    throw new Error('--preview 需要配合 --domain-suffix');
  }
  const autoCleanup = Boolean(options.cleanup);
  const yes = Boolean(options.yes);
  const runToken = compactE2eToken(runId);
  const workspaceDir = resolve(
    toOptionalString(options.workspace)
    || join(projectRoot, '.licell', 'e2e-work', runId)
  );
  ensureEmptyOrMissingDir(workspaceDir);
  mkdirSync(workspaceDir, { recursive: true });

  const manifest: E2eManifest = {
    runId,
    suite,
    status: 'running',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    projectRoot,
    workspaceDir,
    target,
    runtime,
    resources: {
      appName,
      dnsRecordIds: [],
      managedBuckets: [],
      managedDomains: [],
      ...(domain ? { domain } : {}),
      ...(domainSuffix ? { domainSuffix } : {})
    },
    steps: [],
    cleanup: {
      status: 'pending',
      details: [],
      errors: []
    }
  };
  const manifestPath = saveE2eManifest(manifest, projectRoot);
  const invocation = resolveSelfCliInvocation();
  const ctx: E2eStepContext = {
    invocation,
    workspaceDir,
    manifest,
    state: { hasDeployedApi: false, hasDeployedStatic: false }
  };

  showIntro(pc.bgBlue(pc.white(' 🧪 Licell E2E Runner ')));
  console.log(`runId:      ${pc.cyan(runId)}`);
  console.log(`suite:      ${pc.cyan(suite)}`);
  console.log(`workspace:  ${pc.cyan(workspaceDir)}`);
  console.log(`manifest:   ${pc.cyan(manifestPath)}\n`);
  printSection('执行计划', [
    `runtime: ${runtime}`,
    `target: ${target}`,
    `api function: ${appName}`,
    `network: ${useVpc ? 'vpc(shared licell-vpc)' : 'public(no-vpc)'}`,
    ...(sslAcmeMode ? [`ssl acme: ${sslAcmeMode}`] : []),
    ...(domain ? [`fixed domain: ${domain}`] : []),
    ...(domainSuffix ? [`domain suffix: ${domainSuffix}`] : []),
    ...(enableCdn ? ['cdn: enabled'] : []),
    ...(enablePreview ? ['preview deploy: enabled'] : []),
    ...(suite === 'full' ? [
      `dns/domain smoke: ${fullSmokeRootDomain ? 'enabled' : 'skipped (missing domain/domain-suffix)'}`,
      `static deploy: ${skipStatic ? 'skipped' : 'enabled'}`
    ] : [])
  ]);

  let runError: unknown;
  emitCliEvent({
    stage: 'e2e',
    action: 'run',
    status: 'start',
    data: {
      runId,
      suite,
      runtime,
      target,
      workspaceDir
    }
  });
  try {
    await executeWithAuthRecovery(
      {
        commandLabel: commandInvocation(e2eRunCommand),
        interactiveTTY,
        requiredCapabilities: resolveRunCapabilities({
          domain,
          domainSuffix,
          enableCdn,
          includeStatic: suite === 'full' && !skipStatic,
          includeDomainWorkflows: suite === 'full' && Boolean(fullSmokeRootDomain),
          useVpc
        })
      },
      async () => {
        runStep(ctx, 'init', ['init', '--runtime', runtime, '--app', appName, '--yes']);
        const appNameFromConfig = readProjectAppName(workspaceDir);
        if (!appNameFromConfig) throw new Error('init 成功后未检测到 appName');
        if (runtime.startsWith('nodejs')) {
          runExternalStep(ctx, 'bun-install', 'bun', ['install', '--cache-dir', getE2eBunCacheDir(workspaceDir), '--backend', 'copyfile']);
        }
        manifest.resources.appName = appNameFromConfig;
        if (!manifest.resources.domain && manifest.resources.domainSuffix) {
          manifest.resources.domain = `${appNameFromConfig}.${manifest.resources.domainSuffix}`;
        }
        persistManifest(manifest);
        printSection('创建资源', [
          `fc function: ${appNameFromConfig}`,
          ...(manifest.resources.domain ? [`domain: ${manifest.resources.domain}`] : [])
        ]);

        const deployArgs = buildE2eApiDeployArgs({
          runtime,
          target,
          useVpc,
          domain,
          domainSuffix,
          enableCdn
        });
        runStep(ctx, 'deploy-api', deployArgs);
        ctx.state.hasDeployedApi = true;
        const networkFromConfig = readProjectNetwork(workspaceDir);
        if (networkFromConfig) {
          manifest.resources.vpcId = networkFromConfig.vpcId;
          manifest.resources.vswId = networkFromConfig.vswId;
          if (networkFromConfig.sgId) manifest.resources.sgId = networkFromConfig.sgId;
          persistManifest(manifest);
        }

        runStep(ctx, 'fn-list', ['fn', 'list', '--prefix', appNameFromConfig, '--limit', '20']);
        runStep(ctx, 'fn-info', ['fn', 'info', appNameFromConfig, '--target', target]);
        runJsonStep<Record<string, unknown>>(
          ctx,
          'fn-invoke',
          ['fn', 'invoke', appNameFromConfig, '--target', target, '--payload', buildE2eInvokePayload(runId)],
          assertE2eInvokeResult
        );

        runStep(ctx, 'env-set', ['env', 'set', 'LICELL_E2E_RUN_ID', runId]);
        runStep(ctx, 'env-list', ['env', 'list']);
        runStep(ctx, 'env-pull', ['env', 'pull']);
        runStep(ctx, 'env-rm', ['env', 'rm', 'LICELL_E2E_RUN_ID', '--yes']);

        runStep(ctx, 'release-list', ['release', 'list', '--limit', '5']);
        runStep(ctx, 'release-promote', ['release', 'promote', '--target', target]);

        if (enablePreview && domainSuffix) {
          const previewApiArgs = buildE2eApiDeployArgs({
            runtime,
            useVpc,
            enableCdn: false,
            preview: true
          });
          previewApiArgs.push('--domain-suffix', domainSuffix);
          runStep(ctx, 'deploy-api-preview', previewApiArgs);

          if (suite === 'full' && !skipStatic) {
            const previewStaticDistDir = createStaticFixture(workspaceDir, `${runId}-preview`);
            const previewStaticArgs = ['deploy', '--type', 'static', '--dist', previewStaticDistDir, '--preview'];
            previewStaticArgs.push('--domain-suffix', domainSuffix);
            runStep(ctx, 'deploy-static-preview', previewStaticArgs);
          }

          runStep(ctx, 'release-prune-preview', ['release', 'prune', '--preview', '--keep', '2']);
        }

        runStep(ctx, 'logs-once', ['logs', '--once', '--window', '180', '--lines', '200']);
        runStep(ctx, 'oss-list', ['oss', 'list', '--limit', '5']);
        runStep(ctx, 'db-list', ['db', 'list', '--limit', '5']);
        runStep(ctx, 'cache-list', ['cache', 'list', '--limit', '5']);

        if (dbInstance) {
          runStep(ctx, 'db-info', ['db', 'info', dbInstance]);
          runStep(ctx, 'db-connect', ['db', 'connect', dbInstance]);
        }

        if (cacheInstance) {
          runStep(ctx, 'cache-info', ['cache', 'info', cacheInstance]);
          runStep(ctx, 'cache-connect', ['cache', 'connect', cacheInstance]);
        }

        const dnsDomain = (() => {
          const fixedDomain = manifest.resources.domain;
          if (!fixedDomain) return undefined;
          const parsed = parseRootAndSubdomain(fixedDomain);
          return parsed.rootDomain;
        })();
        runStepIf(ctx, Boolean(dnsDomain), 'dns-records-list', ['dns', 'records', 'list', dnsDomain || '', '--limit', '20']);

        if (suite === 'full') {
          runStep(ctx, 'whoami', ['whoami']);
          const auth = Config.requireAuth();
          const staticDistDir = createStaticFixture(workspaceDir, runId);
          const downloadDir = join(workspaceDir, 'e2e-downloads');
          mkdirSync(downloadDir, { recursive: true });

          const scratchBucket = buildE2eManagedBucketName(auth.accountId, runId, 'oss');
          const scratchPrefix = `scratch-${runToken.slice(-12)}`;
          const scratchIndexKey = `${scratchPrefix}/index.html`;
          const scratchHealthKey = `${scratchPrefix}/health.txt`;
          const scratchDownloadPath = join(downloadDir, 'scratch-index.html');
          const scratchSyncDir = join(downloadDir, 'sync');

          trackManagedBucket(ctx, scratchBucket);
          runStep(ctx, 'oss-create', ['oss', 'create', scratchBucket, '--acl', 'private', '--storage-class', 'standard', '--public-access-block', 'on']);
          runStep(ctx, 'oss-info', ['oss', 'info', scratchBucket]);
          runStep(ctx, 'oss-update', ['oss', 'update', scratchBucket, '--acl', 'public-read', '--public-access-block', 'off']);
          runStep(ctx, 'oss-upload-scratch', ['oss', 'upload', scratchBucket, '--source-dir', staticDistDir, '--target-dir', scratchPrefix]);
          runStep(ctx, 'oss-ls-scratch', ['oss', 'ls', scratchBucket, scratchPrefix, '--limit', '20']);
          runStep(ctx, 'oss-object-info', ['oss', 'object', 'info', scratchBucket, scratchIndexKey]);
          runStep(ctx, 'oss-object-get', ['oss', 'object', 'get', scratchBucket, scratchIndexKey, scratchDownloadPath]);
          await runInlineStep(ctx, 'oss-object-get-verify', `verify ${scratchDownloadPath}`, async () => {
            const content = readFileSync(scratchDownloadPath, 'utf8');
            if (!content.includes(`licell e2e ${runId}`)) {
              throw new Error(`下载对象内容校验失败: ${scratchDownloadPath}`);
            }
          });
          mkdirSync(scratchSyncDir, { recursive: true });
          runStep(ctx, 'oss-sync-down', ['oss', 'sync', 'down', scratchBucket, scratchPrefix, '--dest-dir', scratchSyncDir]);
          await runInlineStep(ctx, 'oss-sync-down-verify', `verify ${join(scratchSyncDir, 'index.html')}`, async () => {
            const content = readFileSync(join(scratchSyncDir, 'index.html'), 'utf8');
            if (!content.includes(`licell e2e ${runId}`)) {
              throw new Error(`同步目录内容校验失败: ${join(scratchSyncDir, 'index.html')}`);
            }
          });
          runStep(ctx, 'oss-object-rm', ['oss', 'object', 'rm', scratchBucket, scratchHealthKey, '--yes']);

          if (!skipStatic) {
            if (manifest.resources.domainSuffix && clearProjectDomainSuffix(workspaceDir)) {
              console.log(pc.gray('已临时清除项目 domainSuffix，避免 plain static deploy 误走固定域名 workflow'));
            }
            runStep(ctx, 'deploy-static', ['deploy', '--type', 'static', '--dist', staticDistDir]);
            ctx.state.hasDeployedStatic = true;
            manifest.resources.staticBucket = resolveStaticBucketName(appNameFromConfig, auth.accountId);
            persistManifest(manifest);
            printSection('静态资源', [
              `oss bucket: ${manifest.resources.staticBucket}`,
              `upload prefix: e2e-upload-${runId}`
            ]);
            runStep(ctx, 'oss-upload', [
              'oss', 'upload',
              '--bucket', manifest.resources.staticBucket,
              '--source-dir', staticDistDir,
              '--target-dir', `e2e-upload-${runId}`
            ]);
            runStep(ctx, 'oss-ls-uploaded', [
              'oss', 'ls',
              manifest.resources.staticBucket,
              `e2e-upload-${runId}`,
              '--limit',
              '20'
            ]);
          }

          if (fullSmokeRootDomain) {
            const manualDnsRr = `smoke-${runToken.slice(-12)}`;
            const manualDnsValue = `licell-${runToken.slice(-18)}`;
            const manualDnsResult = runJsonStep<Record<string, unknown>>(ctx, 'dns-records-add', [
              'dns', 'records', 'add',
              fullSmokeRootDomain,
              '--rr', manualDnsRr,
              '--type', 'TXT',
              '--value', manualDnsValue
            ]);
            const manualDnsRecordId = readRequiredString(manualDnsResult.recordId, 'dns records add.recordId');
            trackDnsRecordId(ctx, manualDnsRecordId);
            runStep(ctx, 'dns-records-list-full', ['dns', 'records', 'list', fullSmokeRootDomain, '--limit', '20']);
            runJsonStep<Record<string, unknown>>(ctx, 'dns-records-rm', ['dns', 'records', 'rm', manualDnsRecordId, '--yes']);
            untrackDnsRecordId(ctx, manualDnsRecordId);

            const ossDomain = buildE2eManagedDomain(fullSmokeRootDomain, runId, 'oss');
            const ossManagedDomain: E2eManagedDomainResource = { workflow: 'oss', domain: ossDomain, bucket: scratchBucket };
            trackManagedDomain(ctx, ossManagedDomain);
            const tokenResult = runJsonStep<Record<string, unknown>>(ctx, 'oss-domain-token', ['oss', 'domain', 'token', scratchBucket, ossDomain]);
            const dnsVerification = readRequiredRecord(tokenResult.dnsVerification, 'oss domain token.dnsVerification');
            const tokenRootDomain = readRequiredString(dnsVerification.rootDomain, 'oss domain token.rootDomain');
            const tokenRr = readRequiredString(dnsVerification.rr, 'oss domain token.rr');
            const tokenValue = readRequiredString(dnsVerification.value, 'oss domain token.value');
            const tokenDnsResult = runJsonStep<Record<string, unknown>>(ctx, 'dns-records-add-oss-token', [
              'dns', 'records', 'add',
              tokenRootDomain,
              '--rr', tokenRr,
              '--type', 'TXT',
              '--value', tokenValue
            ]);
            const tokenDnsRecordId = readRequiredString(tokenDnsResult.recordId, 'dns records add oss token.recordId');
            trackDnsRecordId(ctx, tokenDnsRecordId);
            await runInlineStep(ctx, 'oss-domain-token-settle', 'wait 20000ms for oss token dns', async () => {
              await sleep(20_000);
            });
            runStep(ctx, 'oss-domain-bind', ['oss', 'domain', 'bind', scratchBucket, ossDomain]);
            runStep(ctx, 'oss-domain-list', ['oss', 'domain', 'list', scratchBucket]);
            runStep(ctx, 'oss-domain-unbind', ['oss', 'domain', 'unbind', scratchBucket, ossDomain, '--yes']);
            untrackManagedDomain(ctx, ossManagedDomain);
            runJsonStep<Record<string, unknown>>(ctx, 'dns-records-rm-oss-token', ['dns', 'records', 'rm', tokenDnsRecordId, '--yes']);
            untrackDnsRecordId(ctx, tokenDnsRecordId);

            const appDomain = buildE2eManagedDomain(fullSmokeRootDomain, runId, 'app');
            const appManagedDomain: E2eManagedDomainResource = { workflow: 'app', domain: appDomain };
            trackManagedDomain(ctx, appManagedDomain);
            runStep(ctx, 'domain-app-bind', ['domain', 'app', 'bind', appDomain, '--target', target, '--ssl']);
            await runProbeStep(ctx, 'domain-app-probe', `https://${appDomain}`, {
              maxAttempts: 10,
              intervalMs: 3000,
              timeoutMs: 6000,
              allowClientError: false
            });
            runStep(ctx, 'domain-app-unbind', ['domain', 'app', 'unbind', appDomain, '--yes']);
            untrackManagedDomain(ctx, appManagedDomain);

            if (!skipStatic && manifest.resources.staticBucket) {
              const staticDeployDomain = buildE2eManagedDomain(fullSmokeRootDomain, runId, 'static-deploy');
              const staticDeployManagedDomain: E2eManagedDomainResource = { workflow: 'static', domain: staticDeployDomain };
              trackManagedDomain(ctx, staticDeployManagedDomain);
              runStep(ctx, 'deploy-static-domain', ['deploy', '--type', 'static', '--dist', staticDistDir, '--domain', staticDeployDomain, '--ssl']);
              await runStaticDomainProbeStep(ctx, 'deploy-static-domain-probe', staticDeployDomain, `https://${staticDeployDomain}`, {
                paths: ['/'],
                maxAttempts: 36,
                intervalMs: 5000,
                timeoutMs: 10000,
                allowClientError: false
              });
              runStep(ctx, 'domain-static-unbind-deploy', ['domain', 'static', 'unbind', staticDeployDomain, '--yes']);
              untrackManagedDomain(ctx, staticDeployManagedDomain);

              const staticBindDomain = buildE2eManagedDomain(fullSmokeRootDomain, runId, 'static-bind');
              const staticBindManagedDomain: E2eManagedDomainResource = { workflow: 'static', domain: staticBindDomain };
              trackManagedDomain(ctx, staticBindManagedDomain);
              runStep(ctx, 'domain-static-bind', ['domain', 'static', 'bind', staticBindDomain, '--bucket', manifest.resources.staticBucket, '--ssl']);
              await runStaticDomainProbeStep(ctx, 'domain-static-probe', staticBindDomain, `https://${staticBindDomain}`, {
                paths: ['/'],
                maxAttempts: 36,
                intervalMs: 5000,
                timeoutMs: 10000,
                allowClientError: false
              });
              runStep(ctx, 'domain-static-unbind', ['domain', 'static', 'unbind', staticBindDomain, '--yes']);
              untrackManagedDomain(ctx, staticBindManagedDomain);
            }
          }

          runStep(ctx, 'oss-rm-scratch', ['oss', 'rm', scratchBucket, '--recursive', '--yes']);
          untrackManagedBucket(ctx, scratchBucket);
        }

        let taskEntry = '';
        await runInlineStep(ctx, 'task-fixture', `write ${resolveE2eTaskEntry(runtime)}`, async () => {
          taskEntry = createTaskFixture(workspaceDir, runtime, runId);
        });
        const taskDeployArgs = buildE2eTaskDeployArgs({
          runtime,
          target,
          useVpc,
          entry: taskEntry
        });
        runStep(ctx, 'deploy-task', taskDeployArgs);

        runJsonStep<Record<string, unknown>>(ctx, 'task-config', [
          'task', 'config', appNameFromConfig, '--target', target
        ], (payload) => {
          if (payload.configured !== true || payload.asyncTask !== true) {
            throw new Error(`deploy task 后 async config 未启用: ${JSON.stringify(payload)}`);
          }
        });

        runStep(ctx, 'task-config-set', [
          'task', 'config', 'set', appNameFromConfig,
          '--target', target,
          '--max-retry-attempts', '0',
          '--max-event-age', '600'
        ]);
        runJsonStep<Record<string, unknown>>(ctx, 'task-config-verify', [
          'task', 'config', appNameFromConfig, '--target', target
        ], (payload) => {
          if (payload.configured !== true || payload.asyncTask !== true) {
            throw new Error(`task config set 后 asyncTask 未启用: ${JSON.stringify(payload)}`);
          }
          if (Number(payload.maxAsyncRetryAttempts) !== 0) {
            throw new Error(`task config set 后 maxAsyncRetryAttempts 非 0: ${JSON.stringify(payload)}`);
          }
          if (Number(payload.maxAsyncEventAgeInSeconds) !== 600) {
            throw new Error(`task config set 后 maxAsyncEventAgeInSeconds 非 600: ${JSON.stringify(payload)}`);
          }
        });
        runStep(ctx, 'task-config-rm', [
          'task', 'config', 'rm', appNameFromConfig,
          '--target', target,
          '--yes'
        ]);
        runJsonStep<Record<string, unknown>>(ctx, 'task-config-verify-rm', [
          'task', 'config', appNameFromConfig, '--target', target
        ], (payload) => {
          if (payload.configured !== false) {
            throw new Error(`task config rm 后仍检测到配置: ${JSON.stringify(payload)}`);
          }
        });
        runStep(ctx, 'task-config-set-reset', [
          'task', 'config', 'set', appNameFromConfig,
          '--target', target,
          '--max-retry-attempts', '0',
          '--max-event-age', '600'
        ]);

        const shortTaskRequestedId = `job-${runToken.slice(-10)}-ok`;
        const shortTaskInvoke = runJsonStep<Record<string, unknown>>(ctx, 'task-invoke-short', [
          'task', 'invoke', appNameFromConfig,
          '--target', target,
          '--payload', buildE2eTaskPayload(runId),
          '--task-id', shortTaskRequestedId
        ], (payload) => {
          assertE2eTaskInvokeResult(payload);
        });
        const shortTaskId = readRequiredString(shortTaskInvoke.taskId, 'task invoke short.taskId');
        await pollTaskListStep(ctx, 'task-list-short', {
          functionName: appNameFromConfig,
          target,
          taskId: shortTaskId,
          prefix: shortTaskRequestedId,
          timeoutMs: 30_000,
          intervalMs: 2_000
        });
        await pollTaskInfoStep(ctx, 'task-info-short', {
          functionName: appNameFromConfig,
          target,
          taskId: shortTaskId,
          timeoutMs: 90_000,
          intervalMs: 3_000,
          until: (payload, status) => {
            if (status === 'Succeeded') {
              assertE2eTaskReturnPayload(payload, { runId, mode: 'ok' });
              return { done: true };
            }
            if (status === 'Failed' || status === 'Stopped') {
              return { done: false, error: `short task 进入异常终态: ${status}; payload=${JSON.stringify(payload)}` };
            }
            return { done: false };
          }
        });

        const stopTaskRequestedId = `job-${runToken.slice(-10)}-stop`;
        const stopTaskInvoke = runJsonStep<Record<string, unknown>>(ctx, 'task-invoke-stop', [
          'task', 'invoke', appNameFromConfig,
          '--target', target,
          '--payload', buildE2eTaskPayload(runId, { mode: 'sleep', sleepMs: 45_000 }),
          '--task-id', stopTaskRequestedId
        ], (payload) => {
          assertE2eTaskInvokeResult(payload);
        });
        const stopTaskId = readRequiredString(stopTaskInvoke.taskId, 'task invoke stop.taskId');
        await pollTaskInfoStep(ctx, 'task-info-active', {
          functionName: appNameFromConfig,
          target,
          taskId: stopTaskId,
          timeoutMs: 90_000,
          intervalMs: 3_000,
          until: (payload, status) => {
            if (status && !isTerminalTaskStatus(status)) {
              return { done: true };
            }
            if (status === 'Succeeded' || status === 'Failed' || status === 'Stopped') {
              return { done: false, error: `stop task 提前进入终态: ${status}; payload=${JSON.stringify(payload)}` };
            }
            return { done: false };
          }
        });
        runStep(ctx, 'task-stop', [
          'task', 'stop', stopTaskId, appNameFromConfig,
          '--target', target
        ]);
        await pollTaskInfoStep(ctx, 'task-info-stopped', {
          functionName: appNameFromConfig,
          target,
          taskId: stopTaskId,
          timeoutMs: 90_000,
          intervalMs: 3_000,
          until: (payload, status) => {
            if (status === 'Stopped') {
              return { done: true };
            }
            if (status === 'Succeeded' || status === 'Failed') {
              return { done: false, error: `task stop 后进入非 Stopped 终态: ${status}; payload=${JSON.stringify(payload)}` };
            }
            return { done: false };
          }
        });
      }
    );
    manifest.status = 'succeeded';
    persistManifest(manifest);
    printSection('E2E 结果', [
      `runId: ${runId}`,
      `status: ${manifest.status}`,
      ...(manifest.resources.appName ? [`fc function: ${manifest.resources.appName}`] : []),
      ...(manifest.resources.domain ? [`domain: ${manifest.resources.domain}`] : []),
      ...(manifest.resources.staticBucket ? [`oss bucket: ${manifest.resources.staticBucket}`] : []),
      ...(manifest.resources.vpcId ? [`vpc: ${manifest.resources.vpcId}/${manifest.resources.vswId || '-'}`] : [])
    ]);
    emitCommandResult({
      runId,
      suite,
      status: manifest.status,
      appName: manifest.resources.appName || null,
      domain: manifest.resources.domain || null,
      staticBucket: manifest.resources.staticBucket || null,
      workspaceDir
    }, { stage: 'e2e' });
  } catch (err: unknown) {
    runError = err;
    manifest.status = 'failed';
    manifest.updatedAt = nowIso();
    manifest.notes = [...(manifest.notes || []), formatErrorMessage(err)];
    saveE2eManifest(manifest, projectRoot);
  }

  if (autoCleanup) {
    console.log(pc.gray('\n自动进入清理阶段...'));
    try {
      await cleanupByManifest(manifest, {
        yes: yes || autoCleanup,
        keepWorkspace: false,
        invocation,
        interactiveTTY
      });
    } catch (cleanupErr: unknown) {
      if (!runError) throw cleanupErr;
      console.warn(pc.yellow(`⚠️ 自动清理失败: ${formatErrorMessage(cleanupErr)}`));
    }
  } else {
    console.log(pc.gray(`可执行清理命令: licell e2e cleanup ${runId}`));
  }

  if (runError) throw runError;
  showOutro('Done.');
}

async function cleanupByManifest(
  manifest: E2eManifest,
  options: {
    yes: boolean;
    keepWorkspace: boolean;
    invocation?: ReturnType<typeof resolveSelfCliInvocation>;
    interactiveTTY?: boolean;
  }
) {
  const previousStatus = manifest.status;
  const interactiveTTY = options.interactiveTTY ?? isInteractiveTTY();
  await ensureDestructiveActionConfirmed(`清理 E2E 运行 ${manifest.runId} 相关云资源`, {
    yes: options.yes,
    interactiveTTY
  });

  const invocation = options.invocation || resolveSelfCliInvocation();
  const errors: string[] = [];
  const details: string[] = [];
  const workspaceDir = manifest.workspaceDir;
  const commandCwd = resolveE2eCleanupCommandCwd(workspaceDir, manifest.projectRoot);
  const appName = manifest.resources.appName;
  const domain = manifest.resources.domain;
  const staticBucket = manifest.resources.staticBucket;
  const dnsRecordIds = [...new Set(manifest.resources.dnsRecordIds || [])];
  const managedBuckets = [...new Set(manifest.resources.managedBuckets || [])];
  const managedDomains = [...(manifest.resources.managedDomains || [])];
  const domainTargets = [
    ...((domain ? [{ workflow: 'app', domain } as E2eManagedDomainResource] : [])),
    ...managedDomains
  ].filter((item, index, list) => list.findIndex((candidate) => sameManagedDomain(candidate, item)) === index);
  const bucketTargets = [
    ...(staticBucket ? [staticBucket] : []),
    ...managedBuckets
  ].filter((bucket, index, list) => list.indexOf(bucket) === index);
  const vpcId = manifest.resources.vpcId;
  const vswId = manifest.resources.vswId;
  const hasApiDeploy = hasSuccessfulE2eStep(manifest, ['deploy-api', 'deploy-api-preview']);
  const hasStaticDeploy = hasSuccessfulE2eStep(manifest, ['deploy-static', 'deploy-static-preview', 'deploy-static-domain']);

  const retryableCleanupPatterns = ['servicebusy', 'operationconflict', 'throttl', 'timeout', 'temporarily', 'transient'];
  const ignoredDomainPatterns = ['not found', 'does not exist', '不存在', 'already absent', 'no such'];
  const ignoredDnsPatterns = ['not found', '不存在', 'recordid', 'no such'];

  const runCleanupCommand = async (
    name: string,
    args: string[],
    cleanupOptions?: { ignoreErrorPatterns?: string[]; maxAttempts?: number }
  ) => {
    const maxAttempts = Math.max(1, cleanupOptions?.maxAttempts || 3);
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const result = runCliCommandCapture(invocation, args, commandCwd, { replayOutput: true });
      const classified = classifyE2eCleanupCommandResult(result, args, cleanupOptions?.ignoreErrorPatterns || []);
      if (classified.outcome === 'ok') {
        details.push(attempt > 1 ? `${name}: ok (attempt=${attempt})` : `${name}: ok`);
        return;
      }

      const message = classified.message || `命令失败: licell ${args.join(' ')}`;
      if (classified.outcome === 'skipped') {
        details.push(`${name}: skipped (${message})`);
        return;
      }
      const lowerMessage = message.toLowerCase();
      const retryable = retryableCleanupPatterns.some((pattern) => lowerMessage.includes(pattern));
      if (retryable && attempt < maxAttempts) {
        console.warn(pc.yellow(`cleanup retry ${attempt}/${maxAttempts - 1}: ${name} -> ${message}`));
        await sleep(3000 * attempt);
        continue;
      }
      errors.push(`${name}: ${message}`);
      details.push(`${name}: failed`);
      return;
    }
  };

  manifest.cleanup = manifest.cleanup || {};
  manifest.cleanup.attemptedAt = nowIso();
  manifest.cleanup.status = 'pending';
  manifest.cleanup.details = details;
  manifest.cleanup.errors = errors;
  manifest.updatedAt = nowIso();
  saveE2eManifest(manifest, manifest.projectRoot);
  emitCliEvent({
    stage: 'e2e.cleanup',
    action: 'cleanup',
    status: 'start',
    data: {
      runId: manifest.runId,
      appName: appName || null,
      domain: domain || null,
      staticBucket: staticBucket || null
    }
  });
  printSection('清理目标', [
    ...(appName ? [`fc function: ${appName}`] : []),
    ...domainTargets.map((item) => `${item.workflow} domain: ${item.domain}${item.bucket ? ` -> ${item.bucket}` : ''}`),
    ...bucketTargets.map((bucket) => `oss bucket: ${bucket}`),
    ...(dnsRecordIds.length > 0 ? [`dns records: ${dnsRecordIds.length}`] : []),
    ...(vpcId ? [`vpc network: ${vpcId}/${vswId || '-'} (shared, keep)`] : []),
    ...(options.keepWorkspace ? ['workspace: keep'] : [`workspace: ${workspaceDir}`])
  ]);

  const needsDns = domainTargets.length > 0 || dnsRecordIds.length > 0;
  const needsCdn = domainTargets.some((item) => item.workflow === 'static');
  const needsOss = bucketTargets.length > 0 || domainTargets.some((item) => item.workflow === 'oss');

  await executeWithAuthRecovery(
    {
      commandLabel: commandInvocation(e2eCleanupCommand),
      interactiveTTY,
      requiredCapabilities: [
        'fc',
        ...(needsDns ? ['dns' as const] : []),
        ...(needsCdn ? ['cdn' as const] : []),
        ...(needsOss ? ['oss' as const] : [])
      ]
    },
    async () => {
      for (const item of [...domainTargets].reverse()) {
        if (item.workflow === 'app') {
          console.log(pc.gray(`清理 app domain: ${item.domain}`));
          await runCleanupCommand(`domain-app-unbind:${item.domain}`, ['domain', 'app', 'unbind', item.domain, '--yes'], {
            ignoreErrorPatterns: ignoredDomainPatterns
          });
          continue;
        }
        if (item.workflow === 'static') {
          console.log(pc.gray(`清理 static domain: ${item.domain}`));
          await runCleanupCommand(`domain-static-unbind:${item.domain}`, ['domain', 'static', 'unbind', item.domain, '--yes'], {
            ignoreErrorPatterns: ignoredDomainPatterns,
            maxAttempts: 4
          });
          continue;
        }
        if (item.workflow === 'oss' && item.bucket) {
          console.log(pc.gray(`清理 oss domain: ${item.domain}`));
          await runCleanupCommand(`oss-domain-unbind:${item.domain}`, ['oss', 'domain', 'unbind', item.bucket, item.domain, '--yes'], {
            ignoreErrorPatterns: [...ignoredDomainPatterns, 'nosuchbucket']
          });
        }
      }

      for (const recordId of [...dnsRecordIds].reverse()) {
        console.log(pc.gray(`清理 dns record: ${recordId}`));
        await runCleanupCommand(`dns-records-rm:${recordId}`, ['dns', 'records', 'rm', recordId, '--yes'], {
          ignoreErrorPatterns: ignoredDnsPatterns
        });
      }

      if (appName && hasApiDeploy) {
        if (hasSuccessfulE2eStep(manifest, ['deploy-api-preview', 'deploy-static-preview'])) {
          console.log(pc.gray(`清理 preview 域名: ${appName}`));
          await runCleanupCommand(
            'release-prune-preview',
            ['release', 'prune', '--preview', '--keep', '1', '--apply', '--yes'],
            { ignoreErrorPatterns: ['not found', 'no preview'] }
          );
        }
        console.log(pc.gray(`清理 function: ${appName}`));
        await runCleanupCommand(
          'fn-rm',
          ['fn', 'rm', appName, '--force', '--yes'],
          { ignoreErrorPatterns: ['functionnotfound', 'does not exist', 'not found'] }
        );
      }
      if (appName && hasStaticDeploy) {
        const staticProxyName = `${appName}-static-proxy`;
        console.log(pc.gray(`清理 static proxy function: ${staticProxyName}`));
        await runCleanupCommand(
          'fn-rm-static-proxy',
          ['fn', 'rm', staticProxyName, '--force', '--yes'],
          { ignoreErrorPatterns: ['functionnotfound', 'does not exist', 'not found'] }
        );
      }
      for (const bucket of bucketTargets) {
        console.log(pc.gray(`清理 oss bucket: ${bucket}`));
        try {
          const result = await deleteOssBucketRecursively(bucket);
          details.push(
            `oss-bucket-rm:${bucket}: ok (${result.bucket}, objects=${result.deletedObjects}, bucketDeleted=${result.deletedBucket})`
          );
          console.log(pc.green(`oss 清理完成: ${result.bucket} (objects=${result.deletedObjects})`));
        } catch (err: unknown) {
          const message = formatErrorMessage(err);
          const lowerMessage = message.toLowerCase();
          if (lowerMessage.includes('nosuchbucket') || lowerMessage.includes('not found')) {
            details.push(`oss-bucket-rm:${bucket}: skipped (${message})`);
            continue;
          }
          errors.push(`oss-bucket-rm:${bucket}: ${message}`);
          details.push(`oss-bucket-rm:${bucket}: failed`);
          console.warn(pc.yellow(`oss 清理失败: ${message}`));
        }
      }
      if (vpcId) {
        details.push(`vpc-rm: skipped (${vpcId} 为共享网络，e2e 默认不自动删除)`);
      }
    }
  );

  if (!options.keepWorkspace) {
    try {
      rmSync(workspaceDir, { recursive: true, force: true });
      details.push('workspace-rm: ok');
      console.log(pc.green(`workspace 已清理: ${workspaceDir}`));
    } catch (err: unknown) {
      errors.push(`workspace-rm: ${formatErrorMessage(err)}`);
      details.push('workspace-rm: failed');
      console.warn(pc.yellow(`workspace 清理失败: ${formatErrorMessage(err)}`));
    }
  }

  manifest.cleanup.finishedAt = nowIso();
  manifest.cleanup.status = errors.length > 0 ? 'partial' : 'done';
  if (errors.length > 0) {
    manifest.status = 'partial_cleaned';
  } else {
    manifest.status = previousStatus === 'failed' ? 'failed' : 'cleaned';
  }
  manifest.updatedAt = nowIso();
  saveE2eManifest(manifest, manifest.projectRoot);

  if (errors.length > 0) {
    console.warn(pc.yellow(`⚠️ 清理存在 ${errors.length} 个失败项：`));
    for (const err of errors) console.warn(pc.yellow(`- ${err}`));
  } else {
    printSection('清理结果', details.map((item) => item.replace(/^([^:]+): /, '$1 => ')));
    console.log(pc.green(`✅ 清理完成: ${manifest.runId}`));
  }
  emitCommandResult({
    runId: manifest.runId,
    status: manifest.cleanup.status || 'unknown',
    details,
    errors
  }, { stage: 'e2e.cleanup' });
}

export function registerE2eCommands(cli: CAC) {
  registerCliCommand(cli, e2eRunCommand)
    .action(async (options: E2eRunOptions) => {
      try {
        await executeE2eRun(options);
      } catch (err: unknown) {
        if (isJsonOutput()) {
          emitCliError(err, { stage: 'e2e' });
        } else {
          console.error(pc.red(formatErrorMessage(err)));
        }
        process.exitCode = 1;
      }
    });

  registerCliCommand(cli, e2eCleanupCommand)
    .action(async (runIdArg: string | undefined, options: E2eCleanupOptions) => {
      try {
        const projectRoot = process.cwd();
        const manifestPathOpt = toOptionalString(options.manifest);
        let manifest: E2eManifest | null = null;

        if (manifestPathOpt) {
          const fullPath = resolve(manifestPathOpt);
          if (!existsSync(fullPath)) throw new Error(`manifest 不存在: ${fullPath}`);
          manifest = JSON.parse(readFileSync(fullPath, 'utf8')) as E2eManifest;
        } else {
          const runId = toOptionalString(runIdArg) || resolveDefaultE2eManifestRunId(projectRoot);
          if (!runId) throw new Error('未找到任何 e2e manifest，请先执行 `licell e2e run`');
          manifest = loadE2eManifest(runId, projectRoot);
          if (!manifest) throw new Error(`未找到 runId=${runId} 的 manifest`);
        }

        showIntro(pc.bgBlue(pc.white(' 🧹 Licell E2E Cleanup ')));
        console.log(`runId:      ${pc.cyan(manifest.runId)}`);
        console.log(`workspace:  ${pc.cyan(manifest.workspaceDir)}`);
        console.log(`manifest:   ${pc.cyan(getE2eManifestPath(manifest.runId, manifest.projectRoot))}\n`);

        await cleanupByManifest(manifest, {
          yes: Boolean(options.yes),
          keepWorkspace: Boolean(options.keepWorkspace)
        });
        showOutro('Done.');
      } catch (err: unknown) {
        if (isJsonOutput()) {
          emitCliError(err, { stage: 'e2e.cleanup' });
        } else {
          console.error(pc.red(formatErrorMessage(err)));
        }
        process.exitCode = 1;
      }
    });

  registerCliCommand(cli, e2eListCommand)
    .action(() => {
      const runIds = listE2eManifestRunIds(process.cwd());
      if (runIds.length === 0) {
        showOutro('当前项目暂无 e2e 记录');
        return;
      }
      for (const runId of runIds) {
        const manifest = loadE2eManifest(runId, process.cwd());
        if (!manifest) continue;
        console.log(
          `${pc.cyan(runId)}  suite=${pc.gray(manifest.suite)}  status=${pc.gray(manifest.status)}  workspace=${pc.gray(manifest.workspaceDir)}`
        );
      }
      console.log('');
      showOutro('Done.');
    });
}

export const e2eCommandModule = defineCommandModule({
  section: AUTOMATION_SECTION,
  register: registerE2eCommands,
  namespaces: {
    e2e: {
      summary: '运行、查看与清理 licell E2E 套件。',
      examples: ['licell e2e run', 'licell e2e list', 'licell e2e cleanup <runId>']
    }
  },
  commands: [e2eRunCommand, e2eCleanupCommand, e2eListCommand]
});
