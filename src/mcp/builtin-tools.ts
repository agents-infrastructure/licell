import { buildAgentCommandCatalog, filterAgentCommandCatalog } from '../utils/command-reference';
import { getBuiltinUpgradeSafetyHint } from '../utils/install-upgrade-docs';
import {
  buildLicellMcpToolAnnotations,
  buildLicellMcpToolMetadata,
  renderLicellMcpToolDescription,
  resolveLicellMcpToolTitle,
  type LicellMcpToolMetadataEnvelope
} from './tool-metadata';
import { toOptionalString } from './tool-arg-utils';

export type BuiltinMcpToolExecution =
  | { kind: 'argv'; argv: string[] }
  | { kind: 'data'; structuredContent: unknown; text: string };

export interface BuiltinMcpTool {
  name: string;
  title: string;
  description: string;
  inputSchema: {
    type: 'object';
    additionalProperties: false;
    properties: Record<string, Record<string, unknown>>;
    required?: string[];
  };
  annotations?: {
    openWorldHint?: boolean;
    destructiveHint?: boolean;
  };
  metadata?: LicellMcpToolMetadataEnvelope;
  execute(toolArgs: Record<string, unknown>): BuiltinMcpToolExecution;
}

const LICELL_CLI_TITLE = 'Deploy & manage Aliyun services (licell)';
const LICELL_CLI_DESCRIPTION = 'Use licell CLI to deploy API/static services to Alibaba Cloud and manage related resources (FC, custom domains, SSL, DNS, CDN, logs, etc.). Returns stdout/stderr.';
const LICELL_COMMAND_CATALOG_TITLE = 'Get shared licell command catalog';
const LICELL_COMMAND_CATALOG_DESCRIPTION = 'Return the shared licell command catalog used by Skills, shell completion, and MCP discovery. Useful when the agent wants up-to-date command/option metadata without hardcoded docs.';

const LICELL_CLI_METADATA = buildLicellMcpToolMetadata({
  toolKind: 'builtin',
  preferredOutput: 'json',
  supportsStructuredOutput: true,
  openWorld: true,
  title: LICELL_CLI_TITLE,
  summary: LICELL_CLI_DESCRIPTION,
  description: LICELL_CLI_DESCRIPTION,
  tags: ['cli', 'open-world'],
  taskHints: [
    {
      phase: 'inspect',
      title: '先确认要执行的命令',
      description: '不确定具体 CLI 调用时，先用 licell_command_catalog 获取当前共享命令目录。',
      commands: ['licell_command_catalog']
    },
    {
      phase: 'mutate',
      title: '执行原始 licell 调用',
      description: '把 argv 作为原始 licell 参数透传；MCP server 默认会补 --output json。',
      commands: ['licell_cli']
    },
    {
      phase: 'verify',
      title: '优先读取结构化 records',
      description: '先读取 structuredContent.records，再根据需要回看 stdout / stderr。',
      commands: []
    }
  ]
});

const LICELL_COMMAND_CATALOG_METADATA = buildLicellMcpToolMetadata({
  toolKind: 'builtin',
  preferredOutput: 'json',
  supportsStructuredOutput: true,
  title: LICELL_COMMAND_CATALOG_TITLE,
  summary: LICELL_COMMAND_CATALOG_DESCRIPTION,
  description: LICELL_COMMAND_CATALOG_DESCRIPTION,
  tags: ['catalog', 'discovery'],
  taskHints: [
    {
      phase: 'inspect',
      title: '查看当前可用命令目录',
      description: '按 rootCommand / commandKey 过滤共享命令目录，拿到最新命令、选项与决策信息。',
      commands: ['licell_command_catalog']
    }
  ]
});

const BUILTIN_MCP_TOOLS = {
  licell_cli: {
    name: 'licell_cli',
    title: resolveLicellMcpToolTitle(LICELL_CLI_METADATA),
    description: renderLicellMcpToolDescription(LICELL_CLI_METADATA, {
      fallbackDescription: LICELL_CLI_DESCRIPTION,
      extraHints: [getBuiltinUpgradeSafetyHint()]
    }),
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        argv: {
          type: 'array',
          items: { type: 'string' },
          minItems: 1,
          description: 'licell arguments, e.g. ["deploy","--type","static","--dist","dist"]'
        },
        cwd: {
          type: 'string',
          description: 'Working directory relative to projectRoot (default: projectRoot)'
        },
        timeoutMs: {
          type: 'number',
          description: 'Command timeout in milliseconds (default: 600000, max: 1800000)'
        }
      },
      required: ['argv']
    },
    annotations: buildLicellMcpToolAnnotations({
      metadata: LICELL_CLI_METADATA,
      fallback: { openWorldHint: true, destructiveHint: true }
    }),
    metadata: LICELL_CLI_METADATA,
    execute(toolArgs) {
      const argvRaw = toolArgs.argv;
      if (!Array.isArray(argvRaw) || argvRaw.length === 0 || argvRaw.some((value) => typeof value !== 'string' || value.trim() === '')) {
        throw new Error('Invalid arguments: argv must be a non-empty string[]');
      }
      return {
        kind: 'argv',
        argv: argvRaw.map((value) => value.trim())
      };
    }
  },

  licell_command_catalog: {
    name: 'licell_command_catalog',
    title: resolveLicellMcpToolTitle(LICELL_COMMAND_CATALOG_METADATA),
    description: renderLicellMcpToolDescription(LICELL_COMMAND_CATALOG_METADATA, {
      fallbackDescription: LICELL_COMMAND_CATALOG_DESCRIPTION
    }),
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        rootCommand: { type: 'string', description: 'Optional root command filter, e.g. deploy/release/db.' },
        commandKey: { type: 'string', description: 'Optional exact command key filter, e.g. "deploy check".' }
      }
    },
    metadata: LICELL_COMMAND_CATALOG_METADATA,
    execute(toolArgs) {
      const rootCommand = toOptionalString(toolArgs.rootCommand);
      const commandKey = toOptionalString(toolArgs.commandKey);
      const catalog = filterAgentCommandCatalog(buildAgentCommandCatalog(), { rootCommand, commandKey });
      const scopeLabel = commandKey
        ? `command=${commandKey}`
        : (rootCommand ? `root=${rootCommand}` : 'all commands');
      return {
        kind: 'data',
        structuredContent: catalog,
        text: [
          `licell command catalog (${scopeLabel})`,
          `schema=${catalog.kind}@${catalog.schemaVersion}`,
          `help=${catalog.schemas.help.kind}@${catalog.schemas.help.schemaVersion}`,
          `commands=${catalog.commands.length}, sections=${catalog.sections.length}`
        ].join('\n')
      };
    }
  }
} satisfies Record<string, BuiltinMcpTool>;

export function getBuiltinMcpTools(): Record<string, BuiltinMcpTool> {
  return BUILTIN_MCP_TOOLS;
}
