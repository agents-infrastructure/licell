import { describe, expect, it } from 'vitest';
import { executeAlicloudApi } from '../providers/openapi/runner';
import { Config } from '../utils/config';

const liveEnabled = process.env.LICELL_LIVE_ALICLOUD_TESTS === '1';
const liveAuth = liveEnabled ? Config.getAuth() : null;

describe.skipIf(!liveEnabled || !liveAuth)('Alibaba Cloud OpenAPI live read-only invokes', () => {
  it('invokes ECS DescribeRegions through the managed aliyun runner', async () => {
    const result = await executeAlicloudApi('ecs.DescribeRegions', {}, { auth: liveAuth! });

    expect(result.ok, result.stderr).toBe(true);
    expect(result.response).toMatchObject({ Regions: { Region: expect.any(Array) } });
    expect(result.requestId).toEqual(expect.any(String));
  }, 120_000);

  it('invokes VPC DescribeVpcs with an explicit region parameter', async () => {
    const result = await executeAlicloudApi('vpc.DescribeVpcs', { RegionId: liveAuth!.region }, { auth: liveAuth! });

    expect(result.ok, result.stderr).toBe(true);
    expect(result.response).toMatchObject({ Vpcs: { Vpc: expect.any(Array) } });
    expect(result.requestId).toEqual(expect.any(String));
  }, 120_000);

  it('invokes FC ListFunctions through the REST adapter', async () => {
    const result = await executeAlicloudApi('fc.ListFunctions', {}, { auth: liveAuth! });

    expect(result.ok, result.stderr).toBe(true);
    expect(result.response).toMatchObject({ functions: expect.any(Array) });
  }, 120_000);
});
