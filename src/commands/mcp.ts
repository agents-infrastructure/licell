import type { CAC } from 'cac';
import { defineCommandModule, commandInvocation, defineCliCommand, registerCliCommand } from './module';
import pc from 'picocolors';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { ensureAuthReadyForCommand, ensureAuthCapabilityPreflight, type AuthCapability } from '../utils/auth-recovery';
import { isInteractiveTTY } from '../utils/cli-shared';
import { resolveCliVersion } from '../utils/version';
import { emitCommandResult, isJsonOutput } from '../utils/output';
import { AUTOMATION_SECTION } from './sections';

const MCP_OPERATION_CAPABILITIES: AuthCapability[] = [
  'fc',
  'dns',
  'oss',
  'rds',
  'redis',
  'cdn',
  'vpc',
  'cr',
  'logs'
];

const mcpCommand = defineCliCommand({
  rawName: 'mcp',
  description: 'MCP：让 Agent 通过 licell 执行部署/发布/运维（默认先初始化，再启动 stdio server）',
  options: [
    { rawName: '--project-root <path>', description: '项目根目录（默认当前目录）' },
    { rawName: '--server-name <name>', description: '写入 .mcp.json 的 server 名称（默认 licell）' }
  ],
  descriptor: {
    summary: '为 Agent 生成 MCP 配置，或启动 licell MCP stdio server。',
    notes: ['裸 `licell mcp` 会先准备 `.mcp.json`，再直接启动 stdio server。'],
    optionInsights: {
      '--project-root': { whenToUse: '目标项目不是当前目录时使用。', cautions: ['`.mcp.json` 会写入该目录。'] },
      '--server-name': { whenToUse: '需要在 `.mcp.json` 中使用自定义 server key 时使用。', cautions: ['仅对 `mcp` / `mcp init` 生效。'] }
    },
    recommendedFlow: [
      { title: '写入项目配置', command: 'licell mcp init', reason: '先生成或更新 `.mcp.json`。' },
      { title: '在支持的客户端启用配置', reason: '例如 Claude Code / Codex 读取项目 MCP 配置。' },
      { title: '需要手动调试时再启动', command: 'licell mcp serve', reason: '以 stdio JSON-RPC 模式启动 server。' }
    ],
    taskHints: [
      {
        phase: 'mutate',
        title: '给当前项目接入 MCP',
        description: '先生成 `.mcp.json`，让支持 MCP 的 Agent 可以直接发现并调用 licell。',
        commands: ['licell mcp init']
      },
      {
        phase: 'verify',
        title: '手动调试 MCP server',
        description: '只在需要排查 stdio JSON-RPC 行为时，直接启动 serve。',
        commands: ['licell mcp serve']
      }
    ],
    examples: ['licell mcp init', 'licell mcp serve', 'licell mcp --project-root .'],
    agentTips: ['查看帮助或执行 `mcp init` 时可用 `--output json` 获取结构化结果。']
  }
});

const mcpInitCommand = defineCliCommand({
  rawName: 'mcp init',
  description: '写入/更新项目内 `.mcp.json` 配置',
  options: [
    { rawName: '--project-root <path>', description: '项目根目录（默认当前目录）' },
    { rawName: '--server-name <name>', description: '写入 .mcp.json 的 server 名称（默认 licell）' }
  ],
  descriptor: {
    summary: '写入/更新项目内 `.mcp.json` 配置。',
    optionInsights: {
      '--project-root': { whenToUse: '目标项目不是当前目录时使用。', cautions: ['`.mcp.json` 会写入该目录。'] },
      '--server-name': { whenToUse: '需要在 `.mcp.json` 中使用自定义 server key 时使用。', cautions: ['应与调用方的 MCP client 配置保持一致。'] }
    },
    examples: ['licell mcp init', 'licell mcp init --project-root .', 'licell mcp init --server-name licell-preview'],
    agentTips: ['推荐在自动化场景下用 `--output json` 获取 configPath / updated 状态。']
  }
});

const mcpServeCommand = defineCliCommand({
  rawName: 'mcp serve',
  description: '以 stdio 方式启动 licell MCP server',
  options: [
    { rawName: '--project-root <path>', description: '项目根目录（默认当前目录）' }
  ],
  descriptor: {
    summary: '以 stdio JSON-RPC 方式启动 licell MCP server。',
    notes: ['`mcp serve` 使用 stdio JSON-RPC 协议，不支持 `--output json`。'],
    examples: ['licell mcp serve', 'licell mcp serve --project-root .'],
    agentTips: ['真正启动 MCP server 时不要传 `--output json`，否则会破坏 stdio JSON-RPC 输出。']
  }
});

