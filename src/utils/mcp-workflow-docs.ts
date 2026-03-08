import { buildMcpToolCatalog, type McpToolCatalogEntry } from '../mcp/tool-catalog';
import {
  DOMAIN_APP_BIND_WORKFLOW_TAG,
  DOMAIN_APP_UNBIND_WORKFLOW_TAG,
  DOMAIN_STATIC_BIND_WORKFLOW_TAG,
  DOMAIN_STATIC_UNBIND_WORKFLOW_TAG,
  FC_API_DEPLOY_WORKFLOW_TAG,
  FC_API_PRECHECK_WORKFLOW_TAG,
  getLicellWorkflowDescriptor,
  resolveLicellWorkflowSuggestedCommandOrder
} from '../mcp/workflow-descriptors';

export {
  DOMAIN_APP_BIND_WORKFLOW_TAG,
  DOMAIN_APP_UNBIND_WORKFLOW_TAG,
  DOMAIN_STATIC_BIND_WORKFLOW_TAG,
  DOMAIN_STATIC_UNBIND_WORKFLOW_TAG,
  FC_API_DEPLOY_WORKFLOW_TAG,
  FC_API_PRECHECK_WORKFLOW_TAG
} from '../mcp/workflow-descriptors';

function escapeMarkdownCell(value: string) {
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.replace(/\|/g, '\\|') || '—';
}

function getOrderIndex(order: string[]) {
  return new Map(order.map((commandSignature, index) => [commandSignature, index]));
}

export function listTaggedCuratedWorkflowTools(tag: string, options?: { order?: string[] }) {
  const order = options?.order || resolveLicellWorkflowSuggestedCommandOrder(tag);
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
  return tool.summary || tool.description;
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
    const descriptor = getLicellWorkflowDescriptor(tag);
    const suggestedOrder = tools.length > 0 ? tools.map((tool) => `\`${tool.name}\``).join(' → ') : '—';
    if (descriptor?.summary) parts.push('', `- Workflow：${descriptor.summary}`);
    parts.push('', `- 建议顺序：${suggestedOrder}`);
  }

  return `${parts.join('\n').trim()}\n`;
}

export function renderTaggedCuratedWorkflowNumberedList(tag: string, options?: { order?: string[] }) {
  const tools = listTaggedCuratedWorkflowTools(tag, { order: options?.order });
  return `${tools.map((tool, index) => `${index + 1}. \`${tool.name}\`：${getSummary(tool)}`).join('\n').trim()}\n`;
}
