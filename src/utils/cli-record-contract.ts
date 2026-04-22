import {
  buildCommandResultFieldTree,
  cloneResolvedCommandResultDescriptor,
  type ResolvedCommandResultDescriptor,
  type ResolvedCommandResultFieldDescriptor
} from './command-metadata';
import { LICELL_CLI_RECORD_KIND, LICELL_CLI_RECORD_SCHEMA_VERSION } from './output';

export interface CliRecordContractDocument {
  kind: typeof LICELL_CLI_RECORD_KIND;
  schemaVersion: typeof LICELL_CLI_RECORD_SCHEMA_VERSION;
  event: ResolvedCommandResultDescriptor;
  result: ResolvedCommandResultDescriptor;
  error: ResolvedCommandResultDescriptor;
}

type ContractLocale = 'zh' | 'en';

function defineRecordContract(
  summary: string,
  fields: ResolvedCommandResultFieldDescriptor[]
): ResolvedCommandResultDescriptor {
  return {
    summary,
    fields,
    fieldTree: buildCommandResultFieldTree(fields)
  };
}

const EVENT_FIELDS_ZH: ResolvedCommandResultFieldDescriptor[] = [
  { name: 'kind', description: '固定为 `licell-cli-record`。', required: true },
  { name: 'schemaVersion', description: 'CLI record schema 版本；当前为 `1.0`。', required: true },
  { name: 'type', description: '固定为 `event`。', required: true },
  { name: 'ts', description: '事件发出时间（ISO 8601）。', required: true },
  { name: 'command', description: '当前命令 key，例如 `deploy`、`oss upload`。', required: true },
  { name: 'stage', description: '稳定阶段标识，例如 `deploy`、`deploy.api`、`auth.restore`。', required: true },
  { name: 'action', description: '稳定动作标识，例如 `run`、`execute`、`stdout`。', required: true },
  { name: 'status', description: '`start` / `ok` / `failed` / `skipped` / `info`。', required: true },
  { name: 'source', description: '`command` / `console` / `stream`。', required: true },
  { name: 'terminal', description: '该事件是否代表当前动作进入终态。', required: true },
  { name: 'ok', description: '仅在终态成功/失败事件中出现；`true` 表示成功，`false` 表示失败。', required: false },
  { name: 'message', description: '面向人类的补充消息。', required: false },
  { name: 'data', description: '附加结构化上下文对象。', required: false },
  { name: 'data.stream', description: '当 `action=stdout|stderr` 时给出流类型。', required: false }
];

const EVENT_FIELDS_EN: ResolvedCommandResultFieldDescriptor[] = [
  { name: 'kind', description: 'Fixed to `licell-cli-record`.', required: true },
  { name: 'schemaVersion', description: 'CLI record schema version; currently `1.0`.', required: true },
  { name: 'type', description: 'Fixed to `event`.', required: true },
  { name: 'ts', description: 'Event timestamp in ISO 8601 format.', required: true },
  { name: 'command', description: 'Current command key, such as `deploy` or `oss upload`.', required: true },
  { name: 'stage', description: 'Stable stage identifier, such as `deploy`, `deploy.api`, or `auth.restore`.', required: true },
  { name: 'action', description: 'Stable action identifier, such as `run`, `execute`, or `stdout`.', required: true },
  { name: 'status', description: '`start` / `ok` / `failed` / `skipped` / `info`.', required: true },
  { name: 'source', description: '`command` / `console` / `stream`.', required: true },
  { name: 'terminal', description: 'Whether this event marks the terminal state of the current action.', required: true },
  { name: 'ok', description: 'Present only on terminal success/failure events; `true` means success and `false` means failure.', required: false },
  { name: 'message', description: 'Human-readable supplemental message.', required: false },
  { name: 'data', description: 'Additional structured context object.', required: false },
  { name: 'data.stream', description: 'Stream type when `action=stdout|stderr`.', required: false }
];

