import type { CAC } from 'cac';
import pc from 'picocolors';
import { listAcrInstances, listAcrNamespaces, listAcrRepositories, listAcrTags } from '../providers/cr-inventory';
import { executeWithAuthRecovery } from '../utils/auth-recovery';
import { ensureAuthOrExit, isInteractiveTTY, parseListLimit, toOptionalString } from '../utils/cli-shared';
import { emitCommandResult, isJsonOutput } from '../utils/output';
import { commandInvocation, defineCliCommand, defineCommandModule, registerCliCommand } from './module';
import { DELIVERY_SECTION } from './sections';

const acrInstancesCommand = defineCliCommand({
  rawName: 'acr instances', description: '列出 ACR 企业版实例（只读）', region: { scope: 'auth' },
  options: [{ rawName: '--status <status>', description: '按实例状态过滤，例如 RUNNING' }, { rawName: '--limit <n>', description: '返回数量，默认 50，最大 200' }],
  descriptor: {
    title: 'List ACR Enterprise instances', summary: '读取当前地域的 ACR 企业版实例摘要。',
    examples: ['licell acr instances --status RUNNING --output json'], related: ['acr namespaces', 'acr repositories', 'capability search'],
    agentTips: ['该命令只覆盖企业版；个人版继续由 `deploy --runtime docker` 的兼容流程管理。'],
    automation: { preferredOutput: 'json', explicitInputs: ['--region', '--status', '--limit'] },
    safety: { level: 'safe', reason: '只调用 ACR ListInstance。', confirmFlags: [] },
    result: { outcomeKey: 'instances', fields: [
      { name: 'regionId', description: '实际查询地域。', required: true }, { name: 'edition', description: '固定为 enterprise。', required: true },
      { name: 'count', description: '返回实例数。', required: true }, { name: 'truncated', description: '结果是否截断。', required: true },
      { name: 'instances[]', description: '实例 ID、名称、状态、规格和标签。', required: true }
    ] }
  }
});

const acrNamespacesCommand = defineCliCommand({
  rawName: 'acr namespaces <instanceId>', description: '列出 ACR 企业版命名空间（只读）',
  region: { scope: 'auth' },
  options: [{ rawName: '--name <name>', description: '按命名空间名过滤' }, { rawName: '--status <status>', description: '按状态过滤，例如 NORMAL' }, { rawName: '--limit <n>', description: '返回数量，默认 50，最大 200' }],
  descriptor: {
    title: 'List ACR namespaces', summary: '读取企业版实例的命名空间、状态和仓库默认策略。', examples: ['licell acr namespaces cri-xxx --output json'],
    argumentHints: { instanceId: 'ACR 企业版实例 ID；先用 `acr instances` 获取。' }, related: ['acr instances', 'acr repositories', 'capability search'],
    automation: { preferredOutput: 'json', explicitInputs: ['instanceId', '--region', '--name', '--status', '--limit'] },
    safety: { level: 'safe', reason: '只调用 ACR ListNamespace。', confirmFlags: [] },
    result: { outcomeKey: 'namespaces', fields: [
      { name: 'instanceId', description: 'ACR 企业版实例 ID。', required: true }, { name: 'count', description: '返回命名空间数。', required: true },
      { name: 'truncated', description: '结果是否截断。', required: true }, { name: 'namespaces[]', description: '命名空间名、状态和默认仓库策略。', required: true }
    ] }
  }
});

const acrRepositoriesCommand = defineCliCommand({
  rawName: 'acr repositories <instanceId>', description: '列出 ACR 企业版镜像仓库（只读）', region: { scope: 'auth' },
  options: [{ rawName: '--namespace <name>', description: '按命名空间过滤' }, { rawName: '--name <name>', description: '按仓库名过滤' }, { rawName: '--status <status>', description: '按仓库状态过滤' }, { rawName: '--limit <n>', description: '返回数量，默认 50，最大 200' }],
  descriptor: {
    title: 'List ACR repositories', summary: '读取企业版镜像仓库及可用于 tags 查询的 repositoryId。', examples: ['licell acr repositories cri-xxx --namespace licell --output json'],
    argumentHints: { instanceId: 'ACR 企业版实例 ID。' }, related: ['acr namespaces', 'acr tags', 'capability search'],
    agentTips: ['需要查询镜像版本时，从 `repositories[].repositoryId` 取值传给 `acr tags`。'],
    automation: { preferredOutput: 'json', explicitInputs: ['instanceId', '--region', '--namespace', '--name', '--status', '--limit'] },
    safety: { level: 'safe', reason: '只调用 ACR ListRepository。', confirmFlags: [] },
    result: { outcomeKey: 'repositories', fields: [
      { name: 'instanceId', description: 'ACR 企业版实例 ID。', required: true }, { name: 'count', description: '返回仓库数。', required: true },
      { name: 'truncated', description: '结果是否截断。', required: true }, { name: 'repositories[]', description: '仓库 ID、命名空间、名称、状态、类型和构建策略。', required: true }
    ] }
  }
});

