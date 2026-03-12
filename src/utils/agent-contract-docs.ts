import { buildAgentCommandCatalog } from './command-reference';
import {
  type ResolvedCommandResultDescriptor
} from './command-metadata';
import { getCliRecordContractDocument } from './cli-record-contract';
import { LICELL_HELP_KIND, LICELL_HELP_SCHEMA_VERSION } from './help';
import { LICELL_CLI_RECORD_KIND, LICELL_CLI_RECORD_SCHEMA_VERSION, LICELL_JSON_PREFIX } from './output';
import { renderStructuredResultLines } from './structured-result-render';

export function renderStructuredDescriptorMarkdown(result: ResolvedCommandResultDescriptor) {
  return renderStructuredResultLines(result, {
    separator: '：',
    optionalLabel: '（可选）'
  });
}

export function renderAgentContractMarkdown(options?: { headingLevel?: 2 | 3 | 4 }) {
  const headingLevel = options?.headingLevel || 2;
  const heading = `${'#'.repeat(headingLevel)} Schema Contracts`;
  const catalog = buildAgentCommandCatalog();
  const cliRecord = getCliRecordContractDocument();

  return [
    heading,
    '',
    `- 原始 CLI JSON 流会使用前缀 \`${LICELL_JSON_PREFIX}\` 输出逐行 JSON record；每条 record 当前都满足 \`${LICELL_CLI_RECORD_KIND}@${LICELL_CLI_RECORD_SCHEMA_VERSION}\`，再通过 \`type=event|result|error\` 区分记录类型。`,
    `- \`licell <command> --help --output json\`：读取 \`help.kind\` / \`help.schemaVersion\`；当前为 \`${LICELL_HELP_KIND}@${LICELL_HELP_SCHEMA_VERSION}\`。`,
    `- \`licell catalog --output json\`：读取 \`kind\` / \`schemaVersion\`；当前为 \`${catalog.kind}@${catalog.schemaVersion}\`。`,
    `- \`licell catalog --output json\` 还会显式声明 help schema 与 CLI record schema：\`${catalog.schemas.help.kind}@${catalog.schemas.help.schemaVersion}\` / \`${catalog.schemas.cliRecord.kind}@${catalog.schemas.cliRecord.schemaVersion}\`。`,
    '- Agent 优先读取 `nextActions[]` 作为稳定下一步入口；`recommendedFlow` / `decisionGuide` / `remediation[]` 作为补充语义层。',
    '- 命令自己的业务结果字段继续读取对应命令 help / catalog 里的 `result`；下面三组 contract 只描述公共 CLI record 包络。',
    '',
    `### CLI Event Record · ${cliRecord.kind}@${cliRecord.schemaVersion}`,
    '',
    ...renderStructuredDescriptorMarkdown(cliRecord.event),
    '',
    '### CLI Result Record Envelope',
    '',
    ...renderStructuredDescriptorMarkdown(cliRecord.result),
    '',
    '### CLI Error Record',
    '',
    ...renderStructuredDescriptorMarkdown(cliRecord.error),
    '',
    '- Agent 侧做强约束解析时，先匹配 `kind`，再检查 `schemaVersion`；未知更高版本应走兼容分支或降级为文本解析。'
  ].join('\n');
}
