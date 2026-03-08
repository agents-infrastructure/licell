import { buildAgentCommandCatalog } from '../utils/command-reference';
import { canExposeCommandAsGeneratedMcpTool, toGeneratedMcpToolName } from '../utils/command-surface-ids';
import {
  appendDerivedBindingsToArgv,
  deriveCommandToolShape,
  type CommandToolSchemaProperty,
  type DerivedOptionBinding,
  type DerivedPositionalBinding
} from './command-tool-derivation';
import {
  buildLicellMcpToolAnnotations,
  buildLicellMcpToolMetadataFromAgentCommand,
  renderLicellMcpToolDescription,
  resolveLicellMcpToolTitle,
  type LicellMcpToolMetadataEnvelope
} from './tool-metadata';

export interface GeneratedMcpCommandTool {
  name: string;
  title: string;
  description: string;
  inputSchema: {
    type: 'object';
    additionalProperties: false;
    properties: Record<string, CommandToolSchemaProperty>;
    required?: string[];
  };
  commandKey: string;
  annotations?: {
    destructiveHint?: boolean;
  };
  metadata?: LicellMcpToolMetadataEnvelope;
  positionalBindings: DerivedPositionalBinding[];
  optionBindings: DerivedOptionBinding[];
}

export function buildGeneratedMcpCommandTools() {
  const catalog = buildAgentCommandCatalog();
  const tools: Record<string, GeneratedMcpCommandTool> = {};

  for (const command of catalog.commands) {
    if (!canExposeCommandAsGeneratedMcpTool(command.rootCommand)) continue;

    const derived = deriveCommandToolShape(command, {
      includeExecutionProps: true,
      useArgumentHints: true
    });
    const metadata = buildLicellMcpToolMetadataFromAgentCommand(command, { toolKind: 'generated' });
    const annotations = buildLicellMcpToolAnnotations({ metadata });
    const description = renderLicellMcpToolDescription(metadata, {
      fallbackDescription: command.description,
      suffix: 'Auto-generated from the shared licell CLI registry.'
    });

    const tool: GeneratedMcpCommandTool = {
      name: toGeneratedMcpToolName(command.key),
      title: resolveLicellMcpToolTitle(metadata),
      description,
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: derived.properties,
        ...(derived.required.length > 0 ? { required: derived.required } : {})
      },
      commandKey: command.key,
      metadata,
      ...(annotations ? { annotations } : {}),
      positionalBindings: derived.positionalBindings,
      optionBindings: derived.optionBindings
    };

    tools[tool.name] = tool;
  }

  return tools;
}

export function buildArgvForGeneratedMcpCommandTool(tool: GeneratedMcpCommandTool, input: Record<string, unknown>) {
  const argv = tool.commandKey.split(' ');
  appendDerivedBindingsToArgv(tool, input, argv);
  return argv;
}
