import { describe, expect, it } from 'vitest';
import { listRamUsers, type RamUsersClient } from '../providers/ram-query';

const auth = { accountId: 'account-1', ak: 'ak-test', sk: 'sk-test', region: 'cn-hangzhou' };

function createClient(pages: Array<Awaited<ReturnType<RamUsersClient['listUsers']>>>): RamUsersClient {
  let index = 0;
  return {
    listUsers: async () => pages[index++] || { body: {} }
  };
}

describe('RAM users query provider', () => {
  it('paginates RAM users and projects only non-sensitive summary fields', async () => {
    const client = createClient([
      {
        body: {
          isTruncated: true,
          marker: 'next-page',
          requestId: 'req-1',
          users: {
            user: [{
              userId: 'u-1',
              userName: 'alice',
              displayName: 'Alice',
              comments: 'operator',
              createDate: '2026-01-01T00:00:00Z',
              updateDate: '2026-01-02T00:00:00Z',
              email: 'alice@example.com',
              mobilePhone: '13800000000'
            }]
          }
        }
      },
      {
        body: {
          isTruncated: false,
          requestId: 'req-2',
          users: { user: [{ userId: 'u-2', userName: 'bob' }] }
        }
      }
    ]);

    const result = await listRamUsers({ limit: 2 }, { auth, client });

    expect(result).toMatchObject({
      stage: 'ram.users',
      count: 2,
      limit: 2,
      truncated: false,
      requestId: 'req-2'
    });
    expect(result.users).toEqual([
      {
        userId: 'u-1',
        userName: 'alice',
        displayName: 'Alice',
        comments: 'operator',
        createDate: '2026-01-01T00:00:00Z',
        updateDate: '2026-01-02T00:00:00Z'
      },
      {
        userId: 'u-2',
        userName: 'bob',
        displayName: null,
        comments: null,
        createDate: null,
        updateDate: null
      }
    ]);
    expect(JSON.stringify(result)).not.toContain('alice@example.com');
    expect(JSON.stringify(result)).not.toContain('13800000000');
  });

  it('stops at the requested limit and clamps invalid limits', async () => {
    const calls: unknown[] = [];
    const client: RamUsersClient = {
      listUsers: async (request) => {
        calls.push(request);
        return { body: { isTruncated: true, marker: 'next', users: { user: [{ userName: 'alice' }, { userName: 'bob' }] } } };
      }
    };

    const result = await listRamUsers({ limit: 0 }, { auth, client });

    expect(result.limit).toBe(1);
    expect(result.users).toHaveLength(1);
    expect(calls).toHaveLength(1);
  });
});