const acrTagsCommand = defineCliCommand({
  rawName: 'acr tags <instanceId> <repositoryId>', description: '列出 ACR 企业版镜像标签（只读）', region: { scope: 'auth' },
  options: [{ rawName: '--limit <n>', description: '返回数量，默认 50，最大 200' }],
  descriptor: {
    title: 'List ACR image tags', summary: '读取指定企业版镜像仓库的 tag、digest、大小与更新时间。', examples: ['licell acr tags cri-xxx crr-xxx --output json'],
    argumentHints: { instanceId: 'ACR 企业版实例 ID。', repositoryId: '镜像仓库 ID；从 `acr repositories` 获取。' }, related: ['acr repositories', 'capability search'],
    automation: { preferredOutput: 'json', explicitInputs: ['instanceId', 'repositoryId', '--region', '--limit'] },
    safety: { level: 'safe', reason: '只调用 ACR ListRepoTag。', confirmFlags: [] },
    result: { outcomeKey: 'tags', fields: [
      { name: 'instanceId', description: 'ACR 企业版实例 ID。', required: true }, { name: 'repositoryId', description: '镜像仓库 ID。', required: true },
      { name: 'count', description: '返回 tag 数。', required: true }, { name: 'truncated', description: '结果是否截断。', required: true },
      { name: 'tags[]', description: 'tag、digest、状态、大小和时间。', required: true }
    ] }
  }
});

export function registerAcrCommands(cli: CAC) {
  registerCliCommand(cli, acrInstancesCommand).action(async (options: { status?: unknown; limit?: unknown }) => {
    const result = await executeWithAuthRecovery({ commandLabel: commandInvocation(acrInstancesCommand), interactiveTTY: isInteractiveTTY(), requiredCapabilities: ['cr'] }, async () => {
      ensureAuthOrExit();
      return listAcrInstances({ status: toOptionalString(options.status), limit: parseListLimit(options.limit, 50, 200) });
    });
    if (isJsonOutput()) emitCommandResult({ stage: 'acr.instances', ...result });
    if (!isJsonOutput()) printRows('ACR instances', result.instances, (item) => `${item.instanceId || '-'}  ${item.name || '-'}  ${item.status || '-'}`);
  });

  registerCliCommand(cli, acrNamespacesCommand).action(async (instanceId: string, options: { name?: unknown; status?: unknown; limit?: unknown }) => {
    const result = await executeWithAuthRecovery({ commandLabel: commandInvocation(acrNamespacesCommand), interactiveTTY: isInteractiveTTY(), requiredCapabilities: ['cr'] }, async () => {
      ensureAuthOrExit();
      return listAcrNamespaces(instanceId, { name: toOptionalString(options.name), status: toOptionalString(options.status), limit: parseListLimit(options.limit, 50, 200) });
    });
    if (isJsonOutput()) emitCommandResult({ stage: 'acr.namespaces', ...result });
    if (!isJsonOutput()) printRows('ACR namespaces', result.namespaces, (item) => `${item.name || '-'}  ${item.status || '-'}`);
  });

  registerCliCommand(cli, acrRepositoriesCommand).action(async (instanceId: string, options: { namespace?: unknown; name?: unknown; status?: unknown; limit?: unknown }) => {
    const result = await executeWithAuthRecovery({ commandLabel: commandInvocation(acrRepositoriesCommand), interactiveTTY: isInteractiveTTY(), requiredCapabilities: ['cr'] }, async () => {
      ensureAuthOrExit();
      return listAcrRepositories(instanceId, { namespace: toOptionalString(options.namespace), name: toOptionalString(options.name), status: toOptionalString(options.status), limit: parseListLimit(options.limit, 50, 200) });
    });
    if (isJsonOutput()) emitCommandResult({ stage: 'acr.repositories', ...result });
    if (!isJsonOutput()) printRows('ACR repositories', result.repositories, (item) => `${item.repositoryId || '-'}  ${item.namespace || '-'}/${item.name || '-'}  ${item.status || '-'}`);
  });

  registerCliCommand(cli, acrTagsCommand).action(async (instanceId: string, repositoryId: string, options: { limit?: unknown }) => {
    const result = await executeWithAuthRecovery({ commandLabel: commandInvocation(acrTagsCommand), interactiveTTY: isInteractiveTTY(), requiredCapabilities: ['cr'] }, async () => {
      ensureAuthOrExit();
      return listAcrTags(instanceId, repositoryId, { limit: parseListLimit(options.limit, 50, 200) });
    });
    if (isJsonOutput()) emitCommandResult({ stage: 'acr.tags', ...result });
    if (!isJsonOutput()) printRows('ACR tags', result.tags, (item) => `${item.tag || '-'}  ${item.status || '-'}  ${item.sizeBytes || 0} bytes`);
  });
}

function printRows(title: string, rows: Array<Record<string, unknown>>, format: (item: Record<string, unknown>) => string) {
  console.log(pc.bold(`${title} (${rows.length})`));
  for (const item of rows) console.log(`- ${pc.cyan(format(item))}`);
}

export const acrCommandModule = defineCommandModule({
  section: DELIVERY_SECTION,
  register: registerAcrCommands,
  namespaces: {
    acr: {
      title: 'Container Registry',
      summary: '盘点 ACR 企业版实例、命名空间、镜像仓库和 tag；个人版由 deploy 兼容流程管理。',
      examples: ['licell acr instances --output json', 'licell acr repositories <instanceId> --output json'],
      agentTips: ['遵循 instances → namespaces/repositories → tags 的只读探索顺序；未封装能力继续走 capability fallback。']
    }
  },
  commands: [acrInstancesCommand, acrNamespacesCommand, acrRepositoriesCommand, acrTagsCommand]
});
