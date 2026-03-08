import {
  DOMAIN_APP_BIND_WORKFLOW_TAG,
  DOMAIN_APP_UNBIND_WORKFLOW_TAG,
  DOMAIN_STATIC_BIND_WORKFLOW_TAG,
  DOMAIN_STATIC_UNBIND_WORKFLOW_TAG,
  FC_API_DEPLOY_WORKFLOW_TAG,
  FC_API_PRECHECK_WORKFLOW_TAG
} from './workflow-descriptors';
import {
  atLeastOnePresentValidator,
  booleanProp,
  buildCuratedToolMap,
  defineCuratedCliWrapperTool,
  defineCuratedTool,
  defaultTrueFlag,
  inputSchema,
  literalTokens,
  mutuallyExclusiveValidator,
  numberProp,
  objectProp,
  optionalBooleanFlag,
  optionalJsonFlag,
  optionalNumberFlag,
  optionalPositionalString,
  optionalStringFlag,
  requireEnum,
  requiredPositionalString,
  requiredStringFlag,
  requireTrueValidator,
  requireTrueWhenBoolean,
  stringEnumProp,
  stringProp,
  whenBooleanTrue,
  withExecutionProps,
  type CuratedMcpCommandTool
} from './curated-tool-dsl';

const CURATED_MCP_COMMAND_TOOLS = buildCuratedToolMap([
  defineCuratedTool({
    name: 'licell_deploy',
    commandSignature: 'deploy',
    tags: [FC_API_DEPLOY_WORKFLOW_TAG],
    workflowRoleByTag: { [FC_API_DEPLOY_WORKFLOW_TAG]: 'entry' },
    inputSchema: inputSchema(
      withExecutionProps({
        type: stringEnumProp('Deployment type.', ['api', 'static']),
        runtime: stringProp('API runtime: nodejs20/nodejs22/python3.12/python3.13/docker; Static: static/statis.'),
        entry: stringProp('API entry file (default depends on runtime).'),
        dist: stringProp('Static site directory (default: dist).'),
        target: stringProp('FC alias target (e.g. prod/preview). API only.'),
        domain: stringProp('Full custom domain (e.g. api.example.com). API/Static supported; implies SSL. Static will auto-enable CDN.'),
        domainSuffix: stringProp('Domain suffix (e.g. example.com) to bind <appName>.<suffix>. API/Static supported.'),
        enableCdn: booleanProp('Enable CDN after domain bind (API optional; Static with domain already auto-enables). Implies SSL.'),
        ssl: booleanProp("Enable HTTPS (Let's Encrypt). If domain/enableCdn is set, SSL is implied."),
        sslForceRenew: booleanProp('Force renew certificate when SSL enabled.'),
        acrNamespace: stringProp('ACR namespace for docker runtime.'),
        enableVpc: booleanProp('Enable VPC integration (API only).'),
        disableVpc: booleanProp('Disable VPC integration (API only, public mode).'),
        memory: numberProp('Memory size (MB).'),
        vcpu: numberProp('vCPU cores (e.g. 0.5/1/2).'),
        instanceConcurrency: numberProp('Instance concurrency.'),
        timeout: numberProp('Timeout seconds.')
      }),
      ['type']
    ),
    baseArgv: (toolArgs) => ['deploy', '--type', requireEnum(toolArgs, 'type', ['api', 'static'], 'type must be "api" or "static"')],
    bindings: [
      optionalStringFlag('runtime', '--runtime'),
      optionalStringFlag('entry', '--entry'),
      optionalStringFlag('dist', '--dist'),
      optionalStringFlag('target', '--target'),
      optionalStringFlag('domain', '--domain'),
      optionalStringFlag('domainSuffix', '--domain-suffix'),
      optionalBooleanFlag('enableCdn', '--enable-cdn'),
      optionalBooleanFlag('ssl', '--ssl'),
      optionalBooleanFlag('sslForceRenew', '--ssl-force-renew'),
      optionalStringFlag('acrNamespace', '--acr-namespace'),
      optionalBooleanFlag('enableVpc', '--enable-vpc'),
      optionalBooleanFlag('disableVpc', '--disable-vpc'),
      optionalNumberFlag('memory', '--memory'),
      optionalNumberFlag('vcpu', '--vcpu'),
      optionalNumberFlag('instanceConcurrency', '--instance-concurrency'),
      optionalNumberFlag('timeout', '--timeout')
    ]
  }),

  defineCuratedCliWrapperTool({
    name: 'licell_fc_deploy_spec',
    commandSignature: 'deploy spec',
    tags: [FC_API_DEPLOY_WORKFLOW_TAG, FC_API_PRECHECK_WORKFLOW_TAG],
    summary: '读取 FC API runtime 的 entry / handler / 资源约束，帮助 Agent 先理解限制与签名模板。',
    description:
      'Return machine-readable FC API runtime specs (handlerContract/eventSchema/responseSchema/examples/validationRules and resource constraints) for agent planning.',
    inputOverrides: {
      runtime: stringProp('Optional runtime filter: nodejs20/nodejs22/python3.12/python3.13/docker.'),
      all: booleanProp('Return all runtime specs.')
    }
  }),

  defineCuratedCliWrapperTool({
    name: 'licell_fc_deploy_check',
    commandSignature: 'deploy check',
    tags: [FC_API_DEPLOY_WORKFLOW_TAG, FC_API_PRECHECK_WORKFLOW_TAG],
    summary: '只读预检当前项目，提前发现 handler、入口文件或 Docker 环境问题，并给出可执行修复建议。',
    description:
      'Read-only validation before FC API deployment. Returns actionable issues (missing handler, wrong entry, Docker prerequisites, etc.) and does not modify project files.',
    inputOverrides: {
      runtime: stringProp('Runtime to validate (default from project/env or nodejs20).'),
      entry: stringProp('Optional entry path override.'),
      dockerDaemon: booleanProp('When runtime=docker, also check local Docker daemon availability.')
    }
  }),

  defineCuratedTool({
    name: 'licell_init',
    description:
      'Initialize current directory: write .licell/project.json, and optionally generate scaffold files for supported runtimes.',
    inputSchema: inputSchema(withExecutionProps({
      runtime: stringProp('nodejs20/nodejs22/python3.12/python3.13/docker.'),
      app: stringProp('appName (FC functionName).'),
      force: booleanProp('Overwrite/generate scaffold in non-empty dir.'),
      yes: booleanProp('Non-interactive mode (recommended for MCP). Default true.')
    })),
    baseArgv: ['init'],
    bindings: [
      optionalStringFlag('runtime', '--runtime'),
      optionalStringFlag('app', '--app'),
      optionalBooleanFlag('force', '--force'),
      defaultTrueFlag('yes', '--yes')
    ]
  }),

  defineCuratedCliWrapperTool({
    name: 'licell_release_promote',
    commandSignature: 'release promote',
    description: 'Publish (if needed) and switch an FC alias (e.g. prod/preview) to a version.',
    inputOverrides: {
      versionId: stringProp('Optional versionId. If omitted, licell will publish current code or reuse latest published.'),
      target: stringProp('Alias target (default: prod).')
    }
  }),

  defineCuratedCliWrapperTool({
    name: 'licell_release_rollback',
    commandSignature: 'release rollback',
    description: 'Switch an FC alias to a specific versionId.',
    inputOverrides: {
      versionId: stringProp('VersionId to rollback to.'),
      target: stringProp('Alias target (default: prod).')
    }
  }),

  defineCuratedTool({
    name: 'licell_release_prune',
    description: 'Preview or delete old FC published versions. Destructive when apply=true (requires yes=true).',
    inputSchema: inputSchema(withExecutionProps({
      keep: numberProp('Keep latest N versions (default 10).'),
      apply: booleanProp('If true, perform deletion. If false/omitted, preview only.'),
      yes: booleanProp('Required when apply=true (non-interactive double-confirm).')
    })),
    annotations: { destructiveHint: true },
    baseArgv: ['release', 'prune'],
    validators: [requireTrueWhenBoolean('apply', 'yes', 'apply=true is destructive; set yes=true to confirm')],
    bindings: [
      optionalNumberFlag('keep', '--keep'),
      whenBooleanTrue('apply', literalTokens('--apply', '--yes'))
    ]
  }),

  defineCuratedCliWrapperTool({
    name: 'licell_fn_list',
    commandSignature: 'fn list',
    description: 'List FC functions in current region.',
    inputOverrides: {
      limit: numberProp('Max items (default 20).'),
      prefix: stringProp('Filter by function name prefix.')
    }
  }),

  defineCuratedCliWrapperTool({
    name: 'licell_fn_info',
    commandSignature: 'fn info',
    description: 'Get FC function details.',
    inputOverrides: {
      name: stringProp('Function name. If omitted, uses project appName.'),
      target: stringProp('Qualifier alias/version (e.g. prod/preview/1).')
    }
  }),

  defineCuratedTool({
    name: 'licell_fn_invoke',
    description: 'Invoke FC function synchronously with an optional payload.',
    inputSchema: inputSchema(withExecutionProps({
      name: stringProp('Function name. If omitted, uses project appName.'),
      target: stringProp('Qualifier alias/version (e.g. prod/preview/1).'),
      payload: stringProp('Raw payload text.'),
      payloadJson: objectProp('JSON payload object (will be JSON.stringify-ed).', { additionalProperties: true })
    })),
    baseArgv: ['fn', 'invoke'],
    validators: [mutuallyExclusiveValidator(['payload', 'payloadJson'], 'Provide only one of payload or payloadJson')],
    bindings: [
      optionalPositionalString('name'),
      optionalStringFlag('target', '--target'),
      optionalStringFlag('payload', '--payload'),
      optionalJsonFlag('payloadJson', '--payload')
    ]
  }),

  defineCuratedCliWrapperTool({
    name: 'licell_fn_rm',
    commandSignature: 'fn rm',
    description: 'Delete FC function. Destructive (requires yes=true).',
    annotations: { destructiveHint: true },
    validators: [requireTrueValidator('yes', 'fn rm is destructive; set yes=true to confirm')],
    inputOverrides: {
      name: stringProp('Function name. If omitted, uses project appName.'),
      force: booleanProp('Cascade delete triggers/aliases/versions.'),
      yes: booleanProp('Required in non-interactive mode.')
    }
  }),

  defineCuratedCliWrapperTool({
    name: 'licell_domain_app_bind',
    commandSignature: 'domain app bind',
    tags: [DOMAIN_APP_BIND_WORKFLOW_TAG],
    workflowRoleByTag: { [DOMAIN_APP_BIND_WORKFLOW_TAG]: 'entry' },
    inputOverrides: {
      domain: stringProp('Full domain, e.g. api.example.com.'),
      ssl: booleanProp("Enable HTTPS (Let's Encrypt)."),
      sslForceRenew: booleanProp('Force renew certificate.'),
      target: stringProp('Route to FC alias (prod/preview).')
    }
  }),

  defineCuratedCliWrapperTool({
    name: 'licell_domain_app_unbind',
    commandSignature: 'domain app unbind',
    tags: [DOMAIN_APP_UNBIND_WORKFLOW_TAG],
    workflowRoleByTag: { [DOMAIN_APP_UNBIND_WORKFLOW_TAG]: 'entry' },
    annotations: { destructiveHint: true },
    validators: [requireTrueValidator('yes', 'domain app unbind is destructive; set yes=true to confirm')],
    inputOverrides: {
      domain: stringProp('Full domain, e.g. api.example.com.'),
      yes: booleanProp('Required in non-interactive mode.')
    }
  }),

  defineCuratedCliWrapperTool({
    name: 'licell_domain_static_bind',
    commandSignature: 'domain static bind',
    tags: [DOMAIN_STATIC_BIND_WORKFLOW_TAG],
    workflowRoleByTag: { [DOMAIN_STATIC_BIND_WORKFLOW_TAG]: 'entry' },
    inputOverrides: {
      domain: stringProp('Full domain, e.g. www.example.com.'),
      bucket: stringProp('Optional OSS bucket override.'),
      ssl: booleanProp("Enable HTTPS (Let's Encrypt)."),
      sslForceRenew: booleanProp('Force renew certificate.')
    }
  }),

  defineCuratedCliWrapperTool({
    name: 'licell_domain_static_unbind',
    commandSignature: 'domain static unbind',
    tags: [DOMAIN_STATIC_UNBIND_WORKFLOW_TAG],
    workflowRoleByTag: { [DOMAIN_STATIC_UNBIND_WORKFLOW_TAG]: 'entry' },
    annotations: { destructiveHint: true },
    validators: [requireTrueValidator('yes', 'domain static unbind is destructive; set yes=true to confirm')],
    inputOverrides: {
      domain: stringProp('Full domain, e.g. www.example.com.'),
      yes: booleanProp('Required in non-interactive mode.')
    }
  }),

  defineCuratedCliWrapperTool({
    name: 'licell_dns_records_list',
    commandSignature: 'dns records list',
    description: 'List DNS records for a domain (Alidns).',
    inputOverrides: {
      domain: stringProp('Root domain, e.g. example.com.'),
      limit: numberProp('Max items (default 100).')
    }
  }),

  defineCuratedCliWrapperTool({
    name: 'licell_dns_records_add',
    commandSignature: 'dns records add',
    description: 'Add a DNS record (Alidns).',
    requiredInputs: ['rr', 'type', 'value'],
    inputOverrides: {
      domain: stringProp('Root domain, e.g. example.com.'),
      rr: stringProp('RR host, e.g. @/www/api.'),
      type: stringProp('Record type, e.g. A/CNAME/TXT.'),
      value: stringProp('Record value.'),
      ttl: numberProp('TTL seconds (default 600).'),
      line: stringProp('Line (default: default).')
    }
  }),

  defineCuratedCliWrapperTool({
    name: 'licell_dns_records_rm',
    commandSignature: 'dns records rm',
    description: 'Remove a DNS record by recordId. Destructive (requires yes=true).',
    annotations: { destructiveHint: true },
    validators: [requireTrueValidator('yes', 'dns records rm is destructive; set yes=true to confirm')],
    inputOverrides: {
      recordId: stringProp('RecordId from list.'),
      yes: booleanProp('Required in non-interactive mode.')
    }
  }),

  defineCuratedCliWrapperTool({
    name: 'licell_supa_list',
    commandSignature: 'supa list',
    description: 'List RDS Supabase instances in current region.',
    inputOverrides: {
      limit: numberProp('Max items (default 20).')
    }
  }),

  defineCuratedCliWrapperTool({
    name: 'licell_supa_add',
    commandSignature: 'supa add',
    description: 'Provision a new RDS Supabase instance (creates PG, waits until Running, saves env vars). Long-running (~5-10 min).',
    timeoutDescription: 'Command timeout in milliseconds (default 900000 for long provision).',
    inputOverrides: {
      name: stringProp('App name for the instance.'),
      vsw: stringProp('VSwitch ID (auto-detected if omitted).'),
      class: stringProp('Instance class (default rdsai.supabase.basic).'),
      dbInstance: stringProp('Existing RDS PostgreSQL instance ID to associate.'),
      dashboardUser: stringProp('Dashboard username (default supabase).'),
      dashboardPassword: stringProp('Dashboard password (auto-generated if omitted).'),
      dbPassword: stringProp('Database password (auto-generated if omitted).'),
      publicNetwork: booleanProp('Enable public NAT gateway.')
    }
  }),

  defineCuratedCliWrapperTool({
    name: 'licell_supa_info',
    commandSignature: 'supa info',
    description: 'Get detailed attributes of a Supabase instance.',
    inputOverrides: {
      instanceName: stringProp('Supabase instance name.')
    }
  }),

  defineCuratedCliWrapperTool({
    name: 'licell_supa_connect',
    commandSignature: 'supa connect',
    description: 'Get Supabase endpoints, DB endpoints, and API keys (anon key, service key, JWT secret).',
    inputOverrides: {
      instanceName: stringProp('Supabase instance name.')
    }
  }),

  defineCuratedCliWrapperTool({
    name: 'licell_supa_config',
    commandSignature: 'supa config',
    description: 'View or modify Supabase instance configuration (auth/storage/RAG). Without modification flags, shows current config.',
    inputOverrides: {
      instanceName: stringProp('Supabase instance name.'),
      setAuth: stringProp('Set auth config: KEY=VALUE (e.g. GOTRUE_SITE_URL=http://example.com).'),
      setStorage: stringProp('Set storage config: KEY=VALUE.'),
      rag: stringEnumProp('Enable/disable RAG Agent.', ['on', 'off']),
      setRag: stringProp('Set RAG config: KEY=VALUE.')
    }
  }),

  defineCuratedCliWrapperTool({
    name: 'licell_supa_whitelist',
    commandSignature: 'supa whitelist',
    description: 'View or modify Supabase instance IP whitelist. Without modification flags, shows current whitelist.',
    inputOverrides: {
      instanceName: stringProp('Supabase instance name.'),
      set: stringProp('Set whitelist IPs (cover mode, comma-separated).'),
      add: stringProp('Append whitelist IPs (comma-separated).'),
      remove: stringProp('Remove whitelist IPs (comma-separated).'),
      group: stringProp('Whitelist group name (default: default).')
    }
  }),

  defineCuratedCliWrapperTool({
    name: 'licell_supa_reset_password',
    commandSignature: 'supa reset-password',
    description: 'Reset Supabase dashboard or database password.',
    validators: [atLeastOnePresentValidator(['dashboardPassword', 'dbPassword'], 'Provide dashboardPassword or dbPassword')],
    inputOverrides: {
      instanceName: stringProp('Supabase instance name.'),
      dashboardPassword: stringProp('New dashboard password.'),
      dbPassword: stringProp('New database password.')
    }
  }),

  defineCuratedTool({
    name: 'licell_supa_lifecycle',
    title: 'Manage Supabase instance lifecycle',
    commandSignature: 'supa <action>',
    description: 'Manage Supabase instance lifecycle: restart, stop, or start.',
    inputSchema: inputSchema(withExecutionProps({
      instanceName: stringProp('Supabase instance name.'),
      action: stringEnumProp('Lifecycle action.', ['restart', 'stop', 'start'])
    }), ['instanceName', 'action']),
    baseArgv: (toolArgs) => [
      'supa',
      requireEnum(toolArgs, 'action', ['restart', 'stop', 'start'], 'action must be restart, stop, or start')
    ],
    bindings: [requiredPositionalString('instanceName', 'instanceName is required')]
  }),

  defineCuratedCliWrapperTool({
    name: 'licell_supa_rm',
    commandSignature: 'supa rm',
    description: 'Delete a Supabase instance. Destructive and irreversible (requires yes=true). Associated PG instance and NAT gateway need manual cleanup.',
    annotations: { destructiveHint: true },
    validators: [requireTrueValidator('yes', 'supa rm is destructive; set yes=true to confirm')],
    inputOverrides: {
      instanceName: stringProp('Supabase instance name.'),
      yes: booleanProp('Required in non-interactive mode.')
    }
  })
]);

export function getCuratedMcpCommandTools(): Record<string, CuratedMcpCommandTool> {
  return CURATED_MCP_COMMAND_TOOLS;
}
