import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { join, resolve } from 'path';
import pc from 'picocolors';
import { runFcApiDeployPrecheck } from '../providers/fc';
import { runDoctorCloudDiagnostics } from '../providers/doctor-cloud';
import { normalizeAuth, normalizeProject, type AuthConfig, type ProjectConfig } from './config';
import { parseDeployRuntimeOption } from './deploy-runtime';
import {
  type LicellDoctorNextCommand,
  type LicellDoctorRemediation,
  normalizeDoctorNextCommands,
  normalizeDoctorRemediationItems
} from './doctor-guidance';

export type LicellDoctorCheckStatus = 'ok' | 'warn' | 'error' | 'skip';
export type LicellDoctorCheckCategory = 'auth' | 'global' | 'project' | 'deploy' | 'cloud' | 'domain';
export interface LicellDoctorCheck {
  id: string;
  title: string;
  category: LicellDoctorCheckCategory;
  status: LicellDoctorCheckStatus;
  summary: string;
  details: string[];
  remediation: LicellDoctorRemediation[];
  nextCommands: LicellDoctorNextCommand[];
  data?: Record<string, unknown>;
}

export interface LicellDoctorRunOptions {
  cwd?: string;
  runtime?: string;
  entry?: string;
  checkDockerDaemon?: boolean;
  offline?: boolean;
}

export interface LicellDoctorReport {
  stage: 'doctor';
  healthy: boolean;
  checkCount: number;
  okCount: number;
  warnCount: number;
  errorCount: number;
  skipCount: number;
  context: {
    cwd: string;
    globalDir: string;
    authFile: string | null;
    globalConfigFile: string | null;
    projectFile: string | null;
    runtime: string | null;
    entry: string | null;
    offline: boolean;
  };
  checks: LicellDoctorCheck[];
}

type ProbeSource = 'current' | 'legacy' | 'missing';

interface JsonFileProbe {
  source: ProbeSource;
  path: string;
  exists: boolean;
  parseOk: boolean;
  raw?: unknown;
  parseError?: string;
}

interface DoctorResolvedRuntime {
  source: 'option' | 'project';
  raw: string;
  deployTypeHint?: 'api' | 'static';
  runtime?: string;
  error?: string;
}

interface LicellDoctorContext {
  cwd: string;
  globalDir: string;
  authProbe: JsonFileProbe;
  globalConfigProbe: JsonFileProbe;
  projectProbe: JsonFileProbe;
  project: ProjectConfig | null;
  effectiveRuntime: DoctorResolvedRuntime | null;
  entry: string | null;
  checkDockerDaemon: boolean;
  offline: boolean;
}

interface DoctorCheckDefinition {
  id: string;
  run(context: LicellDoctorContext): LicellDoctorCheck;
}

