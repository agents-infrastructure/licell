import { Config, type AuthConfig } from '../utils/config';
import { resolveSdkCtor } from '../utils/sdk';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const MAX_PAGES = 100;

type RamUserRow = {
  userId?: string;
  userName?: string;
  displayName?: string;
  comments?: string;
  email?: string;
  mobilePhone?: string;
  createDate?: string;
  updateDate?: string;
};

export interface RamUsersClient {
  listUsers(request: { marker?: string; maxItems?: number }): Promise<{
    body?: {
      isTruncated?: boolean;
      marker?: string;
      requestId?: string;
      users?: { user?: RamUserRow[] };
    };
  }>;
}

export interface RamUsersOptions {
  limit?: number;
}

export interface RamUsersDependencies {
  auth?: AuthConfig;
  client?: RamUsersClient;
}

export async function createRamUsersClient(auth: AuthConfig = Config.requireAuth()): Promise<RamUsersClient> {
  const [$RAM, $OpenApi] = await Promise.all([
    import('@alicloud/ram20150501'),
    import('@alicloud/openapi-client')
  ]);
  type RamClient = import('@alicloud/ram20150501').default;
  const RamClientCtor = resolveSdkCtor<RamClient>($RAM.default, '@alicloud/ram20150501');
  const client = new RamClientCtor(new $OpenApi.Config({
    accessKeyId: auth.ak,
    accessKeySecret: auth.sk,
    endpoint: 'ram.aliyuncs.com'
  }));
  return {
    listUsers: (request) => client.listUsers(new $RAM.ListUsersRequest(request))
  };
}

function normalizeLimit(value: number | undefined) {
  if (!Number.isFinite(value)) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(Math.trunc(value!), MAX_LIMIT));
}

function summarizeUser(row: RamUserRow) {
  return {
    userId: row.userId || '',
    userName: row.userName || '',
    displayName: row.displayName || null,
    comments: row.comments || null,
    createDate: row.createDate || null,
    updateDate: row.updateDate || null
  };
}

export async function listRamUsers(
  options: RamUsersOptions = {},
  dependencies: RamUsersDependencies = {}
) {
  const auth = dependencies.auth || Config.requireAuth();
  const client = dependencies.client || await createRamUsersClient(auth);
  const limit = normalizeLimit(options.limit);
  const users: RamUserRow[] = [];
  let marker: string | undefined;
  let requestId: string | undefined;
  let truncated = false;

  for (let page = 0; page < MAX_PAGES && users.length < limit; page += 1) {
    const remaining = Math.max(1, Math.min(1000, limit - users.length));
    const response = await client.listUsers({
      ...(marker ? { marker } : {}),
      maxItems: remaining
    });
    const body = response.body || {};
    const pageUsers = body.users?.user || [];
    users.push(...pageUsers.slice(0, remaining));
    requestId = body.requestId || requestId;
    truncated = Boolean(body.isTruncated) && users.length < limit;
    if (!body.isTruncated || !body.marker || pageUsers.length === 0) break;
    marker = body.marker;
  }

  return {
    stage: 'ram.users',
    count: users.length,
    limit,
    truncated,
    ...(requestId ? { requestId } : {}),
    users: users.map(summarizeUser)
  };
}