const RESULT_FIELDS_ZH: ResolvedCommandResultFieldDescriptor[] = [
  { name: 'kind', description: '固定为 `licell-cli-record`。', required: true },
  { name: 'schemaVersion', description: 'CLI record schema 版本；当前为 `1.0`。', required: true },
  { name: 'type', description: '固定为 `result`。', required: true },
  { name: 'ts', description: '结果发出时间（ISO 8601）。', required: true },
  { name: 'command', description: '当前命令 key。', required: true },
  { name: 'stage', description: '命令阶段标识；通常与命令 key 或子阶段一致。', required: true },
  { name: 'ok', description: '固定为 `true`。', required: true }
];

const RESULT_FIELDS_EN: ResolvedCommandResultFieldDescriptor[] = [
  { name: 'kind', description: 'Fixed to `licell-cli-record`.', required: true },
  { name: 'schemaVersion', description: 'CLI record schema version; currently `1.0`.', required: true },
  { name: 'type', description: 'Fixed to `result`.', required: true },
  { name: 'ts', description: 'Result timestamp in ISO 8601 format.', required: true },
  { name: 'command', description: 'Current command key.', required: true },
  { name: 'stage', description: 'Command stage identifier; usually aligned with the command key or sub-stage.', required: true },
  { name: 'ok', description: 'Fixed to `true`.', required: true }
];

const ERROR_FIELDS_ZH: ResolvedCommandResultFieldDescriptor[] = [
  { name: 'kind', description: '固定为 `licell-cli-record`。', required: true },
  { name: 'schemaVersion', description: 'CLI record schema 版本；当前为 `1.0`。', required: true },
  { name: 'type', description: '固定为 `error`。', required: true },
  { name: 'ts', description: '错误发出时间（ISO 8601）。', required: true },
  { name: 'command', description: '当前命令 key。', required: true },
  { name: 'stage', description: '错误阶段，例如 `parse`、`runtime`、`deploy`。', required: true },
  { name: 'ok', description: '固定为 `false`。', required: true },
  { name: 'error', description: '稳定错误对象。', required: true },
  { name: 'error.code', description: '稳定错误码，例如 `CLI_INVALID_INPUT`、`AUTH_MISSING_CREDENTIAL`。', required: true },
  { name: 'error.category', description: '`auth` / `permission` / `input` / `network` / `quota` / `conflict` / `not_found` / `internal`。', required: true },
  { name: 'error.message', description: '错误主消息。', required: true },
  { name: 'error.retryable', description: '该错误是否适合直接重试。', required: true },
  { name: 'provider', description: '阿里云 provider 侧上下文。', required: false },
  { name: 'provider.service', description: '云产品名，例如 `fc`、`oss`、`alidns`。', required: false },
  { name: 'provider.action', description: '云 API 动作名。', required: false },
  { name: 'provider.code', description: '云侧原始错误码。', required: false },
  { name: 'provider.requestId', description: '云侧 requestId。', required: false },
  { name: 'provider.httpStatus', description: '云侧 HTTP 状态码。', required: false },
  { name: 'provider.endpoint', description: '命中的云 API endpoint。', required: false },
  { name: 'details', description: '额外结构化错误上下文。', required: false },
  { name: 'remediation[]', description: '兼容层修复建议数组。', required: true },
  { name: 'remediation[].type', description: '建议类型，例如 `note` / `command`。', required: true },
  { name: 'remediation[].title', description: '修复建议标题。', required: true },
  { name: 'remediation[].reason', description: '为什么建议这样做。', required: true },
  { name: 'remediation[].commandTemplate', description: '建议命令模板。', required: true },
  { name: 'remediation[].commandKey', description: '若可匹配 CLI 注册表，则给出稳定 command key。', required: false },
  { name: 'remediation[].commandDescription', description: '匹配到的命令说明。', required: false },
  { name: 'remediation[].phase', description: '修复阶段，例如 `inspect` / `mutate` / `verify`。', required: true },
  { name: 'remediation[].priority', description: '`primary` / `secondary`。', required: true },
  { name: 'remediation[].order', description: '稳定排序值。', required: true },
  { name: 'nextCommands[]', description: '兼容层命令建议数组。', required: true },
  { name: 'nextCommands[].commandTemplate', description: '建议命令模板。', required: true },
  { name: 'nextCommands[].commandKey', description: '若可匹配 CLI 注册表，则给出稳定 command key。', required: false },
  { name: 'nextCommands[].description', description: '命令建议说明。', required: false },
  { name: 'nextCommands[].intent', description: '命令意图，例如 `inspect` / `repair` / `bind`。', required: true },
  { name: 'nextCommands[].priority', description: '`primary` / `secondary`。', required: true },
  { name: 'nextActions[]', description: '推荐优先消费的统一下一步数组。', required: true },
  { name: 'nextActions[].title', description: '下一步动作标题。', required: true },
  { name: 'nextActions[].description', description: '为什么建议执行这一步。', required: true },
  { name: 'nextActions[].commandTemplate', description: '建议命令模板。', required: true },
  { name: 'nextActions[].commandKey', description: '若可匹配 CLI 注册表，则给出稳定 command key。', required: false },
  { name: 'nextActions[].phase', description: '动作阶段，例如 `inspect` / `verify` / `mutate`。', required: true },
  { name: 'nextActions[].priority', description: '`primary` / `secondary`。', required: true },
  { name: 'nextActions[].source', description: '动作来源，例如 `error-remediation`。', required: true }
];

