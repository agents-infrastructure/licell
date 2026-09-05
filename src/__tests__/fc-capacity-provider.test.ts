import { describe, expect, it, vi } from 'vitest';
import { listFunctionCapacity } from '../providers/fc/capacity';

describe('FC capacity provider', () => {
  it('collects concurrency, provision, and scaling configs with one function filter', async () => {
    const client = {
      listConcurrencyConfigs: vi.fn().mockResolvedValue({
        body: { configs: [{ functionArn: 'acs:fc:functions/demo', reservedConcurrency: 10 }] }
      }),
      listProvisionConfigs: vi.fn().mockResolvedValue({
        body: { provisionConfigs: [{ functionArn: 'acs:fc:functions/demo/prod', current: 2, target: 3 }] }
      }),
      listScalingConfigs: vi.fn().mockResolvedValue({
        body: { scalingConfigs: [{ functionArn: 'acs:fc:functions/demo/prod', currentInstances: 2, targetInstances: 4 }] }
      })
    };

    const result = await listFunctionCapacity({ functionName: ' demo ', limit: 20 }, client as never);

    expect(result).toMatchObject({ functionName: 'demo', limit: 20 });
    expect(result.concurrency).toHaveLength(1);
    expect(result.provision).toHaveLength(1);
    expect(result.scaling).toHaveLength(1);
    for (const method of [client.listConcurrencyConfigs, client.listProvisionConfigs, client.listScalingConfigs]) {
      expect(method).toHaveBeenCalledWith(expect.objectContaining({ functionName: 'demo', limit: 20 }));
    }
  });

  it('follows nextToken independently for each capacity resource', async () => {
    const client = {
      listConcurrencyConfigs: vi.fn()
        .mockResolvedValueOnce({ body: { configs: [{ functionArn: 'fn-1' }], nextToken: 'next-c' } })
        .mockResolvedValueOnce({ body: { configs: [{ functionArn: 'fn-2' }] } }),
      listProvisionConfigs: vi.fn().mockResolvedValue({ body: { provisionConfigs: [] } }),
      listScalingConfigs: vi.fn().mockResolvedValue({ body: { scalingConfigs: [] } })
    };

    const result = await listFunctionCapacity({ limit: 10 }, client as never);

    expect(result.concurrency.map((item) => item.functionArn)).toEqual(['fn-1', 'fn-2']);
    expect(client.listConcurrencyConfigs).toHaveBeenNthCalledWith(2, expect.objectContaining({ nextToken: 'next-c', limit: 9 }));
  });
});
