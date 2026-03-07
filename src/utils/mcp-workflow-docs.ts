import { buildMcpToolCatalog, type McpToolCatalogEntry } from '../mcp/tool-catalog';

export const FC_API_DEPLOY_WORKFLOW_TAG = 'fc-api-deploy-workflow';
export const FC_API_PRECHECK_WORKFLOW_TAG = 'fc-api-precheck-workflow';

const DEFAULT_WORKFLOW_ORDER = ['deploy spec', 'deploy check', 'deploy'];

function escapeMarkdownCell(value: string) {
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.replace(/\|/g, '\\|') || '—';
}

function getOrderIndex(order: string[]) {
  return new Map(order.map((commandSignature, index) => [commandSignature, index]));
}

export function listTaggedCuratedWorkflowTools(tag: string, options?: { order?: string[] }) {
  const order = options?.order || DEFAULT_WORKFLOW_ORDER;
  const orderIndex = getOrderIndex(order);

  return buildMcpToolCatalog().tools
    .filter((tool) => tool.kind === 'curated' && tool.tags.includes(tag))
    .sort((left, right) => {
      const leftIndex = orderIndex.get(left.commandSignature || '') ?? Number.MAX_SAFE_INTEGER;
      const rightIndex = orderIndex.get(right.commandSignature || '') ?? Number.MAX_SAFE_INTEGER;
      if (leftIndex !== rightIndex) return leftIndex - rightIndex;
      return left.name.localeCompare(right.name);
    });
}

function getSummary(tool: McpToolCatalogEntry) {
  return tool.docsSummary || tool.description;
}

export function renderTaggedCuratedWorkflowTable(tag: string, options: {
  intro: string;
  order?: string[];
  includeSuggestedOrder?: boolean;
}) {
  const tools = listTaggedCuratedWorkflowTools(tag, { order: options.order });
  const rows = tools.map((tool) => `| \`${tool.name}\` | ${tool.commandSignature ? `\`licell ${tool.commandSignature}\`` : '—'} | ${escapeMarkdownCell(getSummary(tool))} |`);
  const parts = [
    options.intro,
    '',
    '| Tool | 对应 CLI | 用途 |',
    '|------|----------|------|',
    ...rows
  ];

  if (options.includeSuggestedOrder !== false) {
    const suggestedOrder = tools.length > 0 ? tools.map((tool) => `\`${tool.name}\``).join(' → ') : '—';
    parts.push('', `- 建议顺序：${suggestedOrder}`);
  }

  return `${parts.join('\n').trim()}\n`;
}

export function renderTaggedCuratedWorkflowNumberedList(tag: string, options?: { order?: string[] }) {
  const tools = listTaggedCuratedWorkflowTools(tag, { order: options?.order });
  return `${tools.map((tool, index) => `${index + 1}. \`${tool.name}\`：${getSummary(tool)}`).join('\n').trim()}\n`;
}
