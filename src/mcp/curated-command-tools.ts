import {
  atLeastOnePresentValidator,
  booleanProp,
  buildCuratedToolMap,
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
    title: 'Deploy service (API/Static) to Aliyun',
    commandSignature: 'deploy',
    tags: ['fc-api-deploy-workflow'],
    docsSummary: '在前两步通过后执行正式部署，将当前项目发布到阿里云。',
    description:
      'Deploy current project. API deploys to Function Compute (FC 3.0); Static deploys to OSS hosting. For API, Agent should call licell_fc_deploy_spec + licell_fc_deploy_check before deploy.',
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

  defineCuratedTool({
    name: 'licell_fc_deploy_spec',
    title: 'Get FC API deploy spec',
    tags: ['fc-api-deploy-workflow', 'fc-api-precheck-workflow'],
    docsSummary: '读取 FC API runtime 的 entry / handler / 资源约束，帮助 Agent 先理解限制与签名模板。',
    description:
      'Return machine-readable FC API runtime specs (handlerContract/eventSchema/responseSchema/examples/validationRules and resource constraints) for agent planning.',
    inputSchema: inputSchema(withExecutionProps({
      runtime: stringProp('Optional runtime filter: nodejs20/nodejs22/python3.12/python3.13/docker.'),
      all: booleanProp('Return all runtime specs.')
    })),
    baseArgv: ['deploy', 'spec'],
    bindings: [
      optionalPositionalString('runtime'),
      optionalBooleanFlag('all', '--all')
    ]
  }),

  defineCuratedTool({
    name: 'licell_fc_deploy_check',
    title: 'Precheck FC API deploy readiness',
    tags: ['fc-api-deploy-workflow', 'fc-api-precheck-workflow'],
    docsSummary: '只读预检当前项目，提前发现 handler、入口文件或 Docker 环境问题，并给出可执行修复建议。',
    description:
      'Read-only validation before FC API deployment. Returns actionable issues (missing handler, wrong entry, Docker prerequisites, etc.) and does not modify project files.',
    inputSchema: inputSchema(withExecutionProps({
      runtime: stringProp('Runtime to validate (default from project/env or nodejs20).'),
      entry: stringProp('Optional entry path override.'),
      dockerDaemon: booleanProp('When runtime=docker, also check local Docker daemon availability.')
    })),
    baseArgv: ['deploy', 'check'],
    bindings: [
      optionalStringFlag('runtime', '--runtime'),
      optionalStringFlag('entry', '--entry'),
      optionalBooleanFlag('dockerDaemon', '--docker-daemon')
    ]
  }),

  defineCuratedTool({
    name: 'licell_init',
    title: 'Initialize licell project',
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

  defineCuratedTool({
    name: 'licell_release_promote',
    title: 'Promote FC release (alias switch)',
    description: 'Publish (if needed) and switch an FC alias (e.g. prod/preview) to a version.',
    inputSchema: inputSchema(withExecutionProps({
      versionId: stringProp('Optional versionId. If omitted, licell will publish current code or reuse latest published.'),
      target: stringProp('Alias target (default: prod).')
    })),
    baseArgv: ['release', 'promote'],
    bindings: [
      optionalPositionalString('versionId'),
      optionalStringFlag('target', '--target')
    ]
  }),

  defineCuratedTool({
    name: 'licell_release_rollback',
    title: 'Rollback FC release (alias switch)',
    description: 'Switch an FC alias to a specific versionId.',
    inputSchema: inputSchema(withExecutionProps({
      versionId: stringProp('VersionId to rollback to.'),
      target: stringProp('Alias target (default: prod).')
    }), ['versionId']),
    baseArgv: ['release', 'rollback'],
    bindings: [
      requiredPositionalString('versionId', 'versionId is required'),
      optionalStringFlag('target', '--target')
    ]
  }),

  defineCuratedTool({
    name: 'licell_release_prune',
    title: 'Prune FC historical versions (dangerous)',
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

  defineCuratedTool({
    name: 'licell_fn_list',
    title: 'List functions',
    description: 'List FC functions in current region.',
    inputSchema: inputSchema(withExecutionProps({
      limit: numberProp('Max items (default 20).'),
      prefix: stringProp('Filter by function name prefix.')
    })),
    baseArgv: ['fn', 'list'],
    bindings: [
      optionalNumberFlag('limit', '--limit'),
      optionalStringFlag('prefix', '--prefix')
    ]
  }),

  defineCuratedTool({
    name: 'licell_fn_info',
    title: 'Get function info',
    description: 'Get FC function details.',
    inputSchema: inputSchema(withExecutionProps({
      name: stringProp('Function name. If omitted, uses project appName.'),
      target: stringProp('Qualifier alias/version (e.g. prod/preview/1).')
    })),
    baseArgv: ['fn', 'info'],
    bindings: [
      optionalPositionalString('name'),
      optionalStringFlag('target', '--target')
    ]
  }),

  defineCuratedTool({
    name: 'licell_fn_invoke',
    title: 'Invoke function',
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

  defineCuratedTool({
    name: 'licell_fn_rm',
    title: 'Remove function (dangerous)',
    description: 'Delete FC function. Destructive (requires yes=true).',
    inputSchema: inputSchema(withExecutionProps({
      name: stringProp('Function name. If omitted, uses project appName.'),
      force: booleanProp('Cascade delete triggers/aliases/versions.'),
      yes: booleanProp('Required in non-interactive mode.')
    })),
    annotations: { destructiveHint: true },
    baseArgv: ['fn', 'rm'],
    validators: [requireTrueValidator('yes', 'fn rm is destructive; set yes=true to confirm')],
    bindings: [
      optionalPositionalString('name'),
      optionalBooleanFlag('force', '--force'),
      literalTokens('--yes')
    ]
  }),

  defineCuratedTool({
    name: 'licell_domain_add',
    title: 'Bind custom domain (and optional SSL)',
    description: 'Bind a custom domain to current FC app and optionally enable HTTPS.',
    inputSchema: inputSchema(withExecutionProps({
      domain: stringProp('Full domain, e.g. api.example.com.'),
      ssl: booleanProp("Enable HTTPS (Let's Encrypt)."),
      sslForceRenew: booleanProp('Force renew certificate.'),
      target: stringProp('Route to FC alias (prod/preview).')
    }), ['domain']),
    baseArgv: ['domain', 'add'],
    bindings: [
      requiredPositionalString('domain', 'domain is required'),
      optionalBooleanFlag('ssl', '--ssl'),
      optionalBooleanFlag('sslForceRenew', '--ssl-force-renew'),
      optionalStringFlag('target', '--target')
    ]
  }),

  defineCuratedTool({
    name: 'licell_domain_rm',
    title: 'Unbind custom domain (dangerous)',
    description: 'Unbind custom domain and cleanup DNS record. Destructive (requires yes=true).',
    inputSchema: inputSchema(withExecutionProps({
      domain: stringProp('Full domain, e.g. api.example.com.'),
      yes: booleanProp('Required in non-interactive mode.')
    }), ['domain']),
    annotations: { destructiveHint: true },
    baseArgv: ['domain', 'rm'],
    validators: [requireTrueValidator('yes', 'domain rm is destructive; set yes=true to confirm')],
    bindings: [
      requiredPositionalString('domain', 'domain is required'),
      literalTokens('--yes')
    ]
  }),

  defineCuratedTool({
    name: 'licell_dns_records_list',
    title: 'List DNS records',
    description: 'List DNS records for a domain (Alidns).',
    inputSchema: inputSchema(withExecutionProps({
      domain: stringProp('Root domain, e.g. example.com.'),
      limit: numberProp('Max items (default 100).')
    }), ['domain']),
    baseArgv: ['dns', 'records', 'list'],
    bindings: [
      requiredPositionalString('domain', 'domain is required'),
      optionalNumberFlag('limit', '--limit')
    ]
  }),

  defineCuratedTool({
    name: 'licell_dns_records_add',
    title: 'Add DNS record',
    description: 'Add a DNS record (Alidns).',
    inputSchema: inputSchema(withExecutionProps({
      domain: stringProp('Root domain, e.g. example.com.'),
      rr: stringProp('RR host, e.g. @/www/api.'),
      type: stringProp('Record type, e.g. A/CNAME/TXT.'),
      value: stringProp('Record value.'),
      ttl: numberProp('TTL seconds (default 600).'),
      line: stringProp('Line (default: default).')
    }), ['domain', 'rr', 'type', 'value']),
    baseArgv: ['dns', 'records', 'add'],
    bindings: [
      requiredPositionalString('domain', 'domain is required'),
      requiredStringFlag('rr', '--rr', 'rr is required'),
      requiredStringFlag('type', '--type', 'type is required'),
      requiredStringFlag('value', '--value', 'value is required'),
      optionalNumberFlag('ttl', '--ttl'),
      optionalStringFlag('line', '--line')
    ]
  }),

  defineCuratedTool({
    name: 'licell_dns_records_rm',
    title: 'Remove DNS record (dangerous)',
    description: 'Remove a DNS record by recordId. Destructive (requires yes=true).',
    inputSchema: inputSchema(withExecutionProps({
      recordId: stringProp('RecordId from list.'),
      yes: booleanProp('Required in non-interactive mode.')
    }), ['recordId']),
    annotations: { destructiveHint: true },
    baseArgv: ['dns', 'records', 'rm'],
    validators: [requireTrueValidator('yes', 'dns records rm is destructive; set yes=true to confirm')],
    bindings: [
      requiredPositionalString('recordId', 'recordId is required'),
      literalTokens('--yes')
    ]
  }),

  defineCuratedTool({
    name: 'licell_supa_list',
    title: 'List Supabase instances',
    description: 'List RDS Supabase instances in current region.',
    inputSchema: inputSchema(withExecutionProps({
      limit: numberProp('Max items (default 20).')
    })),
    baseArgv: ['supa', 'list'],
    bindings: [optionalNumberFlag('limit', '--limit')]
  }),

  defineCuratedTool({
    name: 'licell_supa_add',
    title: 'Create Supabase instance',
    description: 'Provision a new RDS Supabase instance (creates PG, waits until Running, saves env vars). Long-running (~5-10 min).',
    inputSchema: inputSchema(withExecutionProps({
      name: stringProp('App name for the instance.'),
      vsw: stringProp('VSwitch ID (auto-detected if omitted).'),
      class: stringProp('Instance class (default rdsai.supabase.basic).'),
      dbInstance: stringProp('Existing RDS PostgreSQL instance ID to associate.'),
      dashboardUser: stringProp('Dashboard username (default supabase).'),
      dashboardPassword: stringProp('Dashboard password (auto-generated if omitted).'),
      dbPassword: stringProp('Database password (auto-generated if omitted).'),
      publicNetwork: booleanProp('Enable public NAT gateway.')
    }, { timeoutDescription: 'Command timeout in milliseconds (default 900000 for long provision).' })),
    baseArgv: ['supa', 'add'],
    bindings: [
      optionalStringFlag('name', '--name'),
      optionalStringFlag('vsw', '--vsw'),
      optionalStringFlag('class', '--class'),
      optionalStringFlag('dbInstance', '--db-instance'),
      optionalStringFlag('dashboardUser', '--dashboard-user'),
      optionalStringFlag('dashboardPassword', '--dashboard-password'),
      optionalStringFlag('dbPassword', '--db-password'),
      optionalBooleanFlag('publicNetwork', '--public-network')
    ]
  }),

  defineCuratedTool({
    name: 'licell_supa_info',
    title: 'Get Supabase instance details',
    description: 'Get detailed attributes of a Supabase instance.',
    inputSchema: inputSchema(withExecutionProps({
      instanceName: stringProp('Supabase instance name.')
    }), ['instanceName']),
    baseArgv: ['supa', 'info'],
    bindings: [requiredPositionalString('instanceName', 'instanceName is required')]
  }),

  defineCuratedTool({
    name: 'licell_supa_connect',
    title: 'Get Supabase connection info',
    description: 'Get Supabase endpoints, DB endpoints, and API keys (anon key, service key, JWT secret).',
    inputSchema: inputSchema(withExecutionProps({
      instanceName: stringProp('Supabase instance name.')
    }), ['instanceName']),
    baseArgv: ['supa', 'connect'],
    bindings: [requiredPositionalString('instanceName', 'instanceName is required')]
  }),

  defineCuratedTool({
    name: 'licell_supa_config',
    title: 'View/modify Supabase config',
    description: 'View or modify Supabase instance configuration (auth/storage/RAG). Without modification flags, shows current config.',
    inputSchema: inputSchema(withExecutionProps({
      instanceName: stringProp('Supabase instance name.'),
      setAuth: stringProp('Set auth config: KEY=VALUE (e.g. GOTRUE_SITE_URL=http://example.com).'),
      setStorage: stringProp('Set storage config: KEY=VALUE.'),
      rag: stringEnumProp('Enable/disable RAG Agent.', ['on', 'off']),
      setRag: stringProp('Set RAG config: KEY=VALUE.')
    }), ['instanceName']),
    baseArgv: ['supa', 'config'],
    bindings: [
      requiredPositionalString('instanceName', 'instanceName is required'),
      optionalStringFlag('setAuth', '--set-auth'),
      optionalStringFlag('setStorage', '--set-storage'),
      optionalStringFlag('rag', '--rag'),
      optionalStringFlag('setRag', '--set-rag')
    ]
  }),

  defineCuratedTool({
    name: 'licell_supa_whitelist',
    title: 'Manage Supabase IP whitelist',
    description: 'View or modify Supabase instance IP whitelist. Without modification flags, shows current whitelist.',
    inputSchema: inputSchema(withExecutionProps({
      instanceName: stringProp('Supabase instance name.'),
      set: stringProp('Set whitelist IPs (cover mode, comma-separated).'),
      add: stringProp('Append whitelist IPs (comma-separated).'),
      remove: stringProp('Remove whitelist IPs (comma-separated).'),
      group: stringProp('Whitelist group name (default: default).')
    }), ['instanceName']),
    baseArgv: ['supa', 'whitelist'],
    bindings: [
      requiredPositionalString('instanceName', 'instanceName is required'),
      optionalStringFlag('set', '--set'),
      optionalStringFlag('add', '--add'),
      optionalStringFlag('remove', '--remove'),
      optionalStringFlag('group', '--group')
    ]
  }),

  defineCuratedTool({
    name: 'licell_supa_reset_password',
    title: 'Reset Supabase password',
    description: 'Reset Supabase dashboard or database password.',
    inputSchema: inputSchema(withExecutionProps({
      instanceName: stringProp('Supabase instance name.'),
      dashboardPassword: stringProp('New dashboard password.'),
      dbPassword: stringProp('New database password.')
    }), ['instanceName']),
    baseArgv: ['supa', 'reset-password'],
    validators: [atLeastOnePresentValidator(['dashboardPassword', 'dbPassword'], 'Provide dashboardPassword or dbPassword')],
    bindings: [
      requiredPositionalString('instanceName', 'instanceName is required'),
      optionalStringFlag('dashboardPassword', '--dashboard-password'),
      optionalStringFlag('dbPassword', '--db-password')
    ]
  }),

  defineCuratedTool({
    name: 'licell_supa_lifecycle',
    title: 'Restart/stop/start Supabase instance',
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

  defineCuratedTool({
    name: 'licell_supa_rm',
    title: 'Delete Supabase instance (dangerous)',
    description: 'Delete a Supabase instance. Destructive and irreversible (requires yes=true). Associated PG instance and NAT gateway need manual cleanup.',
    inputSchema: inputSchema(withExecutionProps({
      instanceName: stringProp('Supabase instance name.'),
      yes: booleanProp('Required in non-interactive mode.')
    }), ['instanceName']),
    annotations: { destructiveHint: true },
    baseArgv: ['supa', 'rm'],
    validators: [requireTrueValidator('yes', 'supa rm is destructive; set yes=true to confirm')],
    bindings: [
      requiredPositionalString('instanceName', 'instanceName is required'),
      literalTokens('--yes')
    ]
  })
]);

export function getCuratedMcpCommandTools(): Record<string, CuratedMcpCommandTool> {
  return CURATED_MCP_COMMAND_TOOLS;
}