function readJsonFile(filePath: string): unknown {
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function writeJsonFile(filePath: string, data: unknown) {
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, { encoding: 'utf8' });
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseSimpleTomlStringArray(sectionText: string, key: string): string[] | null {
  const keyPattern = new RegExp(`^[ \\t]*${escapeRegExp(key)}[ \\t]*=[ \\t]*\\[([\\s\\S]*?)\\][ \\t]*$`, 'm');
  const match = sectionText.match(keyPattern);
  if (!match) return null;
  const inner = match[1];
  const parts = inner
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const quoted = part.match(/^"(.*)"$/);
      return quoted ? quoted[1] : part;
    });
  return parts;
}

function findTomlTableRange(content: string, tableName: string): { start: number; end: number } | null {
  const headerPattern = new RegExp(`^[ \\t]*\\[${escapeRegExp(tableName)}\\][ \\t]*$`, 'm');
  const headerMatch = content.match(headerPattern);
  if (!headerMatch || headerMatch.index === undefined) return null;

  const headerStart = headerMatch.index;
  const headerLineEnd = content.indexOf('\n', headerStart);
  const bodyStart = headerLineEnd === -1 ? content.length : headerLineEnd + 1;

  const nextTableMatch = content.slice(bodyStart).match(/^[ \t]*\[[^\]]+\][ \t]*$/m);
  const tableEnd = nextTableMatch && nextTableMatch.index !== undefined
    ? bodyStart + nextTableMatch.index
    : content.length;

  return { start: headerStart, end: tableEnd };
}

function isCodexMcpTableConfigured(tableText: string): boolean {
  const commandMatch = tableText.match(/^[ \t]*command[ \t]*=[ \t]*"([^"]+)"[ \t]*$/m);
  if (!commandMatch || commandMatch[1] !== 'licell') return false;

  const args = parseSimpleTomlStringArray(tableText, 'args');
  if (!args || args.length !== 2) return false;
  return args[0] === 'mcp' && args[1] === 'serve';
}

function renderCodexMcpTable(serverName: string): string {
  return `[mcp_servers.${serverName}]
command = "licell"
args = ["mcp", "serve"]
`;
}

export function ensureMcpJsonConfig(options: { projectRoot: string; serverName: string }) {
  const configPath = join(options.projectRoot, '.mcp.json');
  const existingRaw = readJsonFile(configPath);

  const config: Record<string, unknown> = isRecord(existingRaw) ? { ...existingRaw } : {};
  const mcpServersRaw = isRecord(config.mcpServers) ? config.mcpServers : {};
  const mcpServers: Record<string, unknown> = { ...mcpServersRaw };

  const nextEntry = {
    command: 'licell',
    args: ['mcp', 'serve']
  };

  const currentEntry = mcpServers[options.serverName];
  if (JSON.stringify(currentEntry) === JSON.stringify(nextEntry)) {
    return { configPath, updated: false };
  }

  mcpServers[options.serverName] = nextEntry;
  config.mcpServers = mcpServers;
  writeJsonFile(configPath, config);
  return { configPath, updated: true };
}

export function ensureGlobalClaudeMcpConfig(options?: { serverName?: string }) {
  const serverName = options?.serverName || 'licell';
  const configPath = join(homedir(), '.claude', 'settings.local.json');
  const configDir = dirname(configPath);
  if (!existsSync(configDir)) mkdirSync(configDir, { recursive: true });

  const existingRaw = readJsonFile(configPath);
  const config: Record<string, unknown> = isRecord(existingRaw) ? { ...existingRaw } : {};
  const mcpServersRaw = isRecord(config.mcpServers) ? config.mcpServers : {};
  const mcpServers: Record<string, unknown> = { ...mcpServersRaw };

  const nextEntry = {
    command: 'licell',
    args: ['mcp', 'serve']
  };

  const currentEntry = mcpServers[serverName];
  if (JSON.stringify(currentEntry) === JSON.stringify(nextEntry)) {
    return { configPath, updated: false };
  }

  mcpServers[serverName] = nextEntry;
  config.mcpServers = mcpServers;
  writeJsonFile(configPath, config);
  return { configPath, updated: true };
}

export function ensureGlobalCodexMcpConfig(options?: { serverName?: string }) {
  const serverName = options?.serverName || 'licell';
  const configPath = join(homedir(), '.codex', 'config.toml');
  const configDir = dirname(configPath);
  if (!existsSync(configDir)) mkdirSync(configDir, { recursive: true });

  const existing = existsSync(configPath) ? readFileSync(configPath, 'utf8') : '';
  const tableName = `mcp_servers.${serverName}`;
  const nextTable = renderCodexMcpTable(serverName);
  const range = findTomlTableRange(existing, tableName);

  if (range) {
    const currentTable = existing.slice(range.start, range.end);
    if (isCodexMcpTableConfigured(currentTable)) {
      return { configPath, updated: false };
    }
    const nextContent = `${existing.slice(0, range.start)}${nextTable}${existing.slice(range.end)}`;
    writeFileSync(configPath, nextContent, 'utf8');
    return { configPath, updated: true };
  }

  const prefix = existing.trimEnd();
  const nextContent = prefix.length > 0
    ? `${prefix}\n\n${nextTable}`
    : nextTable;

  writeFileSync(configPath, nextContent, 'utf8');
  return { configPath, updated: true };
}

