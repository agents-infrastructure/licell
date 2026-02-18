import FC20230330, * as $FC from '@alicloud/fc20230330';
import { isConflictError } from '../../utils/alicloud-error';
import { createFcClient } from './client';

const DEFAULT_HTTP_TRIGGER_NAME = 'licell-http';

export type HttpTriggerAuthType = 'anonymous' | 'function';

function buildHttpTriggerConfig(authType: HttpTriggerAuthType = 'anonymous') {
  return JSON.stringify({
    authType,
    disableURLInternet: false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']
  });
}

function isHttpTrigger(trigger: $FC.Trigger) {
  return (trigger.triggerType || '').toLowerCase() === 'http';
}

async function listAllTriggers(appName: string, fcClient: FC20230330) {
  const triggers: $FC.Trigger[] = [];
  let nextToken: string | undefined;
  const MAX_PAGES = 50;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await fcClient.listTriggers(appName, new $FC.ListTriggersRequest({
      limit: 100,
      nextToken
    }));
    const rows = response.body?.triggers || [];
    triggers.push(...rows);
    nextToken = response.body?.nextToken;
    if (!nextToken || rows.length === 0) break;
  }
  return triggers;
}

function pickPublicHttpTriggerUrl(triggers: $FC.Trigger[]) {
  for (const trigger of triggers) {
    if (!isHttpTrigger(trigger)) continue;
    const url = trigger.httpTrigger?.urlInternet;
    if (typeof url === 'string' && url.trim().length > 0) return url;
  }
  return null;
}

async function upsertDefaultHttpTrigger(appName: string, fcClient: FC20230330, authType: HttpTriggerAuthType = 'anonymous') {
  const triggerConfig = buildHttpTriggerConfig(authType);
  try {
    await fcClient.createTrigger(appName, new $FC.CreateTriggerRequest({
      body: new $FC.CreateTriggerInput({
        triggerName: DEFAULT_HTTP_TRIGGER_NAME,
        triggerType: 'http',
        description: 'managed by licell',
        triggerConfig
      })
    }));
    return;
  } catch (err: unknown) {
    if (!isConflictError(err)) throw err;
  }

  await fcClient.updateTrigger(appName, DEFAULT_HTTP_TRIGGER_NAME, new $FC.UpdateTriggerRequest({
    body: new $FC.UpdateTriggerInput({
      triggerConfig
    })
  }));
}

export interface EnsureHttpUrlOptions {
  authType?: HttpTriggerAuthType;
}

export async function ensureFunctionHttpUrl(appName: string, fcClient?: FC20230330, options: EnsureHttpUrlOptions = {}) {
  const client = fcClient ?? createFcClient().client;
  const initialTriggers = await listAllTriggers(appName, client);
  const existing = pickPublicHttpTriggerUrl(initialTriggers);
  if (existing) return existing;

  await upsertDefaultHttpTrigger(appName, client, options.authType);
  const refreshedTriggers = await listAllTriggers(appName, client);
  const refreshed = pickPublicHttpTriggerUrl(refreshedTriggers);
  if (refreshed) return refreshed;
  throw new Error('函数部署成功，但未获取到公网 HTTP Trigger URL，请检查函数触发器配置');
}
