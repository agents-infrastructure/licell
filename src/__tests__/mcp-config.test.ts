import { describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { ensureGlobalCodexMcpConfig, ensureMcpJsonConfig } from '../commands/mcp';

function makeTmpDir() {
  return mkdtempSync(join(tmpdir(), 'licell-mcp-'));
}

describe('ensureMcpJsonConfig', () => {
  it('creates .mcp.json when missing', () => {
    const dir = makeTmpDir();
    try {
      const { configPath, updated } = ensureMcpJsonConfig({ projectRoot: dir, serverName: 'licell' });
      expect(updated).toBe(true);
      expect(configPath).toBe(join(dir, '.mcp.json'));
      expect(existsSync(configPath)).toBe(true);

      const raw = JSON.parse(readFileSync(configPath, 'utf8')) as any;
      expect(raw.mcpServers.licell).toEqual({ command: 'licell', args: ['mcp', 'serve'] });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('merges into existing .mcp.json', () => {
    const dir = makeTmpDir();
    try {
      const configPath = join(dir, '.mcp.json');
      writeFileSync(
        configPath,
        JSON.stringify(
          {
            mcpServers: {
              other: { command: 'node', args: ['server.js'] }
            }
          },
          null,
          2
        )
      );

      const res = ensureMcpJsonConfig({ projectRoot: dir, serverName: 'licell' });
      expect(res.updated).toBe(true);

      const raw = JSON.parse(readFileSync(configPath, 'utf8')) as any;
      expect(raw.mcpServers.other).toEqual({ command: 'node', args: ['server.js'] });
      expect(raw.mcpServers.licell).toEqual({ command: 'licell', args: ['mcp', 'serve'] });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('is a no-op when already configured', () => {
    const dir = makeTmpDir();
    try {
      const configPath = join(dir, '.mcp.json');
      writeFileSync(
        configPath,
        JSON.stringify(
          {
            mcpServers: {
              licell: { command: 'licell', args: ['mcp', 'serve'] }
            }
          },
          null,
          2
        )
      );

      const before = readFileSync(configPath, 'utf8');
      const res = ensureMcpJsonConfig({ projectRoot: dir, serverName: 'licell' });
      const after = readFileSync(configPath, 'utf8');

      expect(res.updated).toBe(false);
      expect(after).toBe(before);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('ensureGlobalCodexMcpConfig', () => {
  it('creates ~/.codex/config.toml when missing', () => {
    const dir = makeTmpDir();
    const originalHome = process.env.HOME;
    process.env.HOME = dir;
    try {
      const { configPath, updated } = ensureGlobalCodexMcpConfig();
      expect(updated).toBe(true);
      expect(configPath).toBe(join(dir, '.codex', 'config.toml'));
      expect(existsSync(configPath)).toBe(true);

      const raw = readFileSync(configPath, 'utf8');
      expect(raw).toContain('[mcp_servers.licell]');
      expect(raw).toContain('command = "licell"');
      expect(raw).toContain('args = ["mcp", "serve"]');
    } finally {
      process.env.HOME = originalHome;
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('merges into existing ~/.codex/config.toml', () => {
    const dir = makeTmpDir();
    const originalHome = process.env.HOME;
    process.env.HOME = dir;
    try {
      const configPath = join(dir, '.codex', 'config.toml');
      mkdirSync(join(dir, '.codex'), { recursive: true });
      writeFileSync(
        configPath,
        [
          'model_provider = "openai"',
          '',
          '[mcp_servers.aliyun-container]',
          'command = "npx"',
          'args = ["mcp-remote-alibaba-cloud"]',
          ''
        ].join('\n')
      );

      const res = ensureGlobalCodexMcpConfig();
      expect(res.updated).toBe(true);

      const raw = readFileSync(configPath, 'utf8');
      expect(raw).toContain('model_provider = "openai"');
      expect(raw).toContain('[mcp_servers.aliyun-container]');
      expect(raw).toContain('[mcp_servers.licell]');
      expect(raw).toContain('command = "licell"');
      expect(raw).toContain('args = ["mcp", "serve"]');
    } finally {
      process.env.HOME = originalHome;
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('is a no-op when licell table already exists', () => {
    const dir = makeTmpDir();
    const originalHome = process.env.HOME;
    process.env.HOME = dir;
    try {
      const configPath = join(dir, '.codex', 'config.toml');
      mkdirSync(join(dir, '.codex'), { recursive: true });
      writeFileSync(
        configPath,
        [
          'model_provider = "openai"',
          '',
          '[mcp_servers.licell]',
          'command = "licell"',
          'args = ["mcp", "serve"]',
          ''
        ].join('\n')
      );

      const before = readFileSync(configPath, 'utf8');
      const res = ensureGlobalCodexMcpConfig();
      const after = readFileSync(configPath, 'utf8');

      expect(res.updated).toBe(false);
      expect(after).toBe(before);
    } finally {
      process.env.HOME = originalHome;
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