const ERROR_FIELDS_EN: ResolvedCommandResultFieldDescriptor[] = [
  { name: 'kind', description: 'Fixed to `licell-cli-record`.', required: true },
  { name: 'schemaVersion', description: 'CLI record schema version; currently `1.0`.', required: true },
  { name: 'type', description: 'Fixed to `error`.', required: true },
  { name: 'ts', description: 'Error timestamp in ISO 8601 format.', required: true },
  { name: 'command', description: 'Current command key.', required: true },
  { name: 'stage', description: 'Error stage, such as `parse`, `runtime`, or `deploy`.', required: true },
  { name: 'ok', description: 'Fixed to `false`.', required: true },
  { name: 'error', description: 'Stable error object.', required: true },
  { name: 'error.code', description: 'Stable error code, such as `CLI_INVALID_INPUT` or `AUTH_MISSING_CREDENTIAL`.', required: true },
  { name: 'error.category', description: '`auth` / `permission` / `input` / `network` / `quota` / `conflict` / `not_found` / `internal`.', required: true },
  { name: 'error.message', description: 'Primary error message.', required: true },
  { name: 'error.retryable', description: 'Whether the error is suitable for direct retry.', required: true },
  { name: 'provider', description: 'Alibaba Cloud provider-side context.', required: false },
  { name: 'provider.service', description: 'Cloud product name, such as `fc`, `oss`, or `alidns`.', required: false },
  { name: 'provider.action', description: 'Cloud API action name.', required: false },
  { name: 'provider.code', description: 'Original cloud-side error code.', required: false },
  { name: 'provider.requestId', description: 'Cloud-side requestId.', required: false },
  { name: 'provider.httpStatus', description: 'Cloud-side HTTP status code.', required: false },
  { name: 'provider.endpoint', description: 'Resolved cloud API endpoint.', required: false },
  { name: 'details', description: 'Additional structured error context.', required: false },
  { name: 'remediation[]', description: 'Compatibility remediation suggestions.', required: true },
  { name: 'remediation[].type', description: 'Suggestion type, such as `note` or `command`.', required: true },
  { name: 'remediation[].title', description: 'Remediation title.', required: true },
  { name: 'remediation[].reason', description: 'Why this action is recommended.', required: true },
  { name: 'remediation[].commandTemplate', description: 'Suggested command template.', required: true },
  { name: 'remediation[].commandKey', description: 'Stable command key when the command can be matched from the CLI registry.', required: false },
  { name: 'remediation[].commandDescription', description: 'Matched command description.', required: false },
  { name: 'remediation[].phase', description: 'Remediation phase, such as `inspect`, `mutate`, or `verify`.', required: true },
  { name: 'remediation[].priority', description: '`primary` / `secondary`.', required: true },
  { name: 'remediation[].order', description: 'Stable sort order.', required: true },
  { name: 'nextCommands[]', description: 'Compatibility command suggestions.', required: true },
  { name: 'nextCommands[].commandTemplate', description: 'Suggested command template.', required: true },
  { name: 'nextCommands[].commandKey', description: 'Stable command key when the command can be matched from the CLI registry.', required: false },
  { name: 'nextCommands[].description', description: 'Command suggestion description.', required: false },
  { name: 'nextCommands[].intent', description: 'Command intent, such as `inspect`, `repair`, or `bind`.', required: true },
  { name: 'nextCommands[].priority', description: '`primary` / `secondary`.', required: true },
  { name: 'nextActions[]', description: 'Preferred unified next-step suggestions.', required: true },
  { name: 'nextActions[].title', description: 'Next action title.', required: true },
  { name: 'nextActions[].description', description: 'Why this action is recommended.', required: true },
  { name: 'nextActions[].commandTemplate', description: 'Suggested command template.', required: true },
  { name: 'nextActions[].commandKey', description: 'Stable command key when the command can be matched from the CLI registry.', required: false },
  { name: 'nextActions[].phase', description: 'Action phase, such as `inspect`, `verify`, or `mutate`.', required: true },
  { name: 'nextActions[].priority', description: '`primary` / `secondary`.', required: true },
  { name: 'nextActions[].source', description: 'Action source, such as `error-remediation`.', required: true }
];

