import type { CAC } from 'cac';
import pc from 'picocolors';
import { defineCliCommand, defineCommandModule, registerCliCommand } from './module';
import { AUTOMATION_SECTION } from './sections';
import { showIntro, showOutro } from '../utils/cli-shared';
import { emitCommandResult, isJsonOutput } from '../utils/output';
import { renderLicellDoctorReport, runLicellDoctor } from '../utils/doctor';

const doctorCommand = defineCliCommand({
  rawName: 'doctor',
  description: '诊断本机 licell 登录态、云端权限/目标资源/域名入口、项目配置与部署前置条件',
  region: { scope: 'auth' },
  options: [
    { rawName: '--component <name>', description: '在 workspace / monorepo 根目录显式选择 component' },
    { rawName: '--all-components', description: 'workspace 模式下扫描所有 components，而不是只诊断当前/默认 component' },
    { rawName: '--runtime <runtime>', description: '覆盖项目 runtime 做 deploy 诊断（如 nodejs22 / python3.13 / docker）' },
    { rawName: '--entry <entry>', description: '覆盖 deploy 入口文件路径（默认按项目配置与 runtime 推断）' },
    { rawName: '--docker-daemon', description: '当 runtime=docker 时，附带检查本机 Docker daemon 是否可用' },
    { rawName: '--offline', description: '只做本地诊断，跳过云端只读身份/权限/capability probe' }
  ],
  descriptor: {
    title: 'Diagnose local licell readiness',
    summary: '诊断本机登录态、云端身份/权限/目标资源/域名入口、当前目录项目配置，以及 FC API 的 deploy precheck。',
    notes: [
      '默认包含云端只读探测，会检查身份、权限、deploy target 与域名入口一致性，但不会创建或修改任何云端资源。',
      '当前目录不是 licell 项目时，项目相关检查会以 warn/skip 呈现。',
      '在 workspace / monorepo 根目录，可用 `--component` 聚焦单个 deploy unit，或用 `--all-components` 做整仓扫描。',
      '如果只想排查本地文件与入口契约，可追加 `--offline`。',
      '`checks[].remediation[]`、`checks[].nextCommands[]` 与 `checks[].nextActions[]` 都是稳定的结构化 guidance；Agent 优先读取 `checks[].nextActions[]`。'
    ],
    examples: [
      'licell doctor',
      'licell doctor --component api',
      'licell doctor --all-components --output json',
      'licell doctor --runtime nodejs22 --entry src/index.ts',
      'licell doctor --runtime docker --docker-daemon --output json',
      'licell doctor --offline'
    ],
    taskHints: [
      {
        phase: 'inspect',
        title: '先判断问题在 auth 还是项目',
        description: 'doctor 会先看全局登录态与当前目录项目配置，再决定是否继续做 deploy precheck。',
        commands: ['licell doctor --output json']
      }
    ],
    optionInsights: {
      '--runtime': {
        whenToUse: '当前目录项目未配置 runtime，或你想临时按另一个 runtime 做 deploy 诊断时使用。',
        cautions: ['传入 static/statis 时会跳过 FC API 预检。']
      },
      '--component': {
        whenToUse: '在 workspace / monorepo 根目录只想诊断某个 component 时使用。',
        cautions: ['component 名称必须存在于当前 workspace 配置中。']
      },
      '--all-components': {
        whenToUse: '需要一次扫描 workspace 中所有 deploy units 的 deploy intent 与云端漂移时使用。',
        cautions: ['输出会包含顶层 shared 检查和每个 component 的子报告。']
      },
      '--entry': {
        whenToUse: '入口文件不走默认路径，或你希望排查某个候选入口时使用。',
        cautions: ['仅影响本次 doctor / deploy precheck，不会写回项目配置。']
      },
      '--docker-daemon': {
        whenToUse: 'runtime=docker 时，需要连同本机 Docker daemon 可用性一起诊断。',
        cautions: ['只在 docker runtime 下有实际效果。']
      },
      '--offline': {
        whenToUse: '当前网络受限，或你只想排查本地 auth/project/entry 文件状态时使用。',
        cautions: ['会跳过云端身份、RAM 权限和 region capability probe。']
      }
    },
    recommendedFlow: [
      { title: '先跑本地总诊断', command: 'licell doctor --output json', reason: '先确定问题是在 auth、项目配置，还是 deploy 入口契约。' },
      { title: '查看 runtime 规格', command: 'licell deploy spec', reason: '如果问题落在 runtime/入口契约，先看规范而不是盲改。' },
      { title: '复跑专项 precheck', command: 'licell deploy check', reason: '修完后用 deploy check 单独验证入口与 runtime。' }
    ],
    automation: {
      preferredOutput: 'json',
      explicitInputs: ['--runtime', '--entry', '--docker-daemon', '--offline'],
      notes: [
        'Agent / 脚本应优先使用 `--output json`，读取 `healthy`、统计字段与 `checks[]`。',
        '阻塞项优先读取 `checks[].nextActions[]` 的 `priority=primary` 项；`remediation[]` 用于解释原因和修复语义。'
      ]
    },
    result: {
      summary: '返回本机诊断汇总、计数和逐项检查结果；每个检查项都附带结构化修复建议、兼容的 nextCommands，以及统一的 nextActions。',
      outcomeKey: 'healthy',
      fields: [
        { name: 'stage', description: '固定为 `doctor`。', required: true },
        { name: 'healthy', description: '是否不存在 error 级阻塞项。', required: true },
        { name: 'checkCount', description: '检查项总数。', required: true },
        { name: 'okCount', description: 'ok 检查项数量。', required: true },
        { name: 'warnCount', description: 'warn 检查项数量。', required: true },
        { name: 'errorCount', description: 'error 检查项数量。', required: true },
        { name: 'skipCount', description: 'skip 检查项数量。', required: true },
        { name: 'context', description: '当前 cwd、命中的配置文件路径，以及本次解析出的 runtime/entry/offline。', required: true },
        { name: 'checks', description: '逐项诊断结果数组。', required: true },
        { name: 'components[]', description: '当启用 `--all-components` 时，返回每个 component 的子报告。' },
        { name: 'checks[].id', description: '稳定的检查项标识，例如 `auth.credentials`、`deploy.precheck`、`domain.consistency`。', required: true },
        { name: 'checks[].status', description: '检查项状态：`ok` / `warn` / `error` / `skip`。', required: true },
        { name: 'checks[].summary', description: '面向人类的简短诊断结论。', required: true },
        { name: 'checks[].details[]', description: '可直接展示的补充细节。', required: true },
        { name: 'checks[].remediation[]', description: '结构化修复建议数组；既可给人看，也可给 Agent 解释修复意图。', required: true },
        { name: 'checks[].remediation[].type', description: '`note` 或 `command`；`command` 表示该修复建议本身就是一条可执行命令。', required: true },
        { name: 'checks[].remediation[].text', description: '修复建议的人类可读文案。', required: true },
        { name: 'checks[].remediation[].commandTemplate', description: '若该建议关联命令，则提供可直接展示/填参的命令模板。', required: false },
        { name: 'checks[].remediation[].commandKey', description: '若能匹配到 CLI 注册表，则给出稳定 command key。', required: false },
        { name: 'checks[].remediation[].intent', description: '建议命令的语义意图，如 `repair` / `verify` / `deploy` / `bind`。', required: false },
        { name: 'checks[].nextActions[]', description: '统一的结构化下一步数组；把 per-check 后续动作收敛成 Agent 更容易消费的主/备路径。', required: true },
        { name: 'checks[].nextActions[].title', description: '下一步动作的简短标题。', required: true },
        { name: 'checks[].nextActions[].description', description: '为什么要执行这一步。', required: true },
        { name: 'checks[].nextActions[].commandTemplate', description: '建议执行的命令模板。', required: true },
        { name: 'checks[].nextActions[].commandKey', description: '若能匹配到 CLI 注册表，则给出稳定 command key。', required: false },
        { name: 'checks[].nextActions[].phase', description: '动作阶段，如 `inspect` / `verify` / `mutate`。', required: true },
        { name: 'checks[].nextActions[].priority', description: '`primary` 为首选下一步，`secondary` 为补充路径。', required: true },
        { name: 'checks[].nextCommands[]', description: '结构化后续命令提示数组；通常按优先级给出下一步。', required: true },
        { name: 'checks[].nextCommands[].commandTemplate', description: '建议执行的命令模板。', required: true },
        { name: 'checks[].nextCommands[].commandKey', description: '若能匹配到 CLI 注册表，则给出稳定 command key。', required: false },
        { name: 'checks[].nextCommands[].intent', description: '命令的语义意图，如 `inspect` / `verify` / `repair` / `deploy`。', required: true },
        { name: 'checks[].nextCommands[].priority', description: '`primary` 为首选下一步，`secondary` 为补充路径。', required: true }
      ]
    },
    related: ['login', 'init', 'deploy check', 'deploy spec']
  }
});

