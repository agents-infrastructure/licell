import type { CAC } from 'cac';
import pc from 'picocolors';
import { defineCliCommand, defineCommandModule, registerCliCommand } from './module';
import { AUTOMATION_SECTION } from './sections';
import { showIntro, showOutro } from '../utils/cli-shared';
import { emitCliResult, isJsonOutput } from '../utils/output';
import { renderLicellDoctorReport, runLicellDoctor } from '../utils/doctor';

const doctorCommand = defineCliCommand({
  rawName: 'doctor',
  description: '诊断本机 licell 登录态、项目配置与本地部署前置条件',
  options: [
    { rawName: '--runtime <runtime>', description: '覆盖项目 runtime 做 deploy 诊断（如 nodejs22 / python3.13 / docker）' },
    { rawName: '--entry <entry>', description: '覆盖 deploy 入口文件路径（默认按项目配置与 runtime 推断）' },
    { rawName: '--docker-daemon', description: '当 runtime=docker 时，附带检查本机 Docker daemon 是否可用' }
  ],
  descriptor: {
    title: 'Diagnose local licell readiness',
    summary: '诊断本机登录态、全局默认配置、当前目录项目配置，以及 FC API 的本地 deploy precheck。',
    notes: [
      '只做本地、低副作用诊断；不会创建或修改任何云端资源。',
      '当前目录不是 licell 项目时，项目相关检查会以 warn/skip 呈现。'
    ],
    examples: [
      'licell doctor',
      'licell doctor --runtime nodejs22 --entry src/index.ts',
      'licell doctor --runtime docker --docker-daemon --output json'
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
      '--entry': {
        whenToUse: '入口文件不走默认路径，或你希望排查某个候选入口时使用。',
        cautions: ['仅影响本次 doctor / deploy precheck，不会写回项目配置。']
      },
      '--docker-daemon': {
        whenToUse: 'runtime=docker 时，需要连同本机 Docker daemon 可用性一起诊断。',
        cautions: ['只在 docker runtime 下有实际效果。']
      }
    },
    recommendedFlow: [
      { title: '先跑本地总诊断', command: 'licell doctor --output json', reason: '先确定问题是在 auth、项目配置，还是 deploy 入口契约。' },
      { title: '查看 runtime 规格', command: 'licell deploy spec', reason: '如果问题落在 runtime/入口契约，先看规范而不是盲改。' },
      { title: '复跑专项 precheck', command: 'licell deploy check', reason: '修完后用 deploy check 单独验证入口与 runtime。' }
    ],
    automation: {
      preferredOutput: 'json',
      explicitInputs: ['--runtime', '--entry', '--docker-daemon'],
      notes: ['Agent / 脚本应优先使用 `--output json`，读取 `healthy`、统计字段与 `checks[]`。']
    },
    result: {
      summary: '返回本机诊断汇总、计数和逐项检查结果。',
      outcomeKey: 'healthy',
      fields: [
        { name: 'stage', description: '固定为 `doctor`。', required: true },
        { name: 'healthy', description: '是否不存在 error 级阻塞项。', required: true },
        { name: 'checkCount', description: '检查项总数。', required: true },
        { name: 'okCount', description: 'ok 检查项数量。', required: true },
        { name: 'warnCount', description: 'warn 检查项数量。', required: true },
        { name: 'errorCount', description: 'error 检查项数量。', required: true },
        { name: 'skipCount', description: 'skip 检查项数量。', required: true },
        { name: 'context', description: '当前 cwd、命中的配置文件路径，以及本次解析出的 runtime/entry。', required: true },
        { name: 'checks', description: '逐项诊断结果，含 status / summary / remediation / nextCommands。', required: true }
      ]
    },
    related: ['login', 'init', 'deploy check', 'deploy spec']
  }
});

interface DoctorOptions {
  runtime?: string;
  entry?: string;
  dockerDaemon?: boolean;
}

export function registerDoctorCommands(cli: CAC) {
  registerCliCommand(cli, doctorCommand)
    .action((options: DoctorOptions) => {
      const report = runLicellDoctor({
        runtime: options.runtime,
        entry: options.entry,
        checkDockerDaemon: options.dockerDaemon
      });

      if (isJsonOutput()) {
        emitCliResult({ ...report });
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