const CLI_RECORD_CONTRACTS: Record<ContractLocale, CliRecordContractDocument> = {
  zh: {
    kind: LICELL_CLI_RECORD_KIND,
    schemaVersion: LICELL_CLI_RECORD_SCHEMA_VERSION,
    event: defineRecordContract(
      'CLI 流式事件 record；适合驱动 Agent 的进度感知、日志桥接和阶段判断。',
      EVENT_FIELDS_ZH
    ),
    result: defineRecordContract(
      'CLI 成功结果 record；公共包络固定，命令自定义 payload 字段请继续读取对应命令 help/catalog 中的 `result`。',
      RESULT_FIELDS_ZH
    ),
    error: defineRecordContract(
      'CLI 错误结果 record；同时提供兼容层 remediation/nextCommands 和首选的 nextActions。',
      ERROR_FIELDS_ZH
    )
  },
  en: {
    kind: LICELL_CLI_RECORD_KIND,
    schemaVersion: LICELL_CLI_RECORD_SCHEMA_VERSION,
    event: defineRecordContract(
      'Streaming CLI event record for progress tracking, log bridging, and stage-aware automation.',
      EVENT_FIELDS_EN
    ),
    result: defineRecordContract(
      'Successful CLI result envelope; command-specific payload fields should still be read from the corresponding help/catalog `result` descriptor.',
      RESULT_FIELDS_EN
    ),
    error: defineRecordContract(
      'CLI error envelope with compatibility remediation/nextCommands plus the preferred `nextActions` surface.',
      ERROR_FIELDS_EN
    )
  }
};

export function getCliRecordContractDocument(locale: ContractLocale = 'zh'): CliRecordContractDocument {
  return {
    kind: CLI_RECORD_CONTRACTS[locale].kind,
    schemaVersion: CLI_RECORD_CONTRACTS[locale].schemaVersion,
    event: cloneResolvedCommandResultDescriptor(CLI_RECORD_CONTRACTS[locale].event)!,
    result: cloneResolvedCommandResultDescriptor(CLI_RECORD_CONTRACTS[locale].result)!,
    error: cloneResolvedCommandResultDescriptor(CLI_RECORD_CONTRACTS[locale].error)!
  };
}
