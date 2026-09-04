import { buildAgentCommandCatalog } from './command-reference';
import {
  type ResolvedCommandResultDescriptor
} from './command-metadata';
import { getCliRecordContractDocument } from './cli-record-contract';
import { LICELL_HELP_KIND, LICELL_HELP_SCHEMA_VERSION } from './help';
import { LICELL_CLI_RECORD_KIND, LICELL_CLI_RECORD_SCHEMA_VERSION, LICELL_JSON_PREFIX } from './output';
import { renderStructuredResultLines } from './structured-result-render';

type ContractLocale = 'zh' | 'en';

export function renderStructuredDescriptorMarkdown(
  result: ResolvedCommandResultDescriptor,
  locale: ContractLocale = 'zh'
) {
  return renderStructuredResultLines(result, {
    separator: locale === 'en' ? ': ' : '：',
    optionalLabel: locale === 'en' ? ' (optional)' : '（可选）'
  });
}

export function renderAgentContractMarkdown(options?: { headingLevel?: 2 | 3 | 4; locale?: ContractLocale }) {
  const headingLevel = options?.headingLevel || 2;
  const locale = options?.locale || 'zh';
  const heading = `${'#'.repeat(headingLevel)} Schema Contracts`;
  const catalog = buildAgentCommandCatalog();
  const cliRecord = getCliRecordContractDocument(locale);

  if (locale === 'en') {
    return [
      heading,
      '',
      `- Raw CLI JSON output is emitted line-by-line with the \`${LICELL_JSON_PREFIX}\` prefix. Each record currently conforms to \`${LICELL_CLI_RECORD_KIND}@${LICELL_CLI_RECORD_SCHEMA_VERSION}\`, then branches by \`type=event|result|error\`.`,
      `- For \`licell <command> --help --output json\`, read \`help.kind\` and \`help.schemaVersion\`; the current contract is \`${LICELL_HELP_KIND}@${LICELL_HELP_SCHEMA_VERSION}\`.`,
      `- For \`licell catalog --output json\`, read \`kind\` and \`schemaVersion\`; the current catalog contract is \`${catalog.kind}@${catalog.schemaVersion}\`.`,
      `- \`licell catalog --output json\` also declares the help schema and CLI record schema explicitly: \`${catalog.schemas.help.kind}@${catalog.schemas.help.schemaVersion}\` / \`${catalog.schemas.cliRecord.kind}@${catalog.schemas.cliRecord.schemaVersion}\`.`,
      '- Read `catalog.agentWorkflow` for the curated-first natural-language routing contract. Only conclude a request is unsupported after curated command discovery and raw capability search both fail.',
      '- Agents should prefer `nextActions[]` as the stable next-step surface; `recommendedFlow`, `decisionGuide`, and `remediation[]` are supporting guidance layers.',
      '- For command-specific business payloads, keep reading the command help/catalog `result` descriptor; the three sections below only describe the shared CLI record envelope.',
      '',
      `### CLI Event Record · ${cliRecord.kind}@${cliRecord.schemaVersion}`,
      '',
      ...renderStructuredDescriptorMarkdown(cliRecord.event, locale),
      '',
      '### CLI Result Record Envelope',
      '',
      ...renderStructuredDescriptorMarkdown(cliRecord.result, locale),
      '',
      '### CLI Error Record',
      '',
      ...renderStructuredDescriptorMarkdown(cliRecord.error, locale),
      '',
      '- When parsing strictly, match `kind` first and then verify `schemaVersion`; if a higher unknown version appears, fall back to a compatibility path instead of assuming the old shape.'
    ].join('\n');
  }

  return [
    heading,
    '',
    `- 原始 CLI JSON 流会使用前缀 \`${LICELL_JSON_PREFIX}\` 输出逐行 JSON record；每条 record 当前都满足 \`${LICELL_CLI_RECORD_KIND}@${LICELL_CLI_RECORD_SCHEMA_VERSION}\`，再通过 \`type=event|result|error\` 区分记录类型。`,
    `- \`licell <command> --help --output json\`：读取 \`help.kind\` / \`help.schemaVersion\`；当前为 \`${LICELL_HELP_KIND}@${LICELL_HELP_SCHEMA_VERSION}\`。`,
    `- \`licell catalog --output json\`：读取 \`kind\` / \`schemaVersion\`；当前为 \`${catalog.kind}@${catalog.schemaVersion}\`。`,
    `- \`licell catalog --output json\` 还会显式声明 help schema 与 CLI record schema：\`${catalog.schemas.help.kind}@${catalog.schemas.help.schemaVersion}\` / \`${catalog.schemas.cliRecord.kind}@${catalog.schemas.cliRecord.schemaVersion}\`。`,
    '- 读取 `catalog.agentWorkflow` 获取“领域命令优先、raw capability 兜底”的自然语言路由契约；只有两层发现都失败，才可判定不支持。',
    '- Agent 优先读取 `nextActions[]` 作为稳定下一步入口；`recommendedFlow` / `decisionGuide` / `remediation[]` 作为补充语义层。',
    '- 命令自己的业务结果字段继续读取对应命令 help / catalog 里的 `result`；下面三组 contract 只描述公共 CLI record 包络。',
    '',
    `### CLI Event Record · ${cliRecord.kind}@${cliRecord.schemaVersion}`,
    '',
    ...renderStructuredDescriptorMarkdown(cliRecord.event, locale),
    '',
    '### CLI Result Record Envelope',
    '',
    ...renderStructuredDescriptorMarkdown(cliRecord.result, locale),
    '',
    '### CLI Error Record',
    '',
    ...renderStructuredDescriptorMarkdown(cliRecord.error, locale),
    '',
    '- Agent 侧做强约束解析时，先匹配 `kind`，再检查 `schemaVersion`；未知更高版本应走兼容分支或降级为文本解析。'
  ].join('\n');
}
