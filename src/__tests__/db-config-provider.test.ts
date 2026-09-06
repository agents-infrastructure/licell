import { describe, expect, it, vi } from 'vitest';
import {
  applyDatabaseConfig,
  planDatabaseConfig,
  type DatabaseConfigClient
} from '../providers/infra/config';

const auth = {
  accountId: 'account',
  ak: 'test-ak',
  sk: 'test-sk',
  region: 'cn-shanghai'
};

function attributeResponse(description: string) {
  return {
    body: {
      items: {
        DBInstanceAttribute: [{
          DBInstanceId: 'pgm-staging',
          DBInstanceDescription: description,
          regionId: 'cn-shanghai'
        }]
      }
    }
  };
}

describe('RDS config desired-state provider', () => {
  it('plans a description change without mutating the instance', async () => {
    const modifyDBInstanceDescription = vi.fn(async () => ({ body: { requestId: 'request-a' } }));
    const client: DatabaseConfigClient = {
      describeDBInstanceAttribute: vi.fn(async () => attributeResponse('new-staging-clips')),
      modifyDBInstanceDescription
    };

    const plan = await planDatabaseConfig(
      'pgm-staging',
      { description: 'new-staging-clips-managed' },
      {},
      { auth, client }
    );

    expect(plan).toMatchObject({
      regionId: 'cn-shanghai',
      instanceId: 'pgm-staging',
      current: { description: 'new-staging-clips' },
      desiredState: { description: 'new-staging-clips-managed' },
      after: { description: 'new-staging-clips-managed' },
      changes: [{
        field: 'description',
        action: 'set',
        before: 'new-staging-clips',
        after: 'new-staging-clips-managed'
      }],
      changeCount: 1,
      requiresConfirmation: true,
      willExecute: false
    });
    expect(modifyDBInstanceDescription).not.toHaveBeenCalled();
  });

  it('modifies the description once and verifies the read-back state', async () => {
    const describeDBInstanceAttribute = vi.fn()
      .mockResolvedValueOnce(attributeResponse('new-staging-clips'))
      .mockResolvedValueOnce(attributeResponse('new-staging-clips-managed'));
    const modifyDBInstanceDescription = vi.fn(async () => ({ body: { requestId: 'request-a' } }));
    const client: DatabaseConfigClient = {
      describeDBInstanceAttribute,
      modifyDBInstanceDescription
    };

    const result = await applyDatabaseConfig(
      'pgm-staging',
      { description: 'new-staging-clips-managed' },
      {},
      { auth, client }
    );

    expect(describeDBInstanceAttribute).toHaveBeenCalledTimes(2);
    expect(modifyDBInstanceDescription).toHaveBeenCalledTimes(1);
    expect(modifyDBInstanceDescription).toHaveBeenCalledWith(expect.objectContaining({
      DBInstanceId: 'pgm-staging',
      DBInstanceDescription: 'new-staging-clips-managed'
    }));
    expect(describeDBInstanceAttribute.mock.invocationCallOrder[0])
      .toBeLessThan(modifyDBInstanceDescription.mock.invocationCallOrder[0]!);
    expect(modifyDBInstanceDescription.mock.invocationCallOrder[0])
      .toBeLessThan(describeDBInstanceAttribute.mock.invocationCallOrder[1]!);
    expect(result).toMatchObject({
      plan: {
        current: { description: 'new-staging-clips' },
        after: { description: 'new-staging-clips-managed' },
        changeCount: 1,
        willExecute: true
      },
      execution: { performed: true, requestId: 'request-a' },
      verify: {
        performed: true,
        matched: true,
        attributes: { description: 'new-staging-clips-managed' }
      }
    });
  });

  it('does not modify the instance when the description already matches', async () => {
    const describeDBInstanceAttribute = vi.fn(async () => attributeResponse('new-staging-clips'));
    const modifyDBInstanceDescription = vi.fn(async () => ({ body: { requestId: 'unexpected-write' } }));
    const client: DatabaseConfigClient = {
      describeDBInstanceAttribute,
      modifyDBInstanceDescription
    };

    const result = await applyDatabaseConfig(
      'pgm-staging',
      { description: 'new-staging-clips' },
      {},
      { auth, client }
    );

    expect(modifyDBInstanceDescription).not.toHaveBeenCalled();
    expect(describeDBInstanceAttribute).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      plan: {
        changeCount: 0,
        willExecute: false,
        changes: [{ field: 'description', action: 'noop' }]
      },
      execution: { performed: false },
      verify: {
        performed: true,
        matched: true,
        attributes: { description: 'new-staging-clips' }
      }
    });
  });

  it('retries a stale read-back without issuing a second write', async () => {
    const describeDBInstanceAttribute = vi.fn()
      .mockResolvedValueOnce(attributeResponse('new-staging-clips'))
      .mockResolvedValueOnce(attributeResponse('new-staging-clips'))
      .mockResolvedValueOnce(attributeResponse('new-staging-clips-managed'));
    const modifyDBInstanceDescription = vi.fn(async () => ({ body: { requestId: 'request-a' } }));
    const client: DatabaseConfigClient = {
      describeDBInstanceAttribute,
      modifyDBInstanceDescription
    };

    const result = await applyDatabaseConfig(
      'pgm-staging',
      { description: 'new-staging-clips-managed' },
      {},
      { auth, client }
    );

    expect(modifyDBInstanceDescription).toHaveBeenCalledTimes(1);
    expect(describeDBInstanceAttribute).toHaveBeenCalledTimes(3);
    expect(result).toMatchObject({
      execution: { performed: true, requestId: 'request-a' },
      verify: {
        performed: true,
        matched: true,
        attributes: { description: 'new-staging-clips-managed' }
      }
    });
  });
});
