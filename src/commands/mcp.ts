import type { CAC } from 'cac';
import pc from 'picocolors';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { runLicellMcpServer } from '../mcp/server';
import { resolveCliVersion } from '../utils/version';

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

      if (!act) {
        const { configPath, updated } = ensureMcpJsonConfig({ projectRoot, serverName });
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
        console.log(pc.green(`✅ 已写入 MCP 配置: ${configPath}${updated ? '' : ' (no changes)'}`));
        console.log(pc.gray('下一步：在支持 MCP 的客户端中启用该项目的 .mcp.json（例如 Claude Code）。'));
        return;
      }

      if (act === 'serve') {
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