function resolveMcpOptions(options: { projectRoot?: unknown; serverName?: unknown }) {
  const projectRoot = typeof options.projectRoot === 'string' && options.projectRoot.trim()
    ? options.projectRoot.trim()
    : process.cwd();
  const serverName = typeof options.serverName === 'string' && options.serverName.trim()
    ? options.serverName.trim()
    : 'licell';
  return { projectRoot, serverName };
}

async function runMcpInit(options: { projectRoot?: unknown; serverName?: unknown }) {
  const { projectRoot, serverName } = resolveMcpOptions(options);
  const { configPath, updated } = ensureMcpJsonConfig({ projectRoot, serverName });
  if (isJsonOutput()) {
    emitCommandResult({
      action: 'init',
      configPath,
      updated
    }, { stage: 'mcp' });
  } else {
    console.log(pc.green(`✅ 已写入 MCP 配置: ${configPath}${updated ? '' : ' (no changes)'}`));
    console.log(pc.gray('下一步：在支持 MCP 的客户端中启用该项目的 .mcp.json（例如 Claude Code）。'));
  }
}

async function runMcpServe(options: { projectRoot?: unknown }) {
  if (isJsonOutput()) {
    throw new Error('mcp serve 使用 stdio JSON-RPC 协议，不支持 --output json');
  }
  const { runLicellMcpServer } = await import('../mcp/server');
  const projectRoot = typeof options.projectRoot === 'string' && options.projectRoot.trim()
    ? options.projectRoot.trim()
    : process.cwd();
  const interactiveTTY = isInteractiveTTY();
  await ensureAuthReadyForCommand({ commandLabel: commandInvocation(mcpServeCommand), interactiveTTY });
  await ensureAuthCapabilityPreflight({
    commandLabel: commandInvocation(mcpServeCommand),
    interactiveTTY,
    requiredCapabilities: MCP_OPERATION_CAPABILITIES
  });
  await runLicellMcpServer({
    projectRoot,
    serverVersion: resolveCliVersion(),
    serverTitle: `licell ${resolveCliVersion()}`
  });
}

async function runMcpBootstrap(options: { projectRoot?: unknown; serverName?: unknown }) {
  const { projectRoot, serverName } = resolveMcpOptions(options);
  const interactiveTTY = isInteractiveTTY();
  await ensureAuthReadyForCommand({ commandLabel: commandInvocation(mcpCommand), interactiveTTY });
  await ensureAuthCapabilityPreflight({
    commandLabel: commandInvocation(mcpCommand),
    interactiveTTY,
    requiredCapabilities: MCP_OPERATION_CAPABILITIES
  });
  const { configPath, updated } = ensureMcpJsonConfig({ projectRoot, serverName });
  if (isJsonOutput()) {
    emitCommandResult({
      action: 'init',
      configPath,
      updated,
      next: 'run `licell mcp serve` without --output json to start stdio server'
    }, { stage: 'mcp' });
    return;
  }
  console.log(pc.green(`✅ MCP 配置已就绪: ${configPath}${updated ? ' (updated)' : ''}`));
  console.log(pc.gray('现在启动 MCP 服务（stdio）。用于 Claude Code/Cursor 等客户端时，请在 .mcp.json 中使用 args: ["mcp","serve"]。'));
  console.log(pc.gray('提示：删除/清理类命令在 MCP 非交互模式下仍需要显式传 --yes。'));
  console.log('');
  await runMcpServe({ projectRoot });
}

export function registerMcpCommand(cli: CAC) {
  registerCliCommand(cli, mcpCommand)
    .action(async (options: { projectRoot?: unknown; serverName?: unknown }) => {
      await runMcpBootstrap(options);
    });

  registerCliCommand(cli, mcpInitCommand)
    .action(async (options: { projectRoot?: unknown; serverName?: unknown }) => {
      await runMcpInit(options);
    });

  registerCliCommand(cli, mcpServeCommand)
    .action(async (options: { projectRoot?: unknown }) => {
      await runMcpServe(options);
    });
}

export const mcpCommandModule = defineCommandModule({
  section: AUTOMATION_SECTION,
  register: registerMcpCommand,
  commands: [mcpCommand, mcpInitCommand, mcpServeCommand]
});
