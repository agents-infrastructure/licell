import type { CAC } from 'cac';
import { intro, outro } from '@clack/prompts';
import pc from 'picocolors';
import { mkdirSync, existsSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { spawnSync } from 'child_process';
import { executeWithAuthRecovery } from '../utils/auth-recovery';
import { Config } from '../utils/config';
import { deleteOssBucketRecursively } from '../providers/oss';
import {
  ensureDestructiveActionConfirmed,
  isInteractiveTTY,
  normalizeCustomDomain,
  normalizeDomainSuffix,
  toOptionalString
} from '../utils/cli-shared';
import {
  type E2eManifest,
  type E2eStepRecord,
  ensureEmptyOrMissingDir,
  generateE2eRunId,
  getE2eManifestPath,
  loadE2eManifest,
  normalizeE2eSuite,
  resolveDefaultE2eManifestRunId,
  resolveSelfCliInvocation,
  saveE2eManifest,
  listE2eManifestRunIds
} from '../utils/e2e';
import { parseRootAndSubdomain } from '../utils/domain';
import { formatErrorMessage } from '../utils/errors';

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

function readProjectAppName(workspaceDir: string) {
  const paths = [join(workspaceDir, '.licell', 'project.json'), join(workspaceDir, '.ali', 'project.json')];
  for (const path of paths) {
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

function readProjectNetwork(workspaceDir: string) {
  const paths = [join(workspaceDir, '.licell', 'project.json'), join(workspaceDir, '.ali', 'project.json')];
  for (const path of paths) {
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

function runCliCommand(
  invocation: ReturnType<typeof resolveSelfCliInvocation>,
  args: string[],
  cwd: string
) {
  const argv = [...invocation.prefixArgs, ...args];
  const result = spawnSync(invocation.command, argv, {
    cwd,
    stdio: 'inherit',
    env: process.env
  });
  if (result.status !== 0) {
    const signal = result.signal ? ` signal=${result.signal}` : '';
    throw new Error(`命令失败: licell ${args.join(' ')} (exit=${String(result.status)}${signal})`);
  }
}

function runSystemCommand(command: string, args: string[], cwd: string) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: process.env
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

function applyStepRecord(manifest: E2eManifest, step: E2eStepRecord) {
  manifest.steps.push(step);
  manifest.updatedAt = nowIso();
}

function runStep(ctx: E2eStepContext, name: string, args: string[]) {
  const startedAt = nowIso();
  const command = `licell ${args.join(' ')}`;
  try {
    runCliCommand(ctx.invocation, args, ctx.workspaceDir);
    applyStepRecord(ctx.manifest, {
      name,
      command,
      status: 'ok',
      startedAt,
      endedAt: nowIso()
    });
    saveE2eManifest(ctx.manifest);
  } catch (err: unknown) {
    applyStepRecord(ctx.manifest, {
      name,
      command,
      status: 'failed',
      startedAt,
      endedAt: nowIso(),
      error: formatErrorMessage(err)
    });
    saveE2eManifest(ctx.manifest);
    throw err;
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
    saveE2eManifest(ctx.manifest);
    return;
  }
  runStep(ctx, name, args);
}

function runExternalStep(ctx: E2eStepContext, name: string, command: string, args: string[]) {
  const startedAt = nowIso();
  const displayCommand = `${command} ${args.join(' ')}`.trim();
  try {
    runSystemCommand(command, args, ctx.workspaceDir);
    applyStepRecord(ctx.manifest, {
      name,
      command: displayCommand,
      status: 'ok',
      startedAt,
      endedAt: nowIso()
    });
    saveE2eManifest(ctx.manifest);
  } catch (err: unknown) {
    applyStepRecord(ctx.manifest, {
      name,
      command: displayCommand,
      status: 'failed',
      startedAt,
      endedAt: nowIso(),
      error: formatErrorMessage(err)
    });
    saveE2eManifest(ctx.manifest);
    throw err;
  }
}

function resolveRunCapabilities(options: {
  domain?: string;
  domainSuffix?: string;
  enableCdn: boolean;
  includeStatic: boolean;
  useVpc: boolean;
}): Array<'fc' | 'dns' | 'oss' | 'rds' | 'redis' | 'cdn' | 'logs' | 'vpc'> {
  const caps: Array<'fc' | 'dns' | 'oss' | 'rds' | 'redis' | 'cdn' | 'logs' | 'vpc'> = ['fc', 'oss', 'rds', 'redis', 'logs'];
  if (options.domain || options.domainSuffix) caps.push('dns');
  if (options.enableCdn) caps.push('cdn');
  if (options.includeStatic) caps.push('oss');
  if (options.useVpc) caps.push('vpc');
  return [...new Set(caps)];
}

function resolveStaticBucketName(appName: string, accountId: string) {
  return `licell-${appName}-${accountId.substring(0, 4)}`.toLowerCase();
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
  if (domain && domainSuffix) throw new Error('--domain 与 --domain-suffix 不能同时使用');

  const enableCdn = Boolean(options.enableCdn);
  if (enableCdn && !domain && !domainSuffix) {
    throw new Error('--enable-cdn 需要配合 --domain 或 --domain-suffix');
  }
  const autoCleanup = Boolean(options.cleanup);
  const yes = Boolean(options.yes);
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

  intro(pc.bgBlue(pc.white(' 🧪 Licell E2E Runner ')));
  console.log(`runId:      ${pc.cyan(runId)}`);
  console.log(`suite:      ${pc.cyan(suite)}`);
  console.log(`workspace:  ${pc.cyan(workspaceDir)}`);
  console.log(`manifest:   ${pc.cyan(manifestPath)}\n`);
  printSection('执行计划', [
    `runtime: ${runtime}`,
    `target: ${target}`,
    `api function: ${appName}`,
    `network: ${useVpc ? 'vpc(shared licell-vpc)' : 'public(no-vpc)'}`,
    ...(domain ? [`fixed domain: ${domain}`] : []),
    ...(domainSuffix ? [`domain suffix: ${domainSuffix}`] : []),
    ...(enableCdn ? ['cdn: enabled'] : []),
    ...(suite === 'full' && !skipStatic ? ['static deploy: enabled'] : ['static deploy: skipped'])
  ]);

  let runError: unknown;
  try {
    await executeWithAuthRecovery(
      {
        commandLabel: 'licell e2e run',
        interactiveTTY,
        requiredCapabilities: resolveRunCapabilities({
          domain,
          domainSuffix,
          enableCdn,
          includeStatic: suite === 'full' && !skipStatic,
          useVpc
        })
      },
      async () => {
        runStep(ctx, 'init', ['init', '--runtime', runtime, '--app', appName, '--yes']);
        const appNameFromConfig = readProjectAppName(workspaceDir);
        if (!appNameFromConfig) throw new Error('init 成功后未检测到 appName');
        if (runtime.startsWith('nodejs')) {
          runExternalStep(ctx, 'bun-install', 'bun', ['install']);
        }
        manifest.resources.appName = appNameFromConfig;
        if (!manifest.resources.domain && manifest.resources.domainSuffix) {
          manifest.resources.domain = `${appNameFromConfig}.${manifest.resources.domainSuffix}`;
        }
        manifest.updatedAt = nowIso();
        saveE2eManifest(manifest, projectRoot);
        printSection('创建资源', [
          `fc function: ${appNameFromConfig}`,
          ...(manifest.resources.domain ? [`domain: ${manifest.resources.domain}`] : [])
        ]);

        const deployArgs = ['deploy', '--type', 'api', '--runtime', runtime, '--target', target];
        deployArgs.push(useVpc ? '--enable-vpc' : '--disable-vpc');
        if (domain) deployArgs.push('--domain', domain);
        if (domainSuffix) deployArgs.push('--domain-suffix', domainSuffix);
        if (enableCdn) deployArgs.push('--enable-cdn');
        runStep(ctx, 'deploy-api', deployArgs);
        ctx.state.hasDeployedApi = true;
        const networkFromConfig = readProjectNetwork(workspaceDir);
        if (networkFromConfig) {
          manifest.resources.vpcId = networkFromConfig.vpcId;
          manifest.resources.vswId = networkFromConfig.vswId;
          if (networkFromConfig.sgId) manifest.resources.sgId = networkFromConfig.sgId;
          saveE2eManifest(manifest, projectRoot);
        }

        runStep(ctx, 'fn-list', ['fn', 'list', '--prefix', appNameFromConfig, '--limit', '20']);
        runStep(ctx, 'fn-info', ['fn', 'info', appNameFromConfig, '--target', target]);
        runStep(ctx, 'fn-invoke', ['fn', 'invoke', appNameFromConfig, '--target', target, '--payload', JSON.stringify({ runId, ping: 'pong' })]);

        runStep(ctx, 'env-set', ['env', 'set', 'LICELL_E2E_RUN_ID', runId]);
        runStep(ctx, 'env-list', ['env', 'list', '--target', target]);
        runStep(ctx, 'env-pull', ['env', 'pull', '--target', target]);
        runStep(ctx, 'env-rm', ['env', 'rm', 'LICELL_E2E_RUN_ID', '--yes']);

        runStep(ctx, 'release-list', ['release', 'list', '--limit', '5']);
        runStep(ctx, 'release-promote', ['release', 'promote', '--target', target]);

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
          if (!skipStatic) {
            const auth = Config.requireAuth();
            const staticDistDir = createStaticFixture(workspaceDir, runId);
            runStep(ctx, 'deploy-static', ['deploy', '--type', 'static', '--dist', staticDistDir]);
            ctx.state.hasDeployedStatic = true;
            manifest.resources.staticBucket = resolveStaticBucketName(appNameFromConfig, auth.accountId);
            saveE2eManifest(manifest, projectRoot);
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
        }
      }
    );
    manifest.status = 'succeeded';
    manifest.updatedAt = nowIso();
    saveE2eManifest(manifest, projectRoot);
    printSection('E2E 结果', [
      `runId: ${runId}`,
      `status: ${manifest.status}`,
      ...(manifest.resources.appName ? [`fc function: ${manifest.resources.appName}`] : []),
      ...(manifest.resources.domain ? [`domain: ${manifest.resources.domain}`] : []),
      ...(manifest.resources.staticBucket ? [`oss bucket: ${manifest.resources.staticBucket}`] : []),
      ...(manifest.resources.vpcId ? [`vpc: ${manifest.resources.vpcId}/${manifest.resources.vswId || '-'}`] : [])
    ]);
    console.log(pc.green(`✅ E2E run 完成（${runId}）`));
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
        yes,
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
  outro('Done.');
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
  const appName = manifest.resources.appName;
  const domain = manifest.resources.domain;
  const staticBucket = manifest.resources.staticBucket;
  const vpcId = manifest.resources.vpcId;
  const vswId = manifest.resources.vswId;

  const runCleanupCommand = (
    name: string,
    args: string[],
    options?: { ignoreErrorPatterns?: string[] }
  ) => {
    try {
      runCliCommand(invocation, args, workspaceDir);
      details.push(`${name}: ok`);
    } catch (err: unknown) {
      const message = formatErrorMessage(err);
      const lowerMessage = message.toLowerCase();
      const ignored = (options?.ignoreErrorPatterns || []).some((pattern) => lowerMessage.includes(pattern));
      if (ignored) {
        details.push(`${name}: skipped (${message})`);
        return;
      }
      errors.push(`${name}: ${message}`);
      details.push(`${name}: failed`);
    }
  };

  manifest.cleanup = manifest.cleanup || {};
  manifest.cleanup.attemptedAt = nowIso();
  manifest.cleanup.status = 'pending';
  manifest.cleanup.details = details;
  manifest.cleanup.errors = errors;
  manifest.updatedAt = nowIso();
  saveE2eManifest(manifest, manifest.projectRoot);
  printSection('清理目标', [
    ...(appName ? [`fc function: ${appName}`] : []),
    ...(domain ? [`domain binding: ${domain}`] : []),
    ...(staticBucket ? [`oss bucket: ${staticBucket}`] : []),
    ...(vpcId ? [`vpc network: ${vpcId}/${vswId || '-'} (shared, keep)`] : []),
    ...(options.keepWorkspace ? ['workspace: keep'] : [`workspace: ${workspaceDir}`])
  ]);

  await executeWithAuthRecovery(
    {
      commandLabel: 'licell e2e cleanup',
      interactiveTTY,
      requiredCapabilities: [
        'fc',
        ...(domain ? ['dns' as const] : []),
        ...(staticBucket ? ['oss' as const] : [])
      ]
    },
    async () => {
      if (domain) {
        console.log(pc.gray(`清理 domain: ${domain}`));
        runCleanupCommand('domain-rm', ['domain', 'rm', domain, '--yes']);
      }
      if (appName) {
        console.log(pc.gray(`清理 function: ${appName}`));
        runCleanupCommand(
          'fn-rm',
          ['fn', 'rm', appName, '--force', '--yes'],
          { ignoreErrorPatterns: ['functionnotfound', 'does not exist', 'not found'] }
        );
      }
      if (staticBucket) {
        console.log(pc.gray(`清理 oss bucket: ${staticBucket}`));
        try {
          const result = await deleteOssBucketRecursively(staticBucket);
          details.push(
            `oss-bucket-rm: ok (${result.bucket}, objects=${result.deletedObjects}, bucketDeleted=${result.deletedBucket})`
          );
          console.log(pc.green(`oss 清理完成: ${result.bucket} (objects=${result.deletedObjects})`));
        } catch (err: unknown) {
          errors.push(`oss-bucket-rm: ${formatErrorMessage(err)}`);
          details.push('oss-bucket-rm: failed');
          console.warn(pc.yellow(`oss 清理失败: ${formatErrorMessage(err)}`));
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
}

export function registerE2eCommands(cli: CAC) {
  cli.command('e2e run', '执行固定 E2E 套件（默认 smoke）')
    .option('--suite <suite>', '套件：smoke/full（默认 smoke）')
    .option('--run-id <id>', '指定 runId（默认自动生成）')
    .option('--runtime <runtime>', '部署 runtime（默认 nodejs22）')
    .option('--target <alias>', '部署 target alias（默认 preview）')
    .option('--enable-vpc', 'API 部署启用 VPC（默认关闭，便于无残留清理）')
    .option('--domain <domain>', '固定完整域名（可选）')
    .option('--domain-suffix <suffix>', '固定域名后缀（可选）')
    .option('--db-instance <instanceId>', 'full 套件时附加验证 db info/connect（复用已有实例）')
    .option('--cache-instance <instanceId>', 'full 套件时附加验证 cache info/connect（复用已有实例）')
    .option('--skip-static', 'full 套件时跳过 static + oss upload 场景')
    .option('--enable-cdn', '部署时启用 CDN（需配合 domain/domain-suffix）')
    .option('--cleanup', '执行完后自动清理')
    .option('--workspace <dir>', '指定 E2E 工作目录（默认 .licell/e2e-work/<runId>）')
    .option('--yes', '自动清理时跳过二次确认')
    .action(async (options: E2eRunOptions) => {
      try {
        await executeE2eRun(options);
      } catch (err: unknown) {
        console.error(pc.red(formatErrorMessage(err)));
        process.exitCode = 1;
      }
    });

  cli.command('e2e cleanup [runId]', '清理指定 E2E run 产生的资源')
    .option('--manifest <path>', '直接指定 manifest 文件路径')
    .option('--keep-workspace', '保留本地 workspace 目录')
    .option('--yes', '跳过二次确认（危险）')
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

        intro(pc.bgBlue(pc.white(' 🧹 Licell E2E Cleanup ')));
        console.log(`runId:      ${pc.cyan(manifest.runId)}`);
        console.log(`workspace:  ${pc.cyan(manifest.workspaceDir)}`);
        console.log(`manifest:   ${pc.cyan(getE2eManifestPath(manifest.runId, manifest.projectRoot))}\n`);

        await cleanupByManifest(manifest, {
          yes: Boolean(options.yes),
          keepWorkspace: Boolean(options.keepWorkspace)
        });
        outro('Done.');
      } catch (err: unknown) {
        console.error(pc.red(formatErrorMessage(err)));
        process.exitCode = 1;
      }
    });

  cli.command('e2e list', '查看本项目 e2e 运行记录')
    .action(() => {
      const runIds = listE2eManifestRunIds(process.cwd());
      if (runIds.length === 0) {
        outro('当前项目暂无 e2e 记录');
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
      outro('Done.');
    });
}