interface DoctorOptions {
  component?: string;
  allComponents?: boolean;
  runtime?: string;
  entry?: string;
  dockerDaemon?: boolean;
  offline?: boolean;
}

export function registerDoctorCommands(cli: CAC) {
  registerCliCommand(cli, doctorCommand)
    .action(async (options: DoctorOptions) => {
      if (options.component && options.allComponents) {
        throw new Error('--component 与 --all-components 不能同时使用');
      }
      const report = await runLicellDoctor({
        component: options.component,
        allComponents: options.allComponents,
        runtime: options.runtime,
        entry: options.entry,
        checkDockerDaemon: options.dockerDaemon,
        offline: options.offline
      });

      if (isJsonOutput()) {
        emitCommandResult(report, { inferOutcome: false });
      } else {
        showIntro(pc.bgBlue(pc.white(' 🩺 Licell Doctor ')));
        process.stdout.write(`${renderLicellDoctorReport(report)}\n`);
        showOutro(
          report.healthy
            ? pc.green(`无阻塞项。warn=${report.warnCount} skip=${report.skipCount}`)
            : pc.red(`发现 ${report.errorCount} 个阻塞项。warn=${report.warnCount} skip=${report.skipCount}`)
        );
      }

      if (!report.healthy) {
        process.exitCode = 1;
      }
    });
}

export const doctorCommandModule = defineCommandModule({
  section: AUTOMATION_SECTION,
  register: registerDoctorCommands,
  commands: [doctorCommand]
});
