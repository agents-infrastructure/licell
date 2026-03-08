import { syncGeneratedSection } from './generated-docs';
import {
  DOMAIN_APP_BIND_WORKFLOW_TAG,
  DOMAIN_APP_UNBIND_WORKFLOW_TAG,
  DOMAIN_STATIC_BIND_WORKFLOW_TAG,
  DOMAIN_STATIC_UNBIND_WORKFLOW_TAG,
  FC_API_DEPLOY_WORKFLOW_TAG,
  FC_API_PRECHECK_WORKFLOW_TAG,
  renderTaggedCuratedWorkflowNumberedList,
  renderTaggedCuratedWorkflowTable
} from './mcp-workflow-docs';

export type WorkflowDocRenderMode = 'table' | 'numbered-list';

export interface WorkflowDocSectionItem {
  tag: string;
  renderMode: WorkflowDocRenderMode;
  title?: string;
  intro?: string;
  includeSuggestedOrder?: boolean;
}

export interface WorkflowDocGeneratedSection {
  startMarker: string;
  endMarker: string;
  missingMarkersMessage: string;
  preamble?: string;
  items: WorkflowDocSectionItem[];
}

export const README_MCP_FC_API_WORKFLOW_START = '<!-- BEGIN GENERATED:README_MCP_FC_API_WORKFLOW -->';
export const README_MCP_FC_API_WORKFLOW_END = '<!-- END GENERATED:README_MCP_FC_API_WORKFLOW -->';
export const README_MCP_DOMAIN_WORKFLOWS_START = '<!-- BEGIN GENERATED:README_MCP_DOMAIN_WORKFLOWS -->';
export const README_MCP_DOMAIN_WORKFLOWS_END = '<!-- END GENERATED:README_MCP_DOMAIN_WORKFLOWS -->';

export const SCENARIO_AI_PRECHECK_WORKFLOW_START = '<!-- BEGIN GENERATED:SCENARIO_AI_PRECHECK_WORKFLOW -->';
export const SCENARIO_AI_PRECHECK_WORKFLOW_END = '<!-- END GENERATED:SCENARIO_AI_PRECHECK_WORKFLOW -->';
export const SCENARIO_DOMAIN_APP_BIND_WORKFLOW_START = '<!-- BEGIN GENERATED:SCENARIO_DOMAIN_APP_BIND_WORKFLOW -->';
export const SCENARIO_DOMAIN_APP_BIND_WORKFLOW_END = '<!-- END GENERATED:SCENARIO_DOMAIN_APP_BIND_WORKFLOW -->';
export const SCENARIO_DOMAIN_STATIC_BIND_WORKFLOW_START = '<!-- BEGIN GENERATED:SCENARIO_DOMAIN_STATIC_BIND_WORKFLOW -->';
export const SCENARIO_DOMAIN_STATIC_BIND_WORKFLOW_END = '<!-- END GENERATED:SCENARIO_DOMAIN_STATIC_BIND_WORKFLOW -->';
export const SCENARIO_DOMAIN_APP_UNBIND_WORKFLOW_START = '<!-- BEGIN GENERATED:SCENARIO_DOMAIN_APP_UNBIND_WORKFLOW -->';
export const SCENARIO_DOMAIN_APP_UNBIND_WORKFLOW_END = '<!-- END GENERATED:SCENARIO_DOMAIN_APP_UNBIND_WORKFLOW -->';
export const SCENARIO_DOMAIN_STATIC_UNBIND_WORKFLOW_START = '<!-- BEGIN GENERATED:SCENARIO_DOMAIN_STATIC_UNBIND_WORKFLOW -->';
export const SCENARIO_DOMAIN_STATIC_UNBIND_WORKFLOW_END = '<!-- END GENERATED:SCENARIO_DOMAIN_STATIC_UNBIND_WORKFLOW -->';

export const README_MCP_FC_API_WORKFLOW_SECTION: WorkflowDocGeneratedSection = {
  startMarker: README_MCP_FC_API_WORKFLOW_START,
  endMarker: README_MCP_FC_API_WORKFLOW_END,
  missingMarkersMessage: 'README MCP FC API workflow markers not found',
  items: [{
    tag: FC_API_DEPLOY_WORKFLOW_TAG,
    renderMode: 'table',
    intro: '`licell mcp` 已提供这组 FC API 部署工作流工具（由共享 MCP 注册表自动生成）：'
  }]
};

export const README_MCP_DOMAIN_WORKFLOWS_SECTION: WorkflowDocGeneratedSection = {
  startMarker: README_MCP_DOMAIN_WORKFLOWS_START,
  endMarker: README_MCP_DOMAIN_WORKFLOWS_END,
  missingMarkersMessage: 'README MCP domain workflow markers not found',
  preamble: '`licell mcp` 也提供共享的域名编排 workflow 工具：',
  items: [
    {
      tag: DOMAIN_APP_BIND_WORKFLOW_TAG,
      renderMode: 'table',
      title: '应用域名绑定',
      intro: '通过一个入口同时编排 DNS、FC custom domain 与可选 HTTPS。'
    },
    {
      tag: DOMAIN_STATIC_BIND_WORKFLOW_TAG,
      renderMode: 'table',
      title: '静态站点域名绑定',
      intro: '通过一个入口同时编排 CDN、DNS 与可选 HTTPS。'
    },
    {
      tag: DOMAIN_APP_UNBIND_WORKFLOW_TAG,
      renderMode: 'table',
      title: '应用域名解绑',
      intro: '通过一个入口下线应用域名，并清理 FC custom domain / DNS。'
    },
    {
      tag: DOMAIN_STATIC_UNBIND_WORKFLOW_TAG,
      renderMode: 'table',
      title: '静态站点域名解绑',
      intro: '通过一个入口下线静态站点域名，并清理 CDN / DNS。'
    }
  ]
};

