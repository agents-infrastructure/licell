import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cac } from 'cac';

const { emitCommandResultMock, inspectAcrScanMock, listAcrInstancesMock, listAcrNamespacesMock, listAcrRepositoriesMock, listAcrTagsMock } = vi.hoisted(() => ({
  emitCommandResultMock: vi.fn(), inspectAcrScanMock: vi.fn(), listAcrInstancesMock: vi.fn(), listAcrNamespacesMock: vi.fn(), listAcrRepositoriesMock: vi.fn(), listAcrTagsMock: vi.fn()
}));

vi.mock('../providers/cr-inventory', () => ({
  inspectAcrScan: inspectAcrScanMock,
  listAcrInstances: listAcrInstancesMock,
  listAcrNamespaces: listAcrNamespacesMock,
  listAcrRepositories: listAcrRepositoriesMock,
  listAcrTags: listAcrTagsMock
}));
vi.mock('../utils/auth-recovery', () => ({ executeWithAuthRecovery: vi.fn(async (_options: unknown, task: () => Promise<unknown>) => task()) }));
vi.mock('../utils/cli-shared', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../utils/cli-shared')>()), ensureAuthOrExit: vi.fn(), isInteractiveTTY: vi.fn(() => false)
}));
vi.mock('../utils/output', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../utils/output')>()), emitCommandResult: emitCommandResultMock, isJsonOutput: vi.fn(() => true)
}));

describe('ACR commands', () => {
  beforeEach(() => {
    emitCommandResultMock.mockReset();
    listAcrInstancesMock.mockReset().mockResolvedValue({ regionId: 'cn-shanghai', instances: [], count: 0 });
    listAcrNamespacesMock.mockReset().mockResolvedValue({ instanceId: 'cri-1', namespaces: [], count: 0 });
    listAcrRepositoriesMock.mockReset().mockResolvedValue({ instanceId: 'cri-1', repositories: [], count: 0 });
    listAcrTagsMock.mockReset().mockResolvedValue({ instanceId: 'cri-1', repositoryId: 'crr-1', tags: [], count: 0 });
    inspectAcrScanMock.mockReset().mockResolvedValue({ instanceId: 'cri-1', repositoryId: 'crr-1', tag: 'v1', status: 'COMPLETE', vulnerabilities: [], count: 0 });
  });

  it.each([
    ['acr instances', ['--status', 'RUNNING', '--limit', '20'], listAcrInstancesMock, [{ status: 'RUNNING', limit: 20 }], 'acr.instances'],
    ['acr namespaces', ['cri-1', '--name', 'licell', '--status', 'NORMAL', '--limit', '20'], listAcrNamespacesMock, ['cri-1', { name: 'licell', status: 'NORMAL', limit: 20 }], 'acr.namespaces'],
    ['acr repositories', ['cri-1', '--namespace', 'licell', '--name', 'app', '--status', 'NORMAL', '--limit', '20'], listAcrRepositoriesMock, ['cri-1', { namespace: 'licell', name: 'app', status: 'NORMAL', limit: 20 }], 'acr.repositories'],
    ['acr tags', ['cri-1', 'crr-1', '--limit', '20'], listAcrTagsMock, ['cri-1', 'crr-1', { limit: 20 }], 'acr.tags'],
    ['acr scan', ['cri-1', 'crr-1', 'v1', '--digest', 'sha256:abc', '--task-id', 'task-1', '--severity', 'High', '--type', 'cve', '--query', 'CVE-2026', '--limit', '20'], inspectAcrScanMock, ['cri-1', 'crr-1', 'v1', { digest: 'sha256:abc', taskId: 'task-1', severity: 'High', scanType: 'cve', query: 'CVE-2026', limit: 20 }], 'acr.scan']
  ])('maps %s options to its provider', async (command, args, provider, expectedArgs, stage) => {
    const cli = cac('licell');
    const { registerAcrCommands } = await import('../commands/acr');
    registerAcrCommands(cli);
    await cli.parse(['node', 'src/cli.ts', command, ...args]);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(provider).toHaveBeenCalledWith(...expectedArgs);
    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({ stage }));
  }, 20_000);
});