interface LicellDoctorCheckInput extends Omit<LicellDoctorCheck, 'remediation' | 'nextCommands'> {
  remediation: Array<string | LicellDoctorRemediation>;
  nextCommands: Array<string | LicellDoctorNextCommand>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toOptionalString(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function formatErrorMessage(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

function readJsonProbe(path: string, source: Exclude<ProbeSource, 'missing'>): JsonFileProbe {
  try {
    return {
      source,
      path,
      exists: true,
      parseOk: true,
      raw: JSON.parse(readFileSync(path, 'utf8'))
    };
  } catch (err: unknown) {
    return {
      source,
      path,
      exists: true,
      parseOk: false,
      parseError: formatErrorMessage(err)
    };
  }
}

function probePreferredJsonFile(preferredPath: string, legacyPath?: string): JsonFileProbe {
  if (existsSync(preferredPath)) return readJsonProbe(preferredPath, 'current');
  if (legacyPath && existsSync(legacyPath)) return readJsonProbe(legacyPath, 'legacy');
  return {
    source: 'missing',
    path: preferredPath,
    exists: false,
    parseOk: false
  };
}

function createDoctorContext(options: LicellDoctorRunOptions = {}): LicellDoctorContext {
  const cwd = resolve(options.cwd || process.cwd());
  const globalDir = join(homedir(), '.licell-cli');
  const legacyGlobalDir = join(homedir(), '.ali-cli');
  const authProbe = probePreferredJsonFile(join(globalDir, 'auth.json'), join(legacyGlobalDir, 'auth.json'));
  const globalConfigProbe = probePreferredJsonFile(join(globalDir, 'config.json'));
  const projectProbe = probePreferredJsonFile(join(cwd, '.licell', 'project.json'), join(cwd, '.ali', 'project.json'));

  let project: ProjectConfig | null = null;
  if (projectProbe.exists && projectProbe.parseOk && isRecord(projectProbe.raw)) {
    project = normalizeProject(projectProbe.raw);
  }

  const runtimeInput = toOptionalString(options.runtime) || toOptionalString(project?.runtime);
  let effectiveRuntime: DoctorResolvedRuntime | null = null;
  if (runtimeInput) {
    const source: 'option' | 'project' = toOptionalString(options.runtime) ? 'option' : 'project';
    try {
      const parsed = parseDeployRuntimeOption(runtimeInput);
      effectiveRuntime = {
        source,
        raw: runtimeInput,
        deployTypeHint: parsed.deployTypeHint,
        runtime: parsed.runtime
      };
    } catch (err: unknown) {
      effectiveRuntime = {
        source,
        raw: runtimeInput,
        error: formatErrorMessage(err)
      };
    }
  }

  return {
    cwd,
    globalDir,
    authProbe,
    globalConfigProbe,
    projectProbe,
    project,
    effectiveRuntime,
    entry: toOptionalString(options.entry) || null,
    checkDockerDaemon: Boolean(options.checkDockerDaemon),
    offline: Boolean(options.offline)
  };
}

function createCheck(input: LicellDoctorCheckInput): LicellDoctorCheck {
  return {
    ...input,
    details: [...input.details],
    remediation: normalizeDoctorRemediationItems(input.remediation),
    nextCommands: normalizeDoctorNextCommands(input.nextCommands),
    ...(input.data ? { data: { ...input.data } } : {})
  };
}

function resolveAuthData(probe: JsonFileProbe) {
  if (!probe.exists || !probe.parseOk) return { auth: null as AuthConfig | null, invalidShape: false };
  const auth = normalizeAuth(probe.raw);
  return { auth, invalidShape: auth === null };
}

const DOCTOR_CHECKS: readonly DoctorCheckDefinition[] = [
  {
    id: 'auth.credentials',
    run(context) {
      const probe = context.authProbe;
      if (!probe.exists) {
        return createCheck({
          id: 'auth.credentials',
          title: 'Auth credentials',
          category: 'auth',
          status: 'error',
          summary: '未检测到 licell 登录态。',
          details: [`expected: ${probe.path}`],
          remediation: ['先执行 `licell login`，或通过团队分发的 restore token 执行 `licell auth restore`。'],
          nextCommands: ['licell login', 'licell auth restore <token> [passkey]']
        });
      }
      if (!probe.parseOk) {
        return createCheck({
          id: 'auth.credentials',
          title: 'Auth credentials',
          category: 'auth',
          status: 'error',
          summary: '登录凭证文件存在，但 JSON 解析失败。',
          details: [`path: ${probe.path}`, `error: ${probe.parseError || 'unknown parse error'}`],
          remediation: ['修复或删除损坏的 auth 文件，然后重新执行 `licell login` 或 `licell auth restore`。'],
          nextCommands: ['licell login', 'licell auth restore <token> [passkey]']
        });
      }

      const { auth, invalidShape } = resolveAuthData(probe);
      if (!auth || invalidShape) {
        return createCheck({
          id: 'auth.credentials',
          title: 'Auth credentials',
          category: 'auth',
          status: 'error',
          summary: '登录凭证文件存在，但内容不符合 licell 期望结构。',
          details: [`path: ${probe.path}`],
          remediation: ['重新执行 `licell login` 写入正确的 accountId/ak/sk/region。'],
          nextCommands: ['licell login', 'licell whoami']
        });
      }

      const details = [
        `path: ${probe.path}`,
        `accountId: ${auth.accountId}`,
        `region: ${auth.region}`
      ];
      if (auth.authSource) details.push(`authSource: ${auth.authSource}`);
      if (auth.ramUser) details.push(`ramUser: ${auth.ramUser}`);

      if (probe.source === 'legacy') {
        return createCheck({
          id: 'auth.credentials',
          title: 'Auth credentials',
          category: 'auth',
          status: 'warn',
          summary: '检测到 legacy 登录态（`.ali-cli`）；建议迁移到 `~/.licell-cli`。',
          details,
          remediation: ['后续执行读凭证命令时会自动迁移，也可重新执行 `licell login` 主动写入新位置。'],
          nextCommands: ['licell whoami', 'licell login'],
          data: {
            accountId: auth.accountId,
            region: auth.region,
            source: probe.source
          }
        });
      }

      return createCheck({
        id: 'auth.credentials',
        title: 'Auth credentials',
        category: 'auth',
        status: 'ok',
        summary: '已检测到 licell 登录态。',
        details,
        remediation: [],
        nextCommands: ['licell whoami'],
        data: {
          accountId: auth.accountId,
          region: auth.region,
          source: probe.source
        }
      });
    }
  },
  {
    id: 'global.domain',
    run(context) {
      const probe = context.globalConfigProbe;
      if (!probe.exists) {
        return createCheck({
          id: 'global.domain',
          title: 'Global config',
          category: 'global',
          status: 'skip',
          summary: '未检测到全局配置文件；这是可选状态。',
          details: [`expected: ${probe.path}`],
          remediation: ['如需自动复用域名后缀，可配置全局 domain suffix。'],
          nextCommands: ['licell config domain example.com']
        });
      }
      if (!probe.parseOk) {
        return createCheck({
          id: 'global.domain',
          title: 'Global config',
          category: 'global',
          status: 'error',
          summary: '全局配置文件存在，但 JSON 解析失败。',
          details: [`path: ${probe.path}`, `error: ${probe.parseError || 'unknown parse error'}`],
          remediation: ['修复或删除损坏的 config 文件，再重新设置所需默认项。'],
          nextCommands: ['licell config domain example.com']
        });
      }
      if (!isRecord(probe.raw)) {
        return createCheck({
          id: 'global.domain',
          title: 'Global config',
          category: 'global',
          status: 'error',
          summary: '全局配置文件必须是 JSON 对象。',
          details: [`path: ${probe.path}`],
          remediation: ['把 `~/.licell-cli/config.json` 修复为对象结构。'],
          nextCommands: ['licell config domain example.com']
        });
      }

      const domainSuffix = toOptionalString(probe.raw.domainSuffix);
      if (!domainSuffix) {
        return createCheck({
          id: 'global.domain',
          title: 'Global config',
          category: 'global',
          status: 'skip',
          summary: '未设置默认域名后缀；仅影响自动域名推导。',
          details: [`path: ${probe.path}`],
          remediation: ['如果团队有统一域名后缀，建议配置全局默认值。'],
          nextCommands: ['licell config domain example.com'],
          data: {
            source: probe.source
          }
        });
      }

      return createCheck({
        id: 'global.domain',
        title: 'Global config',
        category: 'global',
        status: 'ok',
        summary: `已配置默认域名后缀：${domainSuffix}`,
        details: [`path: ${probe.path}`],
        remediation: [],
        nextCommands: ['licell config domain'],
        data: {
          domainSuffix,
          source: probe.source
        }
      });
    }
  },
  {
    id: 'project.config',
    run(context) {
      const probe = context.projectProbe;
      if (!probe.exists) {
        return createCheck({
          id: 'project.config',
          title: 'Project config',
          category: 'project',
          status: 'warn',
          summary: '当前目录未检测到 licell 项目配置。',
          details: [`cwd: ${context.cwd}`, `expected: ${probe.path}`],
          remediation: ['如果这里本应是 licell 项目，请执行 `licell init` 或切到正确目录。'],
          nextCommands: ['licell init', 'licell init --runtime nodejs22']
        });
      }
      if (!probe.parseOk) {
        return createCheck({
          id: 'project.config',
          title: 'Project config',
          category: 'project',
          status: 'error',
          summary: '项目配置文件存在，但 JSON 解析失败。',
          details: [`path: ${probe.path}`, `error: ${probe.parseError || 'unknown parse error'}`],
          remediation: ['修复 `.licell/project.json`（或 legacy `.ali/project.json`）后再执行部署相关命令。'],
          nextCommands: ['licell init']
        });
      }
      if (!isRecord(probe.raw)) {
        return createCheck({
          id: 'project.config',
          title: 'Project config',
          category: 'project',
          status: 'error',
          summary: '项目配置文件必须是 JSON 对象。',
          details: [`path: ${probe.path}`],
          remediation: ['把项目配置修复为对象结构，或重新执行 `licell init`。'],
          nextCommands: ['licell init']
        });
      }

      const details = [`path: ${probe.path}`];
      if (context.project?.appName) details.push(`appName: ${context.project.appName}`);
      if (context.project?.runtime) details.push(`runtime: ${context.project.runtime}`);

      if (probe.source === 'legacy') {
        return createCheck({
          id: 'project.config',
          title: 'Project config',
          category: 'project',
          status: 'warn',
          summary: '检测到 legacy 项目配置（`.ali/project.json`）；建议迁移到 `.licell/project.json`。',
          details,
          remediation: ['重新执行 `licell init`，或把 legacy 配置迁移到 `.licell/project.json`。'],
          nextCommands: ['licell init'],
          data: {
            source: probe.source,
            appName: context.project?.appName || null,
            runtime: context.project?.runtime || null
          }
        });
      }

      return createCheck({
        id: 'project.config',
        title: 'Project config',
        category: 'project',
        status: 'ok',
        summary: '已检测到当前目录的 licell 项目配置。',
        details,
        remediation: [],
        nextCommands: ['licell init'],
        data: {
          source: probe.source,
          appName: context.project?.appName || null,
          runtime: context.project?.runtime || null
        }
      });
    }
  },
  {
    id: 'project.app',
    run(context) {
      if (!context.project) {
        return createCheck({
          id: 'project.app',
          title: 'Project appName',
          category: 'project',
          status: 'skip',
          summary: '未检测到有效项目配置，跳过 appName 检查。',
          details: [],
          remediation: [],
          nextCommands: []
        });
      }
      if (!toOptionalString(context.project.appName)) {
        return createCheck({
          id: 'project.app',
          title: 'Project appName',
          category: 'project',
          status: 'warn',
          summary: '项目未配置 appName。',
          details: ['deploy / fn / logs 等命令通常依赖 appName 作为默认函数名。'],
          remediation: ['为当前项目补齐 appName，避免后续命令依赖交互推导。'],
          nextCommands: ['licell init --app my-app']
        });
      }

      return createCheck({
        id: 'project.app',
        title: 'Project appName',
        category: 'project',
        status: 'ok',
        summary: `项目 appName 已配置：${context.project.appName}`,
        details: [],
        remediation: [],
        nextCommands: [],
        data: {
          appName: context.project.appName
        }
      });
    }
  },
  {
    id: 'deploy.runtime',
    run(context) {
      if (!context.effectiveRuntime) {
        if (context.project) {
          return createCheck({
            id: 'deploy.runtime',
            title: 'Deploy runtime',
            category: 'deploy',
            status: 'warn',
            summary: '项目未配置 runtime，无法继续做 FC API 预检。',
            details: [],
            remediation: ['为项目写入 runtime，或执行 doctor 时显式传 `--runtime`。'],
            nextCommands: ['licell init --runtime nodejs22', 'licell doctor --runtime nodejs22']
          });
        }

        return createCheck({
          id: 'deploy.runtime',
          title: 'Deploy runtime',
          category: 'deploy',
          status: 'skip',
          summary: '当前目录不是 licell 项目，且未显式传入 runtime；跳过 deploy runtime 检查。',
          details: [],
          remediation: [],
          nextCommands: ['licell doctor --runtime nodejs22 --entry src/index.ts']
        });
      }

      if (context.effectiveRuntime.error) {
        return createCheck({
          id: 'deploy.runtime',
          title: 'Deploy runtime',
          category: 'deploy',
          status: 'error',
          summary: 'runtime 解析失败。',
          details: [
            `source: ${context.effectiveRuntime.source}`,
            `raw: ${context.effectiveRuntime.raw}`,
            `error: ${context.effectiveRuntime.error}`
          ],
          remediation: ['改为受支持的 runtime，例如 nodejs22、python3.13、docker。'],
          nextCommands: ['licell deploy spec', 'licell doctor --runtime nodejs22']
        });
      }

      if (context.effectiveRuntime.deployTypeHint === 'static') {
        return createCheck({
          id: 'deploy.runtime',
          title: 'Deploy runtime',
          category: 'deploy',
          status: 'skip',
          summary: `当前目标 runtime=${context.effectiveRuntime.raw}，属于静态站点；跳过 FC API runtime 检查。`,
          details: [`source: ${context.effectiveRuntime.source}`],
          remediation: [],
          nextCommands: ['licell deploy --type static']
        });
      }

      return createCheck({
        id: 'deploy.runtime',
        title: 'Deploy runtime',
        category: 'deploy',
        status: 'ok',
        summary: `已解析 deploy runtime：${context.effectiveRuntime.runtime}`,
        details: [`source: ${context.effectiveRuntime.source}`, `raw: ${context.effectiveRuntime.raw}`],
        remediation: [],
        nextCommands: ['licell deploy spec'],
        data: {
          runtime: context.effectiveRuntime.runtime,
          source: context.effectiveRuntime.source
        }
      });
    }
  },
  {
    id: 'deploy.precheck',
    run(context) {
      if (!context.effectiveRuntime || context.effectiveRuntime.error) {
        return createCheck({
          id: 'deploy.precheck',
          title: 'Deploy precheck',
          category: 'deploy',
          status: 'skip',
          summary: 'runtime 未就绪，跳过 FC API 预检。',
          details: [],
          remediation: [],
          nextCommands: []
        });
      }

      if (context.effectiveRuntime.deployTypeHint === 'static' || !context.effectiveRuntime.runtime) {
        return createCheck({
          id: 'deploy.precheck',
          title: 'Deploy precheck',
          category: 'deploy',
          status: 'skip',
          summary: '当前目标不是 FC API runtime，跳过 FC API 预检。',
          details: [],
          remediation: [],
          nextCommands: []
        });
      }

      const result = runFcApiDeployPrecheck({
        runtime: context.effectiveRuntime.runtime,
        entry: context.entry || undefined,
        projectRoot: context.cwd,
        checkDockerDaemon: context.checkDockerDaemon
      });
      const errorCount = result.issues.filter((issue) => issue.level === 'error').length;
      const warningCount = result.issues.filter((issue) => issue.level === 'warning').length;
      const details = [
        `runtime: ${result.runtime}`,
        `entry: ${result.entry || '(none)'}`,
        ...result.issues.map((issue) => `${issue.level}: ${issue.message}`)
      ];
      const remediation = unique(result.issues.flatMap((issue) => issue.remediation || []));
      const nextCommands = [
        `licell deploy spec ${result.runtime}`,
        `licell deploy check --runtime ${result.runtime}${result.entry ? ` --entry ${result.entry}` : ''}${context.checkDockerDaemon ? ' --docker-daemon' : ''}`.trim()
      ];

      if (errorCount > 0) {
        return createCheck({
          id: 'deploy.precheck',
          title: 'Deploy precheck',
          category: 'deploy',
          status: 'error',
          summary: `FC API 预检失败：${errorCount} 个 error，${warningCount} 个 warning。`,
          details,
          remediation,
          nextCommands,
          data: {
            runtime: result.runtime,
            entry: result.entry,
            errorCount,
            warningCount,
            issues: result.issues
          }
        });
      }

      if (warningCount > 0) {
        return createCheck({
          id: 'deploy.precheck',
          title: 'Deploy precheck',
          category: 'deploy',
          status: 'warn',
          summary: `FC API 预检通过，但还有 ${warningCount} 个 warning。`,
          details,
          remediation,
          nextCommands,
          data: {
            runtime: result.runtime,
            entry: result.entry,
            errorCount,
            warningCount,
            issues: result.issues
          }
        });
      }

      return createCheck({
        id: 'deploy.precheck',
        title: 'Deploy precheck',
        category: 'deploy',
        status: 'ok',
        summary: 'FC API 预检通过。',
        details,
        remediation: [],
        nextCommands,
        data: {
          runtime: result.runtime,
          entry: result.entry,
          errorCount,
          warningCount,
          issues: result.issues
        }
      });
    }
  }
] as const;

function countStatuses(checks: LicellDoctorCheck[]) {
  const counts = {
    okCount: 0,
    warnCount: 0,
    errorCount: 0,
    skipCount: 0
  };
  for (const check of checks) {
    if (check.status === 'ok') counts.okCount += 1;
    if (check.status === 'warn') counts.warnCount += 1;
    if (check.status === 'error') counts.errorCount += 1;
    if (check.status === 'skip') counts.skipCount += 1;
  }
  return counts;
}

export async function runLicellDoctor(options: LicellDoctorRunOptions = {}): Promise<LicellDoctorReport> {
  const context = createDoctorContext(options);
  const checks = DOCTOR_CHECKS.map((definition) => definition.run(context));
  const authCheck = checks.find((check) => check.id === 'auth.credentials');
  const auth = context.authProbe.exists && context.authProbe.parseOk ? normalizeAuth(context.authProbe.raw) : null;

  if (context.offline) {
    checks.push(createCheck({
      id: 'domain.consistency',
      title: 'Domain consistency',
      category: 'domain',
      status: 'skip',
      summary: '已显式启用 offline 模式，跳过云端域名一致性检查。',
      details: [],
      remediation: [],
      nextCommands: ['licell doctor']
    }));
    checks.push(createCheck({
      id: 'deploy.target',
      title: 'Deploy target',
      category: 'deploy',
      status: 'skip',
      summary: '已显式启用 offline 模式，跳过云端 deploy target 一致性检查。',
      details: [],
      remediation: [],
      nextCommands: ['licell doctor']
    }));
    checks.push(createCheck({
      id: 'cloud.offline',
      title: 'Cloud diagnostics',
      category: 'cloud',
      status: 'skip',
      summary: '已显式启用 offline 模式，跳过所有云端只读探测。',
      details: [],
      remediation: [],
      nextCommands: ['licell doctor --output json']
    }));
  } else if (!auth || authCheck?.status === 'error') {
    checks.push(createCheck({
      id: 'domain.consistency',
      title: 'Domain consistency',
      category: 'domain',
      status: 'skip',
      summary: '本地 auth 未就绪，跳过云端域名一致性检查。',
      details: [],
      remediation: [],
      nextCommands: []
    }));
    checks.push(createCheck({
      id: 'deploy.target',
      title: 'Deploy target',
      category: 'deploy',
      status: 'skip',
      summary: '本地 auth 未就绪，跳过云端 deploy target 一致性检查。',
      details: [],
      remediation: [],
      nextCommands: []
    }));
    checks.push(createCheck({
      id: 'cloud.identity',
      title: 'Cloud identity',
      category: 'cloud',
      status: 'skip',
      summary: '本地 auth 未就绪，跳过云端身份与权限探测。',
      details: [],
      remediation: [],
      nextCommands: []
    }));
    checks.push(createCheck({
      id: 'cloud.ram',
      title: 'Cloud RAM profile',
      category: 'cloud',
      status: 'skip',
      summary: '本地 auth 未就绪，跳过 RAM 权限探测。',
      details: [],
      remediation: [],
      nextCommands: []
    }));
    checks.push(createCheck({
      id: 'cloud.capabilities',
      title: 'Cloud capabilities',
      category: 'cloud',
      status: 'skip',
      summary: '本地 auth 未就绪，跳过 region capability probe。',
      details: [],
      remediation: [],
      nextCommands: []
    }));
  } else {
    const cloud = await runDoctorCloudDiagnostics({
      auth,
      project: context.project,
      deployTypeHint: context.effectiveRuntime?.deployTypeHint,
      runtime: context.effectiveRuntime?.runtime || null
    });
    checks.push(createCheck({
      id: 'domain.consistency',
      title: 'Domain consistency',
      category: 'domain',
      status: cloud.domainConsistency.status,
      summary: cloud.domainConsistency.summary,
      details: cloud.domainConsistency.details,
      remediation: cloud.domainConsistency.remediation,
      nextCommands: cloud.domainConsistency.nextCommands || [],
      ...(cloud.domainConsistency.data ? { data: cloud.domainConsistency.data } : {})
    }));
    checks.push(createCheck({
      id: 'deploy.target',
      title: 'Deploy target',
      category: 'deploy',
      status: cloud.deployTarget.status,
      summary: cloud.deployTarget.summary,
      details: cloud.deployTarget.details,
      remediation: cloud.deployTarget.remediation,
      nextCommands: cloud.deployTarget.nextCommands || [],
      ...(cloud.deployTarget.data ? { data: cloud.deployTarget.data } : {})
    }));
    checks.push(createCheck({
      id: 'cloud.identity',
      title: 'Cloud identity',
      category: 'cloud',
      status: cloud.identity.status,
      summary: cloud.identity.summary,
      details: cloud.identity.details,
      remediation: cloud.identity.remediation,
      nextCommands: cloud.identity.nextCommands || [],
      ...(cloud.identity.data ? { data: cloud.identity.data } : {})
    }));
    checks.push(createCheck({
      id: 'cloud.ram',
      title: 'Cloud RAM profile',
      category: 'cloud',
      status: cloud.ramProfile.status,
      summary: cloud.ramProfile.summary,
      details: cloud.ramProfile.details,
      remediation: cloud.ramProfile.remediation,
      nextCommands: cloud.ramProfile.nextCommands || [],
      ...(cloud.ramProfile.data ? { data: cloud.ramProfile.data } : {})
    }));
    checks.push(createCheck({
      id: 'cloud.capabilities',
      title: 'Cloud capabilities',
      category: 'cloud',
      status: cloud.capabilities.status,
      summary: cloud.capabilities.summary,
      details: cloud.capabilities.details,
      remediation: cloud.capabilities.remediation,
      nextCommands: cloud.capabilities.nextCommands || [],
      data: cloud.capabilities.data
    }));
  }

  const counts = countStatuses(checks);
  const resolvedRuntime = context.effectiveRuntime?.runtime || null;
  const resolvedEntry = context.entry || null;

  return {
    stage: 'doctor',
    healthy: counts.errorCount === 0,
    checkCount: checks.length,
    okCount: counts.okCount,
    warnCount: counts.warnCount,
    errorCount: counts.errorCount,
    skipCount: counts.skipCount,
    context: {
      cwd: context.cwd,
      globalDir: context.globalDir,
      authFile: context.authProbe.exists ? context.authProbe.path : null,
      globalConfigFile: context.globalConfigProbe.exists ? context.globalConfigProbe.path : null,
      projectFile: context.projectProbe.exists ? context.projectProbe.path : null,
      runtime: resolvedRuntime,
      entry: resolvedEntry,
      offline: context.offline
    },
    checks
  };
}

const STATUS_ICON: Record<LicellDoctorCheckStatus, string> = {
  ok: pc.green('✓'),
  warn: pc.yellow('!'),
  error: pc.red('✖'),
  skip: pc.gray('·')
};

function renderCheckDetails(check: LicellDoctorCheck) {
  const lines: string[] = [];
  for (const detail of check.details) {
    lines.push(`    ${pc.gray(detail)}`);
  }
  if (check.remediation.length > 0) {
    for (const item of check.remediation) {
      lines.push(`    ${pc.yellow('fix:')} ${item.text}`);
    }
  }
  if (check.nextCommands.length > 0 && check.status !== 'ok') {
    for (const command of check.nextCommands) {
      lines.push(`    ${pc.cyan('next:')} ${command.commandTemplate}`);
    }
  }
  return lines;
}

export function renderLicellDoctorReport(report: LicellDoctorReport) {
  const lines = [
    `${pc.bold('health')}: ${report.healthy ? pc.green('ready') : pc.red('blocked')}`,
    `${pc.bold('checks')}: ${report.checkCount}  ok=${report.okCount} warn=${report.warnCount} error=${report.errorCount} skip=${report.skipCount}`,
    ''
  ];

  for (const check of report.checks) {
    lines.push(`${STATUS_ICON[check.status]} ${pc.bold(check.id)}  ${check.summary}`);
    lines.push(...renderCheckDetails(check));
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}
