export const FC_API_DEPLOY_WORKFLOW_TAG = 'fc-api-deploy-workflow';
export const FC_API_PRECHECK_WORKFLOW_TAG = 'fc-api-precheck-workflow';
export const DOMAIN_APP_BIND_WORKFLOW_TAG = 'domain-app-bind-workflow';
export const DOMAIN_APP_UNBIND_WORKFLOW_TAG = 'domain-app-unbind-workflow';
export const DOMAIN_STATIC_BIND_WORKFLOW_TAG = 'domain-static-bind-workflow';
export const DOMAIN_STATIC_UNBIND_WORKFLOW_TAG = 'domain-static-unbind-workflow';

export type LicellWorkflowRole = 'entry' | 'step';

export interface LicellWorkflowDescriptor {
  tag: string;
  title: string;
  summary: string;
  description?: string;
  suggestedCommandOrder: string[];
  entryTool?: {
    summary?: string;
    description?: string;
  };
}

export interface LicellMcpToolWorkflowAttachment {
  tag: string;
  title: string;
  summary: string;
  description?: string;
  role: LicellWorkflowRole;
  suggestedCommandOrder: string[];
}

const LICELL_WORKFLOW_DESCRIPTORS: Record<string, LicellWorkflowDescriptor> = {
  [FC_API_DEPLOY_WORKFLOW_TAG]: {
    tag: FC_API_DEPLOY_WORKFLOW_TAG,
    title: 'FC API deploy workflow',
    summary: '标准 FC API 部署链路：先读取部署规格，再做本地预检，最后执行正式部署。',
    description: '面向 FC API 的推荐工作流，帮助 Agent 在正式 deploy 前先理解 runtime 约束并发现入口/打包问题。',
    suggestedCommandOrder: ['deploy spec', 'deploy check', 'deploy'],
    entryTool: {
      summary: '在前两步通过后执行正式部署，将当前项目发布到阿里云。',
      description: 'Deploy current project. API deploys to Function Compute (FC 3.0); Static deploys to OSS hosting. For API, Agent should call licell_fc_deploy_spec + licell_fc_deploy_check before deploy.'
    }
  },
  [FC_API_PRECHECK_WORKFLOW_TAG]: {
    tag: FC_API_PRECHECK_WORKFLOW_TAG,
    title: 'FC API precheck workflow',
    summary: '只读预检链路：先读取 runtime 规格，再验证当前项目是否满足部署约束。',
    description: '面向 Agent 的只读预检工作流，避免在真正部署前才发现 handler、entry 或 Docker 环境问题。',
    suggestedCommandOrder: ['deploy spec', 'deploy check']
  },
  [DOMAIN_APP_BIND_WORKFLOW_TAG]: {
    tag: DOMAIN_APP_BIND_WORKFLOW_TAG,
    title: 'App domain bind workflow',
    summary: '应用域名接入链路：绑定 FC custom domain、对齐 DNS，并可选自动签发 HTTPS。',
    description: '面向 API / FC 场景的域名工作流，适合把自定义域名路由到指定 alias，并在需要时自动启用 HTTPS。',
    suggestedCommandOrder: ['domain app bind'],
    entryTool: {
      summary: '为当前应用绑定自定义域名，编排 DNS、FC custom domain 与可选 HTTPS。',
      description: 'Bind an app domain by orchestrating DNS, FC custom domain routing, and optional HTTPS in one workflow.'
    }
  },
  [DOMAIN_APP_UNBIND_WORKFLOW_TAG]: {
    tag: DOMAIN_APP_UNBIND_WORKFLOW_TAG,
    title: 'App domain cleanup workflow',
    summary: '应用域名下线链路：解绑 FC custom domain，并清理对应 DNS CNAME。',
    description: '面向 API / FC 场景的清理工作流，适合在下线应用域名时同步清理 FC custom domain 与 DNS。',
    suggestedCommandOrder: ['domain app unbind'],
    entryTool: {
      summary: '解绑当前应用域名，并清理 FC custom domain / DNS CNAME。',
      description: 'Unbind an app domain by removing FC custom domain routing and cleaning up DNS in one workflow.'
    }
  },
  [DOMAIN_STATIC_BIND_WORKFLOW_TAG]: {
    tag: DOMAIN_STATIC_BIND_WORKFLOW_TAG,
    title: 'Static domain bind workflow',
    summary: '静态站点域名接入链路：把域名接到 CDN、对齐 DNS，并可选自动启用 HTTPS。',
    description: '面向 OSS / CDN 场景的域名工作流，适合把静态站点域名一次性接到 CDN、DNS 与 HTTPS 配置。',
    suggestedCommandOrder: ['domain static bind'],
    entryTool: {
      summary: '为静态站点绑定自定义域名，编排 CDN、DNS 与可选 HTTPS。',
      description: 'Bind a static-site domain by orchestrating CDN, DNS, and optional HTTPS in one workflow.'
    }
  },
  [DOMAIN_STATIC_UNBIND_WORKFLOW_TAG]: {
    tag: DOMAIN_STATIC_UNBIND_WORKFLOW_TAG,
    title: 'Static domain cleanup workflow',
    summary: '静态站点域名下线链路：移除 CDN domain，并清理对应 DNS CNAME。',
    description: '面向 OSS / CDN 场景的清理工作流，适合在下线静态站点域名时同步清理 CDN domain 与 DNS。',
    suggestedCommandOrder: ['domain static unbind'],
    entryTool: {
      summary: '解绑静态站点域名，并清理 CDN domain / DNS CNAME。',
      description: 'Unbind a static-site domain by removing CDN routing and cleaning up DNS in one workflow.'
    }
  }
};

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

