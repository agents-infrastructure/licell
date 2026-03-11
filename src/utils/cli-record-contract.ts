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

const EVENT_FIELDS: ResolvedCommandResultFieldDescriptor[] = [
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

const RESULT_FIELDS: ResolvedCommandResultFieldDescriptor[] = [
  { name: 'kind', description: '固定为 `licell-cli-record`。', required: true },
  { name: 'schemaVersion', description: 'CLI record schema 版本；当前为 `1.0`。', required: true },
  { name: 'type', description: '固定为 `result`。', required: true },
  { name: 'ts', description: '结果发出时间（ISO 8601）。', required: true },
  { name: 'command', description: '当前命令 key。', required: true },
  { name: 'stage', description: '命令阶段标识；通常与命令 key 或子阶段一致。', required: true },
  { name: 'ok', description: '固定为 `true`。', required: true }
];

const ERROR_FIELDS: ResolvedCommandResultFieldDescriptor[] = [
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

const CLI_RECORD_CONTRACTS: CliRecordContractDocument = {
  kind: LICELL_CLI_RECORD_KIND,
  schemaVersion: LICELL_CLI_RECORD_SCHEMA_VERSION,
  event: defineRecordContract(
    'CLI 流式事件 record；适合驱动 Agent 的进度感知、日志桥接和阶段判断。',
    EVENT_FIELDS
  ),
  result: defineRecordContract(
    'CLI 成功结果 record；公共包络固定，命令自定义 payload 字段请继续读取对应命令 help/catalog 中的 `result`。',
    RESULT_FIELDS
  ),
  error: defineRecordContract(
    'CLI 错误结果 record；同时提供兼容层 remediation/nextCommands 和首选的 nextActions。',
    ERROR_FIELDS
  )
};

export function getCliRecordContractDocument(): CliRecordContractDocument {
  return {
    kind: CLI_RECORD_CONTRACTS.kind,
    schemaVersion: CLI_RECORD_CONTRACTS.schemaVersion,
    event: cloneResolvedCommandResultDescriptor(CLI_RECORD_CONTRACTS.event)!,
    result: cloneResolvedCommandResultDescriptor(CLI_RECORD_CONTRACTS.result)!,
    error: cloneResolvedCommandResultDescriptor(CLI_RECORD_CONTRACTS.error)!
  };
}
