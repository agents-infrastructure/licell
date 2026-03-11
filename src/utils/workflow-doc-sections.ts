import { syncGeneratedSection } from './generated-docs';

export type WorkflowDocRenderMode = 'table' | 'numbered-list';

export interface WorkflowDocEntry {
  command: string;
  description: string;
}

export interface WorkflowDocSectionItem {
  renderMode: WorkflowDocRenderMode;
  title?: string;
  intro?: string;
  entries: WorkflowDocEntry[];
}

export interface WorkflowDocGeneratedSection {
  startMarker: string;
  endMarker: string;
  missingMarkersMessage: string;
  preamble?: string;
  items: WorkflowDocSectionItem[];
}

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

export const SCENARIO_AI_PRECHECK_WORKFLOW_SECTION: WorkflowDocGeneratedSection = {
  startMarker: SCENARIO_AI_PRECHECK_WORKFLOW_START,
  endMarker: SCENARIO_AI_PRECHECK_WORKFLOW_END,
  missingMarkersMessage: 'Scenario AI precheck workflow markers not found',
  items: [{
    renderMode: 'numbered-list',
    entries: [
      { command: 'licell deploy spec <runtime>', description: '先读 runtime 的 entry / handler / 资源约束。' },
      { command: 'licell deploy check --runtime <runtime> --entry <entry>', description: '只读预检当前项目，提前发现入口与 runtime 问题。' }
    ]
  }]
};

export const SCENARIO_DOMAIN_APP_BIND_WORKFLOW_SECTION: WorkflowDocGeneratedSection = {
  startMarker: SCENARIO_DOMAIN_APP_BIND_WORKFLOW_START,
  endMarker: SCENARIO_DOMAIN_APP_BIND_WORKFLOW_END,
  missingMarkersMessage: 'Scenario domain app bind workflow markers not found',
  items: [{
    renderMode: 'numbered-list',
    intro: '> 如果你是通过 Agent 执行这一步，推荐直接运行下面这条 CLI：',
    entries: [{ command: 'licell domain app bind <domain> --ssl', description: '为当前应用绑定自定义域名，编排 DNS、FC custom domain 与可选 HTTPS。' }]
  }]
};

export const SCENARIO_DOMAIN_STATIC_BIND_WORKFLOW_SECTION: WorkflowDocGeneratedSection = {
  startMarker: SCENARIO_DOMAIN_STATIC_BIND_WORKFLOW_START,
  endMarker: SCENARIO_DOMAIN_STATIC_BIND_WORKFLOW_END,
  missingMarkersMessage: 'Scenario domain static bind workflow markers not found',
  items: [{
    renderMode: 'numbered-list',
    intro: '> 如果你是通过 Agent 执行这一步，推荐直接运行下面这条 CLI：',
    entries: [{ command: 'licell domain static bind <domain> --ssl', description: '为静态站点绑定自定义域名，编排 CDN、DNS 与可选 HTTPS。' }]
  }]
};

export const SCENARIO_DOMAIN_APP_UNBIND_WORKFLOW_SECTION: WorkflowDocGeneratedSection = {
  startMarker: SCENARIO_DOMAIN_APP_UNBIND_WORKFLOW_START,
  endMarker: SCENARIO_DOMAIN_APP_UNBIND_WORKFLOW_END,
  missingMarkersMessage: 'Scenario domain app unbind workflow markers not found',
  items: [{
    renderMode: 'numbered-list',
    intro: '> 需要下线 API 域名时，推荐走这条 cleanup CLI：',
    entries: [{ command: 'licell domain app unbind <domain> --yes', description: '解绑当前应用域名，并清理 FC custom domain / DNS CNAME。' }]
  }]
};

export const SCENARIO_DOMAIN_STATIC_UNBIND_WORKFLOW_SECTION: WorkflowDocGeneratedSection = {
  startMarker: SCENARIO_DOMAIN_STATIC_UNBIND_WORKFLOW_START,
  endMarker: SCENARIO_DOMAIN_STATIC_UNBIND_WORKFLOW_END,
  missingMarkersMessage: 'Scenario domain static unbind workflow markers not found',
  items: [{
    renderMode: 'numbered-list',
    intro: '> 需要下线静态站点域名时，推荐走这条 cleanup CLI：',
    entries: [{ command: 'licell domain static unbind <domain> --yes', description: '解绑静态站点域名，并清理 CDN domain / DNS CNAME。' }]
  }]
};

function renderTable(entries: WorkflowDocEntry[]) {
  return [
    '| 命令 | 说明 |',
    '|------|------|',
    ...entries.map((entry) => `| \`${entry.command}\` | ${entry.description} |`)
  ].join('\n');
}

function renderNumberedList(entries: WorkflowDocEntry[]) {
  return entries.map((entry, index) => `${index + 1}. \`${entry.command}\`：${entry.description}`).join('\n');
}

function renderWorkflowDocSectionItem(item: WorkflowDocSectionItem) {
  const parts: string[] = [];
  if (item.title) parts.push(`#### ${item.title}`, '');
  if (item.intro) parts.push(item.intro, '');
  parts.push(item.renderMode === 'table' ? renderTable(item.entries) : renderNumberedList(item.entries));
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
