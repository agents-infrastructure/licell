import type { CAC } from 'cac';
import pc from 'picocolors';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { runLicellMcpServer } from '../mcp/server';
import { ensureAuthReadyForCommand, ensureAuthCapabilityPreflight, type AuthCapability } from '../utils/auth-recovery';
import { isInteractiveTTY } from '../utils/cli-shared';
import { resolveCliVersion } from '../utils/version';
import { emitCliResult, isJsonOutput } from '../utils/output';

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

export function registerMcpCommand(cli: CAC) {
  cli.command('mcp [action]', 'MCP：让 Agent 通过 licell 执行部署/发布/运维（初始化 .mcp.json 或启动 stdio server）')
    .option('--project-root <path>', '项目根目录（默认当前目录）')
    .option('--server-name <name>', '写入 .mcp.json 的 server 名称（默认 licell）')
    .action(async (action: string | undefined, options: { projectRoot?: unknown; serverName?: unknown }) => {
      const act = (action || '').trim().toLowerCase();
      const projectRoot = typeof options.projectRoot === 'string' && options.projectRoot.trim()
        ? options.projectRoot.trim()
        : process.cwd();
      const serverName = typeof options.serverName === 'string' && options.serverName.trim()
        ? options.serverName.trim()
        : 'licell';
      const interactiveTTY = isInteractiveTTY();

      if (!act) {
        await ensureAuthReadyForCommand({ commandLabel: 'licell mcp', interactiveTTY });
        await ensureAuthCapabilityPreflight({
          commandLabel: 'licell mcp',
          interactiveTTY,
          requiredCapabilities: MCP_OPERATION_CAPABILITIES
        });
        const { configPath, updated } = ensureMcpJsonConfig({ projectRoot, serverName });
        if (isJsonOutput()) {
          emitCliResult({
            stage: 'mcp',
            action: 'init',
            configPath,
            updated,
            next: 'run `licell mcp serve` without --output json to start stdio server'
          });
          return;
        }
        console.log(pc.green(`✅ MCP 配置已就绪: ${configPath}${updated ? ' (updated)' : ''}`));
        console.log(pc.gray('现在启动 MCP 服务（stdio）。用于 Claude Code/Cursor 等客户端时，请在 .mcp.json 中使用 args: ["mcp","serve"]。'));
        console.log(pc.gray('提示：删除/清理类命令在 MCP 非交互模式下仍需要显式传 --yes。'));
        console.log('');
        await runLicellMcpServer({
          projectRoot,
          serverVersion: resolveCliVersion(),
          serverTitle: `licell ${resolveCliVersion()}`
        });
        return;
      }

      if (act === 'init') {
        const { configPath, updated } = ensureMcpJsonConfig({ projectRoot, serverName });
        if (isJsonOutput()) {
          emitCliResult({
            stage: 'mcp',
            action: 'init',
            configPath,
            updated
          });
        } else {
          console.log(pc.green(`✅ 已写入 MCP 配置: ${configPath}${updated ? '' : ' (no changes)'}`));
          console.log(pc.gray('下一步：在支持 MCP 的客户端中启用该项目的 .mcp.json（例如 Claude Code）。'));
        }
        return;
      }

      if (act === 'serve') {
        if (isJsonOutput()) {
          throw new Error('mcp serve 使用 stdio JSON-RPC 协议，不支持 --output json');
        }
        await ensureAuthReadyForCommand({ commandLabel: 'licell mcp serve', interactiveTTY });
        await ensureAuthCapabilityPreflight({
          commandLabel: 'licell mcp serve',
          interactiveTTY,
          requiredCapabilities: MCP_OPERATION_CAPABILITIES
        });
        // IMPORTANT: In stdio transport, stdout must remain pure JSON-RPC messages.
        // Use stderr for logs.
        await runLicellMcpServer({
          projectRoot,
          serverVersion: resolveCliVersion(),
          serverTitle: `licell ${resolveCliVersion()}`
        });
        return;
      }

      throw new Error(`未知 mcp action: ${action || ''}（支持: init / serve）`);
    });
}
