import FC20230330, * as $FC from '@alicloud/fc20230330';
import { isConflictError } from '../../utils/alicloud-error';
import { formatErrorMessage } from '../../utils/errors';
import { createFcClient } from './client';
import { callFcWithGuard, waitForFcFunctionReadable } from './request-guard';
import type { PruneFunctionVersionsResult } from './types';

function toVersionSortValue(versionId: string) {
  const asNumber = Number(versionId);
  return Number.isFinite(asNumber) ? asNumber : -1;
}

export async function listFunctionVersions(appName: string, limit = 20, fcClient?: FC20230330) {
  const client = fcClient ?? createFcClient().client;
  const versions: $FC.Version[] = [];
  let nextToken: string | undefined;
  let remaining = Math.max(limit, 1);

  while (remaining > 0) {
    const pageLimit = Math.min(remaining, 100);
    const response = await callFcWithGuard<$FC.ListFunctionVersionsResponse>(
      client as unknown as Record<string, unknown>,
      'listFunctionVersions',
      [appName, new $FC.ListFunctionVersionsRequest({
        direction: 'BACKWARD',
        limit: pageLimit,
        nextToken
      })],
      {
        operation: `listFunctionVersions(${appName})`,
        profile: 'read'
      }
    );
    const page = response.body?.versions || [];
    versions.push(...page);
    remaining -= page.length;
    nextToken = response.body?.nextToken;
    if (!nextToken || page.length === 0) break;
  }

  versions.sort((a, b) => toVersionSortValue(b.versionId || '') - toVersionSortValue(a.versionId || ''));
  return versions;
}

export async function publishFunctionVersion(appName: string, description?: string) {
  const { client } = createFcClient();
  const response = await callFcWithGuard<$FC.PublishFunctionVersionResponse>(
    client as unknown as Record<string, unknown>,
    'publishFunctionVersion',
    [appName, new $FC.PublishFunctionVersionRequest({
      body: new $FC.PublishVersionInput({ description })
    })],
    {
      operation: `publishFunctionVersion(${appName})`,
      profile: 'mutation'
    }
  );
  const versionId = response.body?.versionId;
  if (!versionId) throw new Error('发布函数版本失败：未返回 versionId');
  return versionId;
}

export async function promoteFunctionAlias(
  appName: string,
  aliasName: string,
  versionId: string,
  description?: string
) {
  const { client } = createFcClient();
  const body = new $FC.CreateAliasInput({
    aliasName,
    versionId,
    description
  });

  try {
    await callFcWithGuard(
      client as unknown as Record<string, unknown>,
      'createAlias',
      [appName, new $FC.CreateAliasRequest({ body })],
      {
        operation: `createAlias(${appName}/${aliasName})`,
        profile: 'mutation'
      }
    );
  } catch (err: unknown) {
    if (!isConflictError(err)) throw err;
    await callFcWithGuard(
      client as unknown as Record<string, unknown>,
      'updateAlias',
      [appName, aliasName, new $FC.UpdateAliasRequest({
        body: new $FC.UpdateAliasInput({
          versionId,
          description
        })
      })],
      {
        operation: `updateAlias(${appName}/${aliasName})`,
        profile: 'mutation'
      }
    );
  }

  await waitForFcFunctionReadable(appName, client, { qualifier: aliasName, profile: 'mutation' });
}

async function listAllAliases(appName: string, fcClient: FC20230330) {
  const aliases: $FC.Alias[] = [];
  let nextToken: string | undefined;
  const MAX_PAGES = 50;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await callFcWithGuard<$FC.ListAliasesResponse>(
      fcClient as unknown as Record<string, unknown>,
      'listAliases',
      [appName, new $FC.ListAliasesRequest({
        limit: 100,
        nextToken
      })],
      {
        operation: `listAliases(${appName})`,
        profile: 'read'
      }
    );
    const rows = response.body?.aliases || [];
    aliases.push(...rows);
    nextToken = response.body?.nextToken;
    if (!nextToken || rows.length === 0) break;
  }
  return aliases;
}

function uniqueSortedVersionIds(versionIds: Iterable<string>) {
  return [...new Set(versionIds)]
    .filter((id) => /^\d+$/.test(id))
    .sort((a, b) => toVersionSortValue(a) - toVersionSortValue(b));
}

export async function pruneFunctionVersions(
  appName: string,
  keep: number,
  apply = false
): Promise<PruneFunctionVersionsResult> {
  const { client } = createFcClient();
  const normalizedKeep = Number.isFinite(keep) && keep > 0 ? Math.floor(keep) : 10;
  const versions = await listFunctionVersions(appName, 1000, client);
  const aliases = await listAllAliases(appName, client);
  const aliasProtectedSet = new Set<string>();

  for (const alias of aliases) {
    if (alias.versionId) aliasProtectedSet.add(alias.versionId);
    const weighted = alias.additionalVersionWeight || {};
    for (const weightedVersionId of Object.keys(weighted)) aliasProtectedSet.add(weightedVersionId);
  }

  const publishedVersions = versions
    .map((version) => version.versionId || '')
    .filter((id) => /^\d+$/.test(id));
  const keptVersions = publishedVersions.slice(0, normalizedKeep);
  const candidates = publishedVersions.filter((id) => !keptVersions.includes(id) && !aliasProtectedSet.has(id));
  const result: PruneFunctionVersionsResult = {
    apply,
    keep: normalizedKeep,
    totalVersions: publishedVersions.length,
    aliasProtectedVersions: uniqueSortedVersionIds(aliasProtectedSet),
    candidates,
    deleted: [],
    failed: []
  };

  if (!apply || candidates.length === 0) return result;

  for (const candidateVersionId of candidates) {
    try {
      await callFcWithGuard(
        client as unknown as Record<string, unknown>,
        'deleteFunctionVersion',
        [appName, candidateVersionId],
        {
          operation: `deleteFunctionVersion(${appName}/${candidateVersionId})`,
          profile: 'mutation'
        }
      );
      result.deleted.push(candidateVersionId);
    } catch (err: unknown) {
      const reason = formatErrorMessage(err);
      result.failed.push({ versionId: candidateVersionId, reason });
    }
  }
  return result;
}
