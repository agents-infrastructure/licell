import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { isAbsolute, resolve } from 'path';
import { formatErrorMessage } from '../utils/errors';
import { extractJsonRecordsFromOutput } from '../utils/output';
import { buildArgvForGeneratedMcpCommandTool, buildGeneratedMcpCommandTools } from './generated-command-tools';
import { getCuratedMcpCommandTools } from './curated-command-tools';
import { getBuiltinMcpTools } from './builtin-tools';

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

function hasOutputOption(argv: string[]) {
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--') break;
    if (token === '--output') return true;
    if (token.startsWith('--output=')) return true;
  }
  return false;
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
  const cliArgs = hasOutputOption(options.argv)
    ? [...options.argv]
    : [...options.argv, '--output', 'json'];
  const args = [...baseArgs, ...cliArgs];

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

function toDataToolCallResult(structuredContent: unknown, text: string) {
  return {
    isError: false,
    content: [{ type: 'text', text }],
    structuredContent
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
    stderrTruncated: run.stderr.truncated,
    records: extractJsonRecordsFromOutput(run.stdout.text)
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
  const builtinToolSchemas = getBuiltinMcpTools();
  const generatedToolSchemas = buildGeneratedMcpCommandTools();
  const curatedToolSchemas = getCuratedMcpCommandTools();

  const toolSchemas = {
    ...builtinToolSchemas,
    ...generatedToolSchemas,
    ...curatedToolSchemas
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
        if ('metadata' in spec && spec.metadata) {
          tool.metadata = spec.metadata;
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

        const builtinTool = builtinToolSchemas[name];
        const generatedTool = generatedToolSchemas[name];
        const curatedTool = curatedToolSchemas[name];

        if (builtinTool) {
          const execution = builtinTool.execute(toolArgs);
          if (execution.kind === 'data') {
            writeResult(id, toDataToolCallResult(execution.structuredContent, execution.text));
            return;
          }
          argv = execution.argv;
        } else if (generatedTool) {
          argv = buildArgvForGeneratedMcpCommandTool(generatedTool, toolArgs);
        } else if (curatedTool) {
          argv = curatedTool.buildArgv(toolArgs);
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
