import { buildAgentCommandCatalog } from '../utils/command-reference';
import { getBuiltinMcpTools } from './builtin-tools';
import { getCuratedMcpCommandTools } from './curated-command-tools';
import { buildGeneratedMcpCommandTools } from './generated-command-tools';
import {
  cloneLicellMcpToolMetadataEnvelope,
  resolveLicellMcpToolSummary,
  resolveLicellMcpToolTitle,
  type LicellMcpToolMetadataEnvelope
} from './tool-metadata';

export type McpToolKind = 'builtin' | 'curated' | 'generated';

export interface McpToolCatalogEntry {
  kind: McpToolKind;
  name: string;
  title: string;
  summary?: string;
  description: string;
  inputNames: string[];
  requiredInputNames: string[];
  destructive: boolean;
  openWorld: boolean;
  tags: string[];
  metadata?: LicellMcpToolMetadataEnvelope;
  commandKey?: string;
  commandSignature?: string;
  rootCommand?: string;
  sectionId?: string;
  sectionTitle?: string;
}

export interface McpToolCatalogSection {
  id: string;
  title: string;
  summary?: string;
  tools: McpToolCatalogEntry[];
}

export interface McpToolCatalogDocument {
  source: 'licell-mcp-tool-registry';
  tools: McpToolCatalogEntry[];
  sections: McpToolCatalogSection[];
}

function sortTools(tools: McpToolCatalogEntry[]) {
  return [...tools].sort((left, right) => left.name.localeCompare(right.name));
}

export function buildMcpToolCatalog(): McpToolCatalogDocument {
  const agentCatalog = buildAgentCommandCatalog();
  const commandByKey = new Map(agentCatalog.commands.map((command) => [command.key, command]));

  const builtinTools = Object.values(getBuiltinMcpTools()).map<McpToolCatalogEntry>((tool) => {
    const metadata = cloneLicellMcpToolMetadataEnvelope(tool.metadata);
    return {
      kind: 'builtin',
      name: tool.name,
      title: resolveLicellMcpToolTitle(metadata, tool.title),
      summary: resolveLicellMcpToolSummary(metadata, tool.description),
      description: tool.description,
      inputNames: Object.keys(tool.inputSchema.properties),
      requiredInputNames: [...(tool.inputSchema.required || [])],
      destructive: Boolean(tool.annotations?.destructiveHint),
      openWorld: Boolean(tool.annotations?.openWorldHint),
      tags: [],
      metadata
    };
  });

  const curatedTools = Object.values(getCuratedMcpCommandTools()).map<McpToolCatalogEntry>((tool) => {
    const command = tool.commandSignature ? commandByKey.get(tool.commandSignature) : undefined;
    const metadata = cloneLicellMcpToolMetadataEnvelope(tool.metadata);
    return {
      kind: 'curated',
      name: tool.name,
      title: resolveLicellMcpToolTitle(metadata, tool.title),
      summary: resolveLicellMcpToolSummary(metadata, tool.description),
      description: tool.description,
      inputNames: Object.keys(tool.inputSchema.properties),
      requiredInputNames: [...(tool.inputSchema.required || [])],
      destructive: Boolean(tool.annotations?.destructiveHint),
      openWorld: false,
      tags: [...(tool.tags || [])],
      metadata,
      commandKey: command?.key,
      commandSignature: tool.commandSignature,
      rootCommand: tool.rootCommand || command?.rootCommand,
      sectionId: command?.sectionId,
      sectionTitle: command?.sectionTitle
    };
  });

  const generatedTools = Object.values(buildGeneratedMcpCommandTools()).map<McpToolCatalogEntry>((tool) => {
    const command = commandByKey.get(tool.commandKey);
    const metadata = cloneLicellMcpToolMetadataEnvelope(tool.metadata);
    return {
      kind: 'generated',
      name: tool.name,
      title: resolveLicellMcpToolTitle(metadata, tool.title),
      summary: resolveLicellMcpToolSummary(metadata, command?.summary || command?.description || tool.description),
      description: tool.description,
      inputNames: Object.keys(tool.inputSchema.properties),
      requiredInputNames: [...(tool.inputSchema.required || [])],
      destructive: Boolean(tool.annotations?.destructiveHint),
      openWorld: false,
      tags: [],
      metadata,
      commandKey: tool.commandKey,
      commandSignature: tool.commandKey,
      rootCommand: command?.rootCommand,
      sectionId: command?.sectionId,
      sectionTitle: command?.sectionTitle
    };
  });

  const tools = sortTools([...builtinTools, ...curatedTools, ...generatedTools]);

  const sections: McpToolCatalogSection[] = [
    {
      id: 'builtin',
      title: 'Builtin MCP Tools',
      summary: 'licell MCP server 内建的通用工具。',
      tools: sortTools(builtinTools)
    },
    {
      id: 'curated',
      title: 'Curated MCP Tools',
      summary: '针对常见工作流手工打磨的高语义工具。',
      tools: sortTools(curatedTools)
    },
    ...agentCatalog.sections
      .map((section) => ({
        id: `generated:${section.id}`,
        title: `Generated MCP Tools · ${section.title}`,
        summary: `由 CLI 注册表自动派生的 ${section.title} 命令工具。`,
        tools: sortTools(generatedTools.filter((tool) => tool.sectionId === section.id))
      }))
      .filter((section) => section.tools.length > 0)
  ];

  return {
    source: 'licell-mcp-tool-registry',
    tools,
    sections
  };
}
