import { describe, expect, it } from 'vitest';
import { enrichDescribeForAgent } from '../commands/capability';
import { describeAlicloudCapability } from '../utils/alicloud-capabilities';

describe('capability agent guidance', () => {
  it('does not recommend unrelated domain commands when no operation matches', async () => {
    const result = await enrichDescribeForAgent(describeAlicloudCapability('vpc.DescribeVpcs'));

    expect(result.curatedCommandCandidates).toEqual([]);
    expect(result.execution).toMatchObject({
      policy: 'curated-first',
      strategy: 'raw-api-fallback',
      preferred: {
        kind: 'raw-api',
        previewCommand: 'licell api invoke vpc.DescribeVpcs --output json'
      }
    });
    expect(result.nextActions[0]?.commandTemplate).toBe('licell api invoke vpc.DescribeVpcs --output json');
    expect(result.nextActions.some((action) => action.commandTemplate.includes('api invoke vpc.DescribeVpcs'))).toBe(true);
  }, 20_000);

  it('prefers the function list command for FC ListFunctions', async () => {
    const result = await enrichDescribeForAgent(describeAlicloudCapability('fc.ListFunctions'));

    expect(result.curatedCommandCandidates[0]?.key).toBe('fn list');
    expect(result.nextActions[0]?.commandTemplate).toBe('licell catalog --root-command fn --output json');
    expect(result.nextActions[1]?.commandTemplate).toBe('licell fn list --help --output json');
    expect(result.curatedCommandCandidates[0]?.match).toBe('curated-overlay');
    expect(result.execution).toMatchObject({
      strategy: 'curated-command',
      preferred: { kind: 'curated-command', commandKey: 'fn list' },
      fallback: { kind: 'raw-api' }
    });
  }, 20_000);

  it('builds an actionable raw fallback from required protocol parameters', async () => {
    const result = await enrichDescribeForAgent(describeAlicloudCapability('cs.DescribeClusterDetail'));

    expect(result.execution).toMatchObject({
      strategy: 'raw-api-fallback',
      preferred: {
        kind: 'raw-api',
        previewCommand: 'licell api invoke cs.DescribeClusterDetail --param ClusterId=<ClusterId> --output json'
      }
    });
  }, 20_000);

});
