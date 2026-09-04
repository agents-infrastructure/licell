import type { CAC } from 'cac';
import { defineCliCommand, defineCommandModule, registerCliCommand } from './module';
import { AUTOMATION_SECTION } from './sections';
import { emitCommandResult, isJsonOutput } from '../utils/output';
import { buildAgentCommandCatalog, filterAgentCommandCatalog } from '../utils/command-reference';

interface CatalogOptions {
  rootCommand?: string;
  commandKey?: string;
}

const catalogCommand = defineCliCommand({
  rawName: 'catalog',
  regionExclusion: 'local',
  description: '输出共享 CLI 命令目录，供 Agent / 自动化发现命令、选项和结构化契约',
  options: [
    { rawName: '--root-command <root>', description: '按 root command 过滤（如 deploy / oss / domain）' },
    { rawName: '--command-key <key>', description: '按稳定 command key 精确过滤（如 deploy check）' }
  ],
  descriptor: {
    title: 'Return the shared licell CLI command catalog',
    summary: '返回 licell 共享命令目录；供 Skills、Agent 和自动化脚本发现命令、选项、help schema 与 CLI record contract。',
    notes: [
      '优先用 `licell catalog --output json` 做命令发现；再用 `licell <command> --help --output json` 读取单命令细节。',
      '若 catalog 没有覆盖目标阿里云能力，继续用 `licell capability products/search/describe` 发现 protocol 能力，并按 `execution` 选择领域命令或 raw API fallback。',
      '输出里显式包含 `help` schema 和 CLI `event/result/error` record contract。'
    ],
    examples: [
      'licell catalog --output json',
      'licell catalog --root-command deploy --output json',
      'licell catalog --command-key "deploy check" --output json'
    ],
    automation: {
      preferredOutput: 'json',
      explicitInputs: ['--root-command', '--command-key'],
      notes: ['自动化场景应始终追加 `--output json`，并优先消费 `agentWorkflow`、`commands[]`、`schemas`、`cliRecords`。']
    },
    optionInsights: {
      '--root-command': {
        whenToUse: '只关心某个命令族，例如 `deploy`、`oss`、`domain` 时使用。',
        cautions: ['会保留该 root 下的所有命令与对应 section 元数据。']
      },
      '--command-key': {
        whenToUse: '只想拿一条稳定命令定义，例如 `deploy check` 或 `domain app bind` 时使用。',
        cautions: ['这是精确匹配；请使用稳定 command key，而不是带参数的完整 shell 命令。']
      }
    },
    recommendedFlow: [
      { title: '先发现命令目录', command: 'licell catalog --output json', reason: '拿到稳定 command key、section、schema 与 CLI record contract。' },
      { title: '读取单命令 help', command: 'licell deploy --help --output json', reason: '按 command key 继续获取参数、结果和推荐流程。' },
      { title: '执行目标命令', command: 'licell deploy --output json', reason: '真正运行命令时统一消费 JSON records。' }
    ],
    taskHints: [
      {
        phase: 'inspect',
        title: '给 Agent 做命令发现',
        description: '先过滤 root 或 command key，再决定下一条 help / execute 命令。',
        commands: ['licell catalog --output json']
      },
      {
        phase: 'inspect',
        title: '探索未封装的阿里云能力',
        description: '领域命令未覆盖时，从产品定位到 operation，再遵循 describe.execution 执行。',
        commands: ['licell capability products <service> --output json', 'licell capability search --product <code> --intent <intent> --output json']
      }
    ],
    result: {
      summary: '返回共享命令目录、help schema 与 CLI record contract。',
      fields: [
        { name: 'stage', description: '固定为 `catalog`。', required: true },
        { name: 'source', description: '固定为 `licell-cli-registry`。', required: true },
        { name: 'kind', description: '目录文档 kind；当前为 `licell-agent-command-catalog`。', required: true },
        { name: 'schemaVersion', description: '目录文档 schema 版本；当前为 `1.0`。', required: true },
        { name: 'schemas.help.kind', description: 'help 文档 kind。', required: true },
        { name: 'schemas.help.schemaVersion', description: 'help 文档 schema 版本。', required: true },
        { name: 'schemas.cliRecord.kind', description: 'CLI record kind。', required: true },
        { name: 'schemas.cliRecord.schemaVersion', description: 'CLI record schema 版本。', required: true },
        { name: 'agentWorkflow', description: '自然语言意图的 curated-first 路由、raw API fallback 与安全执行契约。', required: true },
        { name: 'sections[]', description: '命令分组目录。', required: true },
        { name: 'commands[]', description: '命令明细数组。', required: true },
        { name: 'cliRecords.event', description: '稳定 event record 字段清单。', required: true },
        { name: 'cliRecords.result', description: '稳定 result record 公共包络字段清单。', required: true },
        { name: 'cliRecords.error', description: '稳定 error record 字段清单。', required: true }
      ]
    },
    agentTips: [
      'Agent 应先读 `commands[].key` / `commands[].options[]` / `commands[].nextActions[]`，不要硬编码 README 文案。',
      '用户意图没有对应领域命令时，不要停止在 catalog；继续执行 capability products/search/describe。',
      '命令执行阶段统一过滤 `@@LICELL_JSON@@` 前缀，再按 `type=event|result|error` 消费。'
    ]
  }
});

function renderCatalogText(catalog: ReturnType<typeof buildAgentCommandCatalog>) {
  const lines: string[] = [
    `kind:           ${catalog.kind}@${catalog.schemaVersion}`,
    `help schema:    ${catalog.schemas.help.kind}@${catalog.schemas.help.schemaVersion}`,
    `cli record:     ${catalog.schemas.cliRecord.kind}@${catalog.schemas.cliRecord.schemaVersion}`,
    `agent workflow: ${catalog.agentWorkflow.policy}`,
    `sections:       ${catalog.sections.length}`,
    `commands:       ${catalog.commands.length}`
  ];

  if (catalog.rootCommands.length > 0) {
    lines.push(`roots:          ${catalog.rootCommands.join(', ')}`);
  }

  if (catalog.sections.length > 0) {
    lines.push('', 'sections:');
    for (const section of catalog.sections) {
      lines.push(`- ${section.title} (${section.commandKeys.length})`);
    }
  }

  if (catalog.commands.length > 0) {
    lines.push('', 'sample commands:');
    for (const command of catalog.commands.slice(0, 8)) {
      lines.push(`- ${command.invocation}`);
    }
    if (catalog.commands.length > 8) {
      lines.push(`- … ${catalog.commands.length - 8} more`);
    }
  }

  lines.push(
    '',
    'next:',
    '- licell <command> --help --output json',
    '- licell capability products <service> --output json  # when no curated command matches',
    '- follow execution.preferred and nextActions[]'
  );
  return `${lines.join('\n')}\n`;
}

export function registerCatalogCommands(cli: CAC) {
  registerCliCommand(cli, catalogCommand)
    .action((options: CatalogOptions) => {
      const filtered = filterAgentCommandCatalog(buildAgentCommandCatalog(), {
        rootCommand: options.rootCommand,
        commandKey: options.commandKey
      });

      if (isJsonOutput()) {
        emitCommandResult(filtered, { stage: 'catalog', inferOutcome: false });
        return;
      }

      process.stdout.write(renderCatalogText(filtered));
    });
}

export const catalogCommandModule = defineCommandModule({
  section: AUTOMATION_SECTION,
  register: registerCatalogCommands,
  commands: [catalogCommand]
});
