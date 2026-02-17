import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockClient = {
  listTriggers: vi.fn(),
  deleteTrigger: vi.fn(),
  listAliases: vi.fn(),
  deleteAlias: vi.fn(),
  listFunctionVersions: vi.fn(),
  deleteFunctionVersion: vi.fn(),
  deleteFunction: vi.fn()
};

vi.mock('../providers/fc/client', () => ({
  createFcClient: vi.fn(() => ({ client: mockClient }))
}));

import { removeFunction } from '../providers/fc/function-ops';

describe('removeFunction', () => {
  beforeEach(() => {
    Object.values(mockClient).forEach((fn) => fn.mockReset());
    mockClient.listTriggers.mockResolvedValue({ body: { triggers: [], nextToken: undefined } });
    mockClient.listAliases.mockResolvedValue({ body: { aliases: [], nextToken: undefined } });
    mockClient.listFunctionVersions.mockResolvedValue({ body: { versions: [], nextToken: undefined } });
    mockClient.deleteFunction.mockResolvedValue(undefined);
  });

  it('deletes function directly when force is not enabled', async () => {
    const result = await removeFunction('  test-fn  ');
    expect(mockClient.deleteFunction).toHaveBeenCalledWith('test-fn');
    expect(mockClient.listTriggers).not.toHaveBeenCalled();
    expect(mockClient.listAliases).not.toHaveBeenCalled();
    expect(mockClient.listFunctionVersions).not.toHaveBeenCalled();
    expect(result).toEqual({
      forced: false,
      deletedTriggers: [],
      deletedAliases: [],
      deletedVersions: []
    });
  });

  it('cascades trigger/alias/version cleanup before delete when force is enabled', async () => {
    mockClient.listTriggers
      .mockResolvedValueOnce({
        body: {
          triggers: [{ triggerName: 'licell-http' }, { triggerName: 'extra-http' }],
          nextToken: 'next'
        }
      })
      .mockResolvedValueOnce({ body: { triggers: [], nextToken: undefined } });
    mockClient.listAliases.mockResolvedValue({
      body: {
        aliases: [{ aliasName: 'preview' }, { aliasName: 'prod' }],
        nextToken: undefined
      }
    });
    mockClient.listFunctionVersions.mockResolvedValue({
      body: {
        versions: [{ versionId: 'LATEST' }, { versionId: '2' }, { versionId: 'abc' }, { versionId: '1' }],
        nextToken: undefined
      }
    });

    const result = await removeFunction('test-fn', { force: true });

    expect(mockClient.deleteTrigger).toHaveBeenCalledTimes(2);
    expect(mockClient.deleteTrigger).toHaveBeenNthCalledWith(1, 'test-fn', 'licell-http');
    expect(mockClient.deleteTrigger).toHaveBeenNthCalledWith(2, 'test-fn', 'extra-http');

    expect(mockClient.deleteAlias).toHaveBeenCalledTimes(2);
    expect(mockClient.deleteAlias).toHaveBeenNthCalledWith(1, 'test-fn', 'preview');
    expect(mockClient.deleteAlias).toHaveBeenNthCalledWith(2, 'test-fn', 'prod');

    expect(mockClient.deleteFunctionVersion).toHaveBeenCalledTimes(2);
    expect(mockClient.deleteFunctionVersion).toHaveBeenNthCalledWith(1, 'test-fn', '2');
    expect(mockClient.deleteFunctionVersion).toHaveBeenNthCalledWith(2, 'test-fn', '1');

    expect(mockClient.deleteFunction).toHaveBeenCalledWith('test-fn');
    expect(result).toEqual({
      forced: true,
      deletedTriggers: ['licell-http', 'extra-http'],
      deletedAliases: ['preview', 'prod'],
      deletedVersions: ['2', '1']
    });
  });

  it('ignores not-found errors during forced cleanup', async () => {
    mockClient.listTriggers.mockResolvedValue({
      body: { triggers: [{ triggerName: 'licell-http' }], nextToken: undefined }
    });
    mockClient.listAliases.mockResolvedValue({
      body: { aliases: [{ aliasName: 'preview' }], nextToken: undefined }
    });
    mockClient.listFunctionVersions.mockResolvedValue({
      body: { versions: [{ versionId: '1' }], nextToken: undefined }
    });
    mockClient.deleteTrigger.mockRejectedValue({ code: 'TriggerNotFound', message: 'not found' });
    mockClient.deleteAlias.mockRejectedValue({ code: 'AliasNotFound', message: 'not found' });
    mockClient.deleteFunctionVersion.mockRejectedValue({ code: 'VersionNotFound', message: 'not found' });

    const result = await removeFunction('test-fn', { force: true });
    expect(mockClient.deleteFunction).toHaveBeenCalledWith('test-fn');
    expect(result).toEqual({
      forced: true,
      deletedTriggers: [],
      deletedAliases: [],
      deletedVersions: []
    });
  });

  it('throws when functionName is empty', async () => {
    await expect(removeFunction('   ')).rejects.toThrow('functionName 不能为空');
  });
});