export const SCENARIO_AI_PRECHECK_WORKFLOW_SECTION: WorkflowDocGeneratedSection = {
  startMarker: SCENARIO_AI_PRECHECK_WORKFLOW_START,
  endMarker: SCENARIO_AI_PRECHECK_WORKFLOW_END,
  missingMarkersMessage: 'Scenario AI precheck workflow markers not found',
  items: [{
    tag: FC_API_PRECHECK_WORKFLOW_TAG,
    renderMode: 'numbered-list'
  }]
};

export const SCENARIO_DOMAIN_APP_BIND_WORKFLOW_SECTION: WorkflowDocGeneratedSection = {
  startMarker: SCENARIO_DOMAIN_APP_BIND_WORKFLOW_START,
  endMarker: SCENARIO_DOMAIN_APP_BIND_WORKFLOW_END,
  missingMarkersMessage: 'Scenario domain app bind workflow markers not found',
  items: [{
    tag: DOMAIN_APP_BIND_WORKFLOW_TAG,
    renderMode: 'numbered-list',
    intro: '> 如果你是通过 Agent / MCP 执行这一步，推荐直接调用下面这条共享 workflow 入口：'
  }]
};

export const SCENARIO_DOMAIN_STATIC_BIND_WORKFLOW_SECTION: WorkflowDocGeneratedSection = {
  startMarker: SCENARIO_DOMAIN_STATIC_BIND_WORKFLOW_START,
  endMarker: SCENARIO_DOMAIN_STATIC_BIND_WORKFLOW_END,
  missingMarkersMessage: 'Scenario domain static bind workflow markers not found',
  items: [{
    tag: DOMAIN_STATIC_BIND_WORKFLOW_TAG,
    renderMode: 'numbered-list',
    intro: '> 如果你是通过 Agent / MCP 执行这一步，推荐直接调用下面这条共享 workflow 入口：'
  }]
};

export const SCENARIO_DOMAIN_APP_UNBIND_WORKFLOW_SECTION: WorkflowDocGeneratedSection = {
  startMarker: SCENARIO_DOMAIN_APP_UNBIND_WORKFLOW_START,
  endMarker: SCENARIO_DOMAIN_APP_UNBIND_WORKFLOW_END,
  missingMarkersMessage: 'Scenario domain app unbind workflow markers not found',
  items: [{
    tag: DOMAIN_APP_UNBIND_WORKFLOW_TAG,
    renderMode: 'numbered-list',
    intro: '> 需要下线 API 域名时，推荐走这条 cleanup workflow：'
  }]
};

export const SCENARIO_DOMAIN_STATIC_UNBIND_WORKFLOW_SECTION: WorkflowDocGeneratedSection = {
  startMarker: SCENARIO_DOMAIN_STATIC_UNBIND_WORKFLOW_START,
  endMarker: SCENARIO_DOMAIN_STATIC_UNBIND_WORKFLOW_END,
  missingMarkersMessage: 'Scenario domain static unbind workflow markers not found',
  items: [{
    tag: DOMAIN_STATIC_UNBIND_WORKFLOW_TAG,
    renderMode: 'numbered-list',
    intro: '> 需要下线静态站点域名时，推荐走这条 cleanup workflow：'
  }]
};

function renderWorkflowDocSectionItem(item: WorkflowDocSectionItem) {
  const parts: string[] = [];
  if (item.title) parts.push(`#### ${item.title}`, '');

  if (item.renderMode === 'table') {
    parts.push(renderTaggedCuratedWorkflowTable(item.tag, {
      intro: item.intro || '',
      includeSuggestedOrder: item.includeSuggestedOrder
    }).trim());
    return parts.join('\n').trim();
  }

  if (item.intro) parts.push(item.intro, '');
  parts.push(renderTaggedCuratedWorkflowNumberedList(item.tag).trim());
  return parts.join('\n').trim();
}

export function renderWorkflowDocGeneratedSection(section: WorkflowDocGeneratedSection) {
  const parts: string[] = [];
  if (section.preamble) parts.push(section.preamble);

  for (const item of section.items) {
    if (parts.length > 0) parts.push('');
    parts.push(renderWorkflowDocSectionItem(item));
  }

  return `${parts.join('\n').trim()}\n`;
}

export function syncWorkflowDocGeneratedSection(content: string, section: WorkflowDocGeneratedSection) {
  return syncGeneratedSection(content, {
    startMarker: section.startMarker,
    endMarker: section.endMarker,
    generatedContent: renderWorkflowDocGeneratedSection(section),
    missingMarkersMessage: section.missingMarkersMessage
  });
}