export function listLicellWorkflowDescriptors() {
  return Object.values(LICELL_WORKFLOW_DESCRIPTORS).map((descriptor) => ({
    ...descriptor,
    suggestedCommandOrder: [...descriptor.suggestedCommandOrder],
    entryTool: descriptor.entryTool ? { ...descriptor.entryTool } : undefined
  }));
}

export function getLicellWorkflowDescriptor(tag: string) {
  const descriptor = LICELL_WORKFLOW_DESCRIPTORS[tag];
  if (!descriptor) return undefined;
  return {
    ...descriptor,
    suggestedCommandOrder: [...descriptor.suggestedCommandOrder],
    entryTool: descriptor.entryTool ? { ...descriptor.entryTool } : undefined
  } satisfies LicellWorkflowDescriptor;
}

export function resolveLicellWorkflowSuggestedCommandOrder(tag: string, fallback?: string[]) {
  const descriptor = getLicellWorkflowDescriptor(tag);
  if (descriptor) return descriptor.suggestedCommandOrder;
  return [...(fallback || [])];
}

export function resolveLicellWorkflowEntryCopy(
  tags?: string[],
  workflowRoleByTag?: Record<string, LicellWorkflowRole>
) {
  for (const tag of unique(tags || [])) {
    const role = workflowRoleByTag?.[tag] || 'step';
    if (role !== 'entry') continue;
    const descriptor = getLicellWorkflowDescriptor(tag);
    if (!descriptor?.entryTool) continue;
    return {
      summary: descriptor.entryTool.summary,
      description: descriptor.entryTool.description
    };
  }
  return undefined;
}

export function buildLicellToolWorkflowAttachments(
  tags?: string[],
  workflowRoleByTag?: Record<string, LicellWorkflowRole>
) {
  return unique(tags || []).reduce<LicellMcpToolWorkflowAttachment[]>((items, tag) => {
    const descriptor = getLicellWorkflowDescriptor(tag);
    if (!descriptor) return items;
    items.push({
      tag: descriptor.tag,
      title: descriptor.title,
      summary: descriptor.summary,
      ...(descriptor.description ? { description: descriptor.description } : {}),
      role: workflowRoleByTag?.[tag] || 'step',
      suggestedCommandOrder: [...descriptor.suggestedCommandOrder]
    });
    return items;
  }, []);
}
