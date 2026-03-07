import { buildAgentCommandCatalog, filterAgentCommandCatalog } from '../utils/command-reference';
import { getBuiltinUpgradeSafetyHint } from '../utils/install-upgrade-docs';
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
  execute(toolArgs: Record<string, unknown>): BuiltinMcpToolExecution;
}

const BUILTIN_MCP_TOOLS = {
  licell_cli: {
    name: 'licell_cli',
    title: 'Deploy & manage Aliyun services (licell)',
    description:
      `Use licell CLI to deploy API/static services to Alibaba Cloud and manage related resources (FC, custom domains, SSL, DNS, CDN, logs, etc.). Returns stdout/stderr. ${getBuiltinUpgradeSafetyHint()}`,
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
    annotations: {
      openWorldHint: true,
      destructiveHint: true
    },
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
    title: 'Get shared licell command catalog',
    description:
      'Return the shared licell command catalog used by Skills, shell completion, and MCP discovery. Useful when the agent wants up-to-date command/option metadata without hardcoded docs.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        rootCommand: { type: 'string', description: 'Optional root command filter, e.g. deploy/release/db.' },
        commandKey: { type: 'string', description: 'Optional exact command key filter, e.g. "deploy check".' }
      }
    },
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
        text: `licell command catalog (${scopeLabel})\ncommands=${catalog.commands.length}, sections=${catalog.sections.length}`
      };
    }
  }
} satisfies Record<string, BuiltinMcpTool>;

export function getBuiltinMcpTools(): Record<string, BuiltinMcpTool> {
  return BUILTIN_MCP_TOOLS;
}
