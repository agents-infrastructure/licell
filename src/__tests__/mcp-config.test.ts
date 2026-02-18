import { describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { ensureMcpJsonConfig } from '../commands/mcp';

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

