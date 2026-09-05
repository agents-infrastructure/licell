import { describe, expect, it, vi } from 'vitest';
import { listFunctionInstances, listFunctionSessions } from '../providers/fc/runtime-inventory';

describe('FC runtime inventory provider', () => {
  it('maps function instance filters to the FC request shape', async () => {
    const client = {
      listInstances: vi.fn().mockResolvedValue({
        body: { requestId: 'req-1', instances: [{ instanceId: 'i-1', status: 'Running' }] }
      })
    };

    const result = await listFunctionInstances({
      functionName: ' demo ', qualifier: 'prod', status: 'Running', withAllActive: true, limit: 20
    }, client as never);

    expect(client.listInstances).toHaveBeenCalledWith('demo', expect.objectContaining({
      qualifier: 'prod', instanceStatus: ['Running'], withAllActive: true, limit: '20'
    }));
    expect(result).toMatchObject({ functionName: 'demo', limit: 20, requestId: 'req-1' });
    expect(result.instances).toHaveLength(1);
  });

  it('paginates sessions independently with nextToken', async () => {
    const client = {
      listSessions: vi.fn()
        .mockResolvedValueOnce({ body: { sessions: [{ sessionId: 's-1' }], nextToken: 'next-s' } })
        .mockResolvedValueOnce({ body: { sessions: [{ sessionId: 's-2' }] } })
    };

    const result = await listFunctionSessions({
      functionName: 'demo', qualifier: 'prod', status: 'Active', sessionId: 'session-filter', limit: 10
    }, client as never);

    expect(result.sessions.map((item) => item.sessionId)).toEqual(['s-1', 's-2']);
    expect(client.listSessions).toHaveBeenNthCalledWith(2, 'demo', expect.objectContaining({
      nextToken: 'next-s', qualifier: 'prod', sessionStatus: 'Active', sessionId: 'session-filter', limit: 9
    }));
  });
});
