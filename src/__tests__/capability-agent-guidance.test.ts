import { describe, expect, it } from 'vitest';
import { enrichDescribeForAgent } from '../commands/capability';
import { describeAlicloudCapability } from '../utils/alicloud-capabilities';

describe('capability agent guidance', () => {
  it('prefers the curated VPC inventory for DescribeVpcs', async () => {
    const result = await enrichDescribeForAgent(describeAlicloudCapability('vpc.DescribeVpcs'));

    expect(result.curatedCommandCandidates.map((candidate) => candidate.key)).toEqual([
      'vpc list',
      'vpc info',
      'vpc topology'
    ]);
    expect(result.execution).toMatchObject({
      policy: 'curated-first',
      strategy: 'curated-command',
      preferred: {
        kind: 'curated-command',
        commandKey: 'vpc list'
      }
    });
    expect(result.nextActions[0]?.commandTemplate).toBe('licell catalog --root-command vpc --output json');
    expect(result.nextActions.some((action) => action.commandTemplate.includes('api invoke vpc.DescribeVpcs'))).toBe(true);
  }, 20_000);

  it.each([
    ['vpc.DescribeVSwitches', 'vpc topology'],
    ['vpc.DescribeRouteTables', 'vpc topology'],
    ['vpc.DescribeNatGateways', 'vpc topology'],
    ['vpc.DescribeEipAddresses', 'vpc topology']
  ])('routes %s to the curated topology command', async (ref, commandKey) => {
    const result = await enrichDescribeForAgent(describeAlicloudCapability(ref));
    expect(result.execution.preferred).toMatchObject({ kind: 'curated-command', commandKey });
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

  it('prefers curated Kubernetes inventory over the raw CS cluster API', async () => {
    const result = await enrichDescribeForAgent(describeAlicloudCapability('cs.DescribeClusters'));

    expect(result.execution).toMatchObject({
      strategy: 'curated-command',
      preferred: { kind: 'curated-command', commandKey: 'k8s clusters' },
      fallback: { kind: 'raw-api' }
    });
    expect(result.nextActions[0]?.commandTemplate).toBe('licell catalog --root-command k8s --output json');
  }, 20_000);

  it('preserves curated overlay priority when one API maps to multiple commands', async () => {
    const result = await enrichDescribeForAgent(describeAlicloudCapability('rds.DescribeDBInstances'));

    expect(result.curatedCommandCandidates.map((candidate) => candidate.key).slice(0, 2)).toEqual([
      'db list',
      'db info'
    ]);
    expect(result.execution.preferred).toMatchObject({
      kind: 'curated-command',
      commandKey: 'db list',
      helpCommand: 'licell db list --help --output json'
    });
  }, 20_000);

  it('requires preview and explicit confirmation for an uncurated write operation', async () => {
    const result = await enrichDescribeForAgent(describeAlicloudCapability('vpc.CreateVpc'));

    expect(result.execution).toMatchObject({
      policy: 'curated-first',
      strategy: 'raw-api-fallback',
      preferred: {
        kind: 'raw-api',
        requiresConfirmation: true
      }
    });
    const preferred = result.execution.preferred;
    expect(preferred.kind).toBe('raw-api');
    if (preferred.kind !== 'raw-api') throw new Error('expected raw API fallback');
    expect(preferred.previewCommand).toContain('--dry-run');
    expect(preferred.executeCommand).toContain('--yes');
  }, 20_000);

});
