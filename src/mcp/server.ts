import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { isAbsolute, resolve } from 'path';
import { formatErrorMessage } from '../utils/errors';

type JsonRpcId = string | number | null;

type JsonRpcRequest = {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: unknown;
};

type JsonRpcNotification = {
  jsonrpc: '2.0';
  method: string;
  params?: unknown;
};

type JsonRpcResponse = {
  jsonrpc: '2.0';
  id: JsonRpcId;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function writeMessage(value: unknown) {
  // MCP stdio: newline-delimited JSON, MUST NOT contain embedded newlines.
  // JSON.stringify will escape any "\n" inside strings.
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

function writeResponse(resp: JsonRpcResponse) {
  writeMessage(resp);
}

function writeError(id: JsonRpcId, code: number, message: string, data?: unknown) {
  const resp: JsonRpcResponse = {
    jsonrpc: '2.0',
    id,
    error: data ? { code, message, data } : { code, message }
  };
  writeResponse(resp);
}

function writeResult(id: JsonRpcId, result: unknown) {
  const resp: JsonRpcResponse = { jsonrpc: '2.0', id, result };
  writeResponse(resp);
}

function resolveSelfCommand(): { command: string; baseArgs: string[] } {
  // For SEA standalone, process.execPath is the licell binary (no script arg needed).
  // For "node dist/licell.js" (or bun), include argv[1] as the script entrypoint.
  const command = process.execPath;
  const baseArgs: string[] = [];
  const argv1 = process.argv[1];
  if (typeof argv1 === 'string') {
    const lower = argv1.toLowerCase();
    if (lower.endsWith('.js') || lower.endsWith('.cjs') || lower.endsWith('.mjs') || lower.endsWith('.ts')) {
      baseArgs.push(argv1);
    }
  }
  return { command, baseArgs };
}

function toSafeCwd(projectRoot: string, cwdInput: unknown): string {
  if (typeof cwdInput !== 'string') return projectRoot;
  const trimmed = cwdInput.trim();
  if (!trimmed) return projectRoot;
  const resolved = isAbsolute(trimmed) ? resolve(trimmed) : resolve(projectRoot, trimmed);
  const rootResolved = resolve(projectRoot);
  if (resolved === rootResolved) return resolved;
  if (!resolved.startsWith(`${rootResolved}/`)) {
    throw new Error(`cwd 必须在 projectRoot 内部: cwd=${resolved}, projectRoot=${rootResolved}`);
  }
  return resolved;
}

function createLimitedCollector(limitBytes: number) {
  let buf = '';
  let bytes = 0;
  let truncated = false;
  return {
    push(chunk: Buffer) {
      if (truncated) return;
      const next = bytes + chunk.length;
      if (next <= limitBytes) {
        buf += chunk.toString('utf8');
        bytes = next;
        return;
      }
      const remaining = Math.max(0, limitBytes - bytes);
      if (remaining > 0) buf += chunk.subarray(0, remaining).toString('utf8');
      bytes = limitBytes;
      truncated = true;
    },
    get() {
      return { text: buf, truncated };
    }
  };
}

function toOptionalString(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toOptionalBoolean(value: unknown) {
  if (typeof value === 'boolean') return value;
  return undefined;
}

function toOptionalNumber(value: unknown) {
  if (typeof value !== 'number') return undefined;
  if (!Number.isFinite(value)) return undefined;
  return value;
}

function assertTrue(flag: unknown, message: string) {
  if (flag !== true) throw new Error(message);
}

async function runLicellCliTool(options: {
  projectRoot: string;
  argv: string[];
  cwd?: unknown;
  timeoutMs?: unknown;
}) {
  if (options.argv.length === 0) throw new Error('argv 不能为空');
  if (options.argv[0] === 'mcp' || options.argv.includes('mcp')) {
    throw new Error('禁止在 MCP 中递归调用 licell mcp（请直接调用其它 licell 命令）');
  }

  const cwd = toSafeCwd(options.projectRoot, options.cwd);

  const timeoutMsRaw = typeof options.timeoutMs === 'number' ? options.timeoutMs : undefined;
  const timeoutMs = Number.isFinite(timeoutMsRaw) && timeoutMsRaw && timeoutMsRaw > 0
    ? Math.min(Math.max(1_000, Math.floor(timeoutMsRaw)), 30 * 60 * 1_000)
    : 10 * 60 * 1_000;

  const { command, baseArgs } = resolveSelfCommand();
  const args = [...baseArgs, ...options.argv];

  // Keep output reasonably bounded to avoid blowing up MCP payload size.
  const limitBytes = 1024 * 1024; // 1MB each stream (stdout/stderr)
  const stdoutCollector = createLimitedCollector(limitBytes);
  const stderrCollector = createLimitedCollector(limitBytes);

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    CI: '1',
    NO_COLOR: '1',
    LICELL_MCP: '1'
  };

  const child = spawn(command, args, {
    cwd,
    env,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  child.stdout?.on('data', (chunk: Buffer) => stdoutCollector.push(chunk));
  child.stderr?.on('data', (chunk: Buffer) => stderrCollector.push(chunk));

  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    child.kill('SIGTERM');
    setTimeout(() => child.kill('SIGKILL'), 2_000).unref();
  }, timeoutMs);
  timeout.unref();

  const exitCode = await new Promise<number | null>((resolveExit, rejectExit) => {
    child.on('error', rejectExit);
    child.on('close', (code) => resolveExit(code));
  }).finally(() => clearTimeout(timeout));

  const stdout = stdoutCollector.get();
  const stderr = stderrCollector.get();
  return {
    exitCode,
    timedOut,
    stdout,
    stderr,
    command: [command, ...args].join(' ')
  };
}

function toToolCallResult(run: Awaited<ReturnType<typeof runLicellCliTool>>) {
  const structuredContent = {
    exitCode: run.exitCode,
    timedOut: run.timedOut,
    command: run.command,
    stdout: run.stdout.text,
    stdoutTruncated: run.stdout.truncated,
    stderr: run.stderr.text,
    stderrTruncated: run.stderr.truncated
  };

  const headline = run.timedOut
    ? `timed out: ${structuredContent.command}`
    : `exit=${structuredContent.exitCode ?? 'null'}: ${structuredContent.command}`;

  const stdoutNote = run.stdout.truncated ? '\n[stdout truncated]' : '';
  const stderrNote = run.stderr.truncated ? '\n[stderr truncated]' : '';

  return {
    isError: Boolean(run.timedOut || (typeof run.exitCode === 'number' && run.exitCode !== 0)),
    content: [
      {
        type: 'text',
        text: `${headline}\n\n[stdout]\n${structuredContent.stdout}${stdoutNote}\n\n[stderr]\n${structuredContent.stderr}${stderrNote}`.trim()
      }
    ],
    structuredContent
  };
}

export async function runLicellMcpServer(options: { projectRoot: string; serverTitle: string; serverVersion: string }) {
  // IMPORTANT: When used as a stdio MCP server, stdout must remain pure JSON-RPC messages.
  // Use stderr for any logs.
  const log = (msg: string) => {
    process.stderr.write(`${msg}\n`);
  };
  const debug = process.env.LICELL_MCP_DEBUG === '1' || process.env.LICELL_MCP_DEBUG === 'true';

  const toolSchemas = {
    // Generic escape hatch: run any licell argv directly.
    licell_cli: {
      name: 'licell_cli',
      title: 'Deploy & manage Aliyun services (licell)',
      description:
        'Use licell CLI to deploy API/static services to Alibaba Cloud and manage related resources (FC, custom domains, SSL, DNS, CDN, logs, etc.). Returns stdout/stderr.',
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
      }
    },

    // Structured deploy workflow.
    licell_deploy: {
      name: 'licell_deploy',
      title: 'Deploy service (API/Static) to Aliyun',
      description:
        'Deploy current project. API deploys to Function Compute (FC 3.0); Static deploys to OSS hosting. Supports domain/SSL/CDN options.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          type: { type: 'string', enum: ['api', 'static'], description: 'Deployment type.' },
          runtime: { type: 'string', description: 'API runtime: nodejs20/nodejs22/python3.12/python3.13/docker; Static: static/statis.' },
          entry: { type: 'string', description: 'API entry file (default depends on runtime).' },
          dist: { type: 'string', description: 'Static site directory (default: dist).' },
          target: { type: 'string', description: 'FC alias target (e.g. prod/preview). API only.' },
          domain: { type: 'string', description: 'Full custom domain (e.g. api.example.com). API/Static supported; implies SSL. Static will auto-enable CDN.' },
          domainSuffix: { type: 'string', description: 'Domain suffix (e.g. example.com) to bind <appName>.<suffix>. API/Static supported.' },
          enableCdn: { type: 'boolean', description: 'Enable CDN after domain bind (API optional; Static with domain already auto-enables). Implies SSL.' },
          ssl: { type: 'boolean', description: "Enable HTTPS (Let's Encrypt). If domain/enableCdn is set, SSL is implied." },
          sslForceRenew: { type: 'boolean', description: 'Force renew certificate when SSL enabled.' },
          acrNamespace: { type: 'string', description: 'ACR namespace for docker runtime.' },
          enableVpc: { type: 'boolean', description: 'Enable VPC integration (API only).' },
          disableVpc: { type: 'boolean', description: 'Disable VPC integration (API only, public mode).' },
          memory: { type: 'number', description: 'Memory size (MB).' },
          vcpu: { type: 'number', description: 'vCPU cores (e.g. 0.5/1/2).' },
          instanceConcurrency: { type: 'number', description: 'Instance concurrency.' },
          timeout: { type: 'number', description: 'Timeout seconds.' },
          cwd: { type: 'string', description: 'Working directory relative to projectRoot (default: projectRoot).' },
          timeoutMs: { type: 'number', description: 'Command timeout in milliseconds.' }
        },
        required: ['type']
      }
    },

    licell_init: {
      name: 'licell_init',
      title: 'Initialize licell project',
      description:
        'Initialize current directory: write .licell/project.json, and optionally generate scaffold files for supported runtimes.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          runtime: { type: 'string', description: 'nodejs20/nodejs22/python3.12/python3.13/docker.' },
          app: { type: 'string', description: 'appName (FC functionName).' },
          force: { type: 'boolean', description: 'Overwrite/generate scaffold in non-empty dir.' },
          yes: { type: 'boolean', description: 'Non-interactive mode (recommended for MCP). Default true.' },
          cwd: { type: 'string', description: 'Working directory relative to projectRoot (default: projectRoot).' },
          timeoutMs: { type: 'number', description: 'Command timeout in milliseconds.' }
        }
      }
    },

    licell_release_promote: {
      name: 'licell_release_promote',
      title: 'Promote FC release (alias switch)',
      description: 'Publish (if needed) and switch an FC alias (e.g. prod/preview) to a version.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          versionId: { type: 'string', description: 'Optional versionId. If omitted, licell will publish current code or reuse latest published.' },
          target: { type: 'string', description: 'Alias target (default: prod).' },
          cwd: { type: 'string', description: 'Working directory relative to projectRoot (default: projectRoot).' },
          timeoutMs: { type: 'number', description: 'Command timeout in milliseconds.' }
        }
      }
    },

    licell_release_rollback: {
      name: 'licell_release_rollback',
      title: 'Rollback FC release (alias switch)',
      description: 'Switch an FC alias to a specific versionId.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          versionId: { type: 'string', description: 'VersionId to rollback to.' },
          target: { type: 'string', description: 'Alias target (default: prod).' },
          cwd: { type: 'string', description: 'Working directory relative to projectRoot (default: projectRoot).' },
          timeoutMs: { type: 'number', description: 'Command timeout in milliseconds.' }
        },
        required: ['versionId']
      }
    },

    licell_release_prune: {
      name: 'licell_release_prune',
      title: 'Prune FC historical versions (dangerous)',
      description: 'Preview or delete old FC published versions. Destructive when apply=true (requires yes=true).',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          keep: { type: 'number', description: 'Keep latest N versions (default 10).' },
          apply: { type: 'boolean', description: 'If true, perform deletion. If false/omitted, preview only.' },
          yes: { type: 'boolean', description: 'Required when apply=true (non-interactive double-confirm).' },
          cwd: { type: 'string', description: 'Working directory relative to projectRoot (default: projectRoot).' },
          timeoutMs: { type: 'number', description: 'Command timeout in milliseconds.' }
        }
      },
      annotations: { destructiveHint: true }
    },

    licell_fn_list: {
      name: 'licell_fn_list',
      title: 'List functions',
      description: 'List FC functions in current region.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          limit: { type: 'number', description: 'Max items (default 20).' },
          prefix: { type: 'string', description: 'Filter by function name prefix.' },
          cwd: { type: 'string' },
          timeoutMs: { type: 'number' }
        }
      }
    },

    licell_fn_info: {
      name: 'licell_fn_info',
      title: 'Get function info',
      description: 'Get FC function details.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string', description: 'Function name. If omitted, uses project appName.' },
          target: { type: 'string', description: 'Qualifier alias/version (e.g. prod/preview/1).' },
          cwd: { type: 'string' },
          timeoutMs: { type: 'number' }
        }
      }
    },

    licell_fn_invoke: {
      name: 'licell_fn_invoke',
      title: 'Invoke function',
      description: 'Invoke FC function synchronously with an optional payload.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string', description: 'Function name. If omitted, uses project appName.' },
          target: { type: 'string', description: 'Qualifier alias/version (e.g. prod/preview/1).' },
          payload: { type: 'string', description: 'Raw payload text.' },
          payloadJson: { type: 'object', description: 'JSON payload object (will be JSON.stringify-ed).', additionalProperties: true },
          cwd: { type: 'string' },
          timeoutMs: { type: 'number' }
        }
      }
    },

    licell_fn_rm: {
      name: 'licell_fn_rm',
      title: 'Remove function (dangerous)',
      description: 'Delete FC function. Destructive (requires yes=true).',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string', description: 'Function name. If omitted, uses project appName.' },
          force: { type: 'boolean', description: 'Cascade delete triggers/aliases/versions.' },
          yes: { type: 'boolean', description: 'Required in non-interactive mode.' },
          cwd: { type: 'string' },
          timeoutMs: { type: 'number' }
        }
      },
      annotations: { destructiveHint: true }
    },

    licell_domain_add: {
      name: 'licell_domain_add',
      title: 'Bind custom domain (and optional SSL)',
      description: 'Bind a custom domain to current FC app and optionally enable HTTPS.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          domain: { type: 'string', description: 'Full domain, e.g. api.example.com.' },
          ssl: { type: 'boolean', description: "Enable HTTPS (Let's Encrypt)." },
          sslForceRenew: { type: 'boolean', description: 'Force renew certificate.' },
          target: { type: 'string', description: 'Route to FC alias (prod/preview).' },
          cwd: { type: 'string' },
          timeoutMs: { type: 'number' }
        },
        required: ['domain']
      }
    },

    licell_domain_rm: {
      name: 'licell_domain_rm',
      title: 'Unbind custom domain (dangerous)',
      description: 'Unbind custom domain and cleanup DNS record. Destructive (requires yes=true).',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          domain: { type: 'string', description: 'Full domain, e.g. api.example.com.' },
          yes: { type: 'boolean', description: 'Required in non-interactive mode.' },
          cwd: { type: 'string' },
          timeoutMs: { type: 'number' }
        },
        required: ['domain']
      },
      annotations: { destructiveHint: true }
    },

    licell_dns_records_list: {
      name: 'licell_dns_records_list',
      title: 'List DNS records',
      description: 'List DNS records for a domain (Alidns).',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          domain: { type: 'string', description: 'Root domain, e.g. example.com.' },
          limit: { type: 'number', description: 'Max items (default 100).' },
          cwd: { type: 'string' },
          timeoutMs: { type: 'number' }
        },
        required: ['domain']
      }
    },

    licell_dns_records_add: {
      name: 'licell_dns_records_add',
      title: 'Add DNS record',
      description: 'Add a DNS record (Alidns).',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          domain: { type: 'string', description: 'Root domain, e.g. example.com.' },
          rr: { type: 'string', description: 'RR host, e.g. @/www/api.' },
          type: { type: 'string', description: 'Record type, e.g. A/CNAME/TXT.' },
          value: { type: 'string', description: 'Record value.' },
          ttl: { type: 'number', description: 'TTL seconds (default 600).' },
          line: { type: 'string', description: 'Line (default: default).' },
          cwd: { type: 'string' },
          timeoutMs: { type: 'number' }
        },
        required: ['domain', 'rr', 'type', 'value']
      }
    },

    licell_dns_records_rm: {
      name: 'licell_dns_records_rm',
      title: 'Remove DNS record (dangerous)',
      description: 'Remove a DNS record by recordId. Destructive (requires yes=true).',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          recordId: { type: 'string', description: 'RecordId from list.' },
          yes: { type: 'boolean', description: 'Required in non-interactive mode.' },
          cwd: { type: 'string' },
          timeoutMs: { type: 'number' }
        },
        required: ['recordId']
      },
      annotations: { destructiveHint: true }
    }
  } as const;

  const supportedProtocolVersions = ['2025-03-26', '2025-06-18', '2025-11-25'];
  let didInitialize = false;
  let negotiatedProtocolVersion = supportedProtocolVersions[supportedProtocolVersions.length - 1];

  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
  const inflight = new Set<Promise<unknown>>();

  const track = (p: Promise<unknown>) => {
    inflight.add(p);
    p.finally(() => inflight.delete(p)).catch(() => {
      // ignore
    });
  };

  const handleNotification = async (msg: JsonRpcNotification) => {
    if (debug) log(`[mcp] <= notification ${msg.method}`);
    // We currently don't require the initialized notification to proceed.
    if (msg.method === 'notifications/initialized') return;
    if (msg.method === 'exit') process.exit(0);
    // Ignore all other notifications.
  };

  const handleRequest = async (msg: JsonRpcRequest) => {
    const { id, method } = msg;
    if (debug) log(`[mcp] <= request ${method} id=${id}`);

    if (!didInitialize && method !== 'initialize' && method !== 'ping') {
      writeError(id, -32002, "Server not initialized. Call 'initialize' first.");
      return;
    }

    if (method === 'ping') {
      writeResult(id, {});
      return;
    }

    if (method === 'initialize') {
      const params = isRecord(msg.params) ? msg.params : {};
      const clientProtocol = typeof params.protocolVersion === 'string' ? params.protocolVersion : '';
      negotiatedProtocolVersion = clientProtocol || negotiatedProtocolVersion;
      didInitialize = true;

      writeResult(id, {
        protocolVersion: negotiatedProtocolVersion,
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: 'licell',
          version: options.serverVersion
        },
        instructions:
          `This MCP server is for deploying and managing services on Alibaba Cloud via licell, scoped to projectRoot.\n` +
          `Destructive commands require explicit --yes in non-interactive mode.`
      });
      return;
    }

    if (method === 'shutdown') {
      writeResult(id, null);
      return;
    }

    if (method === 'tools/list') {
      const tools: Record<string, unknown>[] = [];
      for (const spec of Object.values(toolSchemas)) {
        const tool: Record<string, unknown> = {
          name: spec.name,
          title: spec.title,
          description: spec.description,
          inputSchema: spec.inputSchema
        };
        if ('annotations' in spec && spec.annotations) {
          tool.annotations = spec.annotations;
        }
        // Back-compat for older MCP clients that used input_schema.
        if (negotiatedProtocolVersion < '2025-03-26') {
          tool.input_schema = spec.inputSchema;
        }
        tools.push(tool);
      }

      writeResult(id, { tools });
      return;
    }

    if (method === 'tools/call') {
      const params = isRecord(msg.params) ? msg.params : {};
      const name = typeof params.name === 'string' ? params.name : '';
      const toolArgs = isRecord(params.arguments) ? params.arguments : {};

      try {
        let argv: string[] | null = null;
        let cwd: unknown = toolArgs.cwd;
        let timeoutMs: unknown = toolArgs.timeoutMs;

        if (name === 'licell_cli') {
          const argvRaw = toolArgs.argv;
          if (!Array.isArray(argvRaw) || argvRaw.some((v) => typeof v !== 'string' || v.trim() === '')) {
            throw new Error('Invalid arguments: argv must be a non-empty string[]');
          }
          argv = argvRaw.map((v) => v.trim());
        } else if (name === 'licell_deploy') {
          const type = toOptionalString(toolArgs.type);
          if (type !== 'api' && type !== 'static') throw new Error('type must be "api" or "static"');
          argv = ['deploy', '--type', type];

          const runtime = toOptionalString(toolArgs.runtime);
          const entry = toOptionalString(toolArgs.entry);
          const dist = toOptionalString(toolArgs.dist);
          const target = toOptionalString(toolArgs.target);
          const domain = toOptionalString(toolArgs.domain);
          const domainSuffix = toOptionalString(toolArgs.domainSuffix);
          const acrNamespace = toOptionalString(toolArgs.acrNamespace);

          const enableCdn = toOptionalBoolean(toolArgs.enableCdn);
          const ssl = toOptionalBoolean(toolArgs.ssl);
          const sslForceRenew = toOptionalBoolean(toolArgs.sslForceRenew);
          const enableVpc = toOptionalBoolean(toolArgs.enableVpc);
          const disableVpc = toOptionalBoolean(toolArgs.disableVpc);

          const memory = toOptionalNumber(toolArgs.memory);
          const vcpu = toOptionalNumber(toolArgs.vcpu);
          const instanceConcurrency = toOptionalNumber(toolArgs.instanceConcurrency);
          const timeoutSeconds = toOptionalNumber(toolArgs.timeout);

          if (runtime) argv.push('--runtime', runtime);
          if (entry) argv.push('--entry', entry);
          if (dist) argv.push('--dist', dist);
          if (target) argv.push('--target', target);
          if (domain) argv.push('--domain', domain);
          if (domainSuffix) argv.push('--domain-suffix', domainSuffix);
          if (enableCdn) argv.push('--enable-cdn');
          if (ssl) argv.push('--ssl');
          if (sslForceRenew) argv.push('--ssl-force-renew');
          if (acrNamespace) argv.push('--acr-namespace', acrNamespace);
          if (enableVpc) argv.push('--enable-vpc');
          if (disableVpc) argv.push('--disable-vpc');
          if (memory !== undefined) argv.push('--memory', String(memory));
          if (vcpu !== undefined) argv.push('--vcpu', String(vcpu));
          if (instanceConcurrency !== undefined) argv.push('--instance-concurrency', String(instanceConcurrency));
          if (timeoutSeconds !== undefined) argv.push('--timeout', String(timeoutSeconds));
        } else if (name === 'licell_init') {
          argv = ['init'];
          const runtime = toOptionalString(toolArgs.runtime);
          const app = toOptionalString(toolArgs.app);
          const force = toOptionalBoolean(toolArgs.force);
          const yes = toOptionalBoolean(toolArgs.yes);
          if (runtime) argv.push('--runtime', runtime);
          if (app) argv.push('--app', app);
          if (force) argv.push('--force');
          // Default to --yes in MCP to avoid prompts.
          if (yes !== false) argv.push('--yes');
        } else if (name === 'licell_release_promote') {
          const versionId = toOptionalString(toolArgs.versionId);
          const target = toOptionalString(toolArgs.target);
          argv = ['release', 'promote'];
          if (versionId) argv.push(versionId);
          if (target) argv.push('--target', target);
        } else if (name === 'licell_release_rollback') {
          const versionId = toOptionalString(toolArgs.versionId);
          if (!versionId) throw new Error('versionId is required');
          const target = toOptionalString(toolArgs.target);
          argv = ['release', 'rollback', versionId];
          if (target) argv.push('--target', target);
        } else if (name === 'licell_release_prune') {
          const keep = toOptionalNumber(toolArgs.keep);
          const apply = toOptionalBoolean(toolArgs.apply);
          const yes = toOptionalBoolean(toolArgs.yes);
          argv = ['release', 'prune'];
          if (keep !== undefined) argv.push('--keep', String(keep));
          if (apply) {
            assertTrue(yes, 'apply=true is destructive; set yes=true to confirm');
            argv.push('--apply', '--yes');
          }
        } else if (name === 'licell_fn_list') {
          argv = ['fn', 'list'];
          const limit = toOptionalNumber(toolArgs.limit);
          const prefix = toOptionalString(toolArgs.prefix);
          if (limit !== undefined) argv.push('--limit', String(limit));
          if (prefix) argv.push('--prefix', prefix);
        } else if (name === 'licell_fn_info') {
          argv = ['fn', 'info'];
          const fnName = toOptionalString(toolArgs.name);
          const target = toOptionalString(toolArgs.target);
          if (fnName) argv.push(fnName);
          if (target) argv.push('--target', target);
        } else if (name === 'licell_fn_invoke') {
          argv = ['fn', 'invoke'];
          const fnName = toOptionalString(toolArgs.name);
          const target = toOptionalString(toolArgs.target);
          const payload = toOptionalString(toolArgs.payload);
          const payloadJson = toolArgs.payloadJson;
          if (payload && payloadJson !== undefined) throw new Error('Provide only one of payload or payloadJson');
          if (fnName) argv.push(fnName);
          if (target) argv.push('--target', target);
          if (payload) argv.push('--payload', payload);
          if (payloadJson !== undefined) {
            argv.push('--payload', JSON.stringify(payloadJson));
          }
        } else if (name === 'licell_fn_rm') {
          argv = ['fn', 'rm'];
          const fnName = toOptionalString(toolArgs.name);
          const force = toOptionalBoolean(toolArgs.force);
          const yes = toOptionalBoolean(toolArgs.yes);
          assertTrue(yes, 'fn rm is destructive; set yes=true to confirm');
          if (fnName) argv.push(fnName);
          if (force) argv.push('--force');
          argv.push('--yes');
        } else if (name === 'licell_domain_add') {
          const domain = toOptionalString(toolArgs.domain);
          if (!domain) throw new Error('domain is required');
          const target = toOptionalString(toolArgs.target);
          const ssl = toOptionalBoolean(toolArgs.ssl);
          const sslForceRenew = toOptionalBoolean(toolArgs.sslForceRenew);
          argv = ['domain', 'add', domain];
          if (ssl) argv.push('--ssl');
          if (sslForceRenew) argv.push('--ssl-force-renew');
          if (target) argv.push('--target', target);
        } else if (name === 'licell_domain_rm') {
          const domain = toOptionalString(toolArgs.domain);
          if (!domain) throw new Error('domain is required');
          const yes = toOptionalBoolean(toolArgs.yes);
          assertTrue(yes, 'domain rm is destructive; set yes=true to confirm');
          argv = ['domain', 'rm', domain, '--yes'];
        } else if (name === 'licell_dns_records_list') {
          const domain = toOptionalString(toolArgs.domain);
          if (!domain) throw new Error('domain is required');
          const limit = toOptionalNumber(toolArgs.limit);
          argv = ['dns', 'records', 'list', domain];
          if (limit !== undefined) argv.push('--limit', String(limit));
        } else if (name === 'licell_dns_records_add') {
          const domain = toOptionalString(toolArgs.domain);
          const rr = toOptionalString(toolArgs.rr);
          const type = toOptionalString(toolArgs.type);
          const value = toOptionalString(toolArgs.value);
          if (!domain || !rr || !type || !value) throw new Error('domain, rr, type, value are required');
          const ttl = toOptionalNumber(toolArgs.ttl);
          const line = toOptionalString(toolArgs.line);
          argv = ['dns', 'records', 'add', domain, '--rr', rr, '--type', type, '--value', value];
          if (ttl !== undefined) argv.push('--ttl', String(ttl));
          if (line) argv.push('--line', line);
        } else if (name === 'licell_dns_records_rm') {
          const recordId = toOptionalString(toolArgs.recordId);
          if (!recordId) throw new Error('recordId is required');
          const yes = toOptionalBoolean(toolArgs.yes);
          assertTrue(yes, 'dns records rm is destructive; set yes=true to confirm');
          argv = ['dns', 'records', 'rm', recordId, '--yes'];
        } else {
          throw new Error(`Unknown tool: ${name}`);
        }

        if (!argv) throw new Error(`Unknown tool: ${name}`);

        if (debug) log(`[mcp] tool ${name} starting...`);
        const run = await runLicellCliTool({
          projectRoot: options.projectRoot,
          argv,
          cwd,
          timeoutMs
        });
        if (debug) log(`[mcp] tool ${name} done (exit=${run.exitCode}, timedOut=${run.timedOut})`);

        writeResult(id, toToolCallResult(run));
      } catch (err: unknown) {
        writeResult(id, {
          isError: true,
          content: [{ type: 'text', text: formatErrorMessage(err) }]
        });
      }
      return;
    }

    writeError(id, -32601, `Method not found: ${method}`);
  };

  const handleOne = (raw: unknown) => {
    if (!isRecord(raw) || raw.jsonrpc !== '2.0') {
      writeError(null, -32600, 'Invalid Request');
      return;
    }
    if (typeof raw.method !== 'string') {
      writeError((raw as { id?: JsonRpcId }).id ?? null, -32600, 'Invalid Request');
      return;
    }

    const method = raw.method;
    const id = (raw as { id?: unknown }).id;
    const hasId = id !== undefined && id !== null;

    if (hasId) {
      track(
        handleRequest(raw as JsonRpcRequest).catch((err) => log(`[mcp] request handler error: ${formatErrorMessage(err)}`))
      );
      return;
    }

    track(
      handleNotification(raw as JsonRpcNotification).catch((err) => log(`[mcp] notification handler error: ${formatErrorMessage(err)}`))
    );
  };

  rl.on('line', (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed) as unknown;
    } catch (err: unknown) {
      writeError(null, -32700, 'Parse error', { message: formatErrorMessage(err) });
      return;
    }

    if (Array.isArray(parsed)) {
      // JSON-RPC batching was removed in newer MCP revisions, but we tolerate it for compatibility.
      // We intentionally respond one message per line to keep implementation simple.
      for (const item of parsed) handleOne(item);
      return;
    }

    handleOne(parsed);
  });

  log(`[mcp] server started: ${options.serverTitle} (projectRoot=${options.projectRoot}, protocol=${negotiatedProtocolVersion})`);

  await new Promise<void>((resolveClose) => rl.once('close', resolveClose));

  if (inflight.size > 0) {
    // If stdin closes (e.g. the host terminates), allow a short grace period to flush responses.
    await Promise.race([
      Promise.allSettled([...inflight]).then(() => undefined),
      new Promise<void>((resolve) => setTimeout(resolve, 2_000))
    ]);
  }
}
