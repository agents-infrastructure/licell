import type { CAC } from 'cac';
import { defineCommandModule, commandInvocation, defineCliCommand, registerCliCommand } from './module';
import pc from 'picocolors';
import { normalizeReleaseTarget } from '../utils/cli-helpers';
import { executeWithAuthRecovery } from '../utils/auth-recovery';
import {
  publishFunctionVersion,
  promoteFunctionAlias,
  pruneFunctionVersions,
  listFunctionVersions
} from '../providers/fc';
import {
  ensureAuthOrExit,
  ensureDestructiveActionConfirmed,
  createSpinner,
  showIntro,
  showOutro,
  requireAppName,
  toPromptValue,
  isNoChangesPublishError,
  getLatestPublishedVersionId,
  isInteractiveTTY,
  parseListLimit,
  parseOptionalPositiveInt,
  withSpinner
} from '../utils/cli-shared';
import { Config } from '../utils/config';
import { emitCommandResult, isJsonOutput } from '../utils/output.js';
import { prunePreviewDomainsWorkflow } from '../workflows/preview';
import { DELIVERY_SECTION } from './sections';

const releaseListCommand = defineCliCommand({
  rawName: 'release list',
  description: '查看函数版本列表',
  options: [
    { rawName: '--limit <n>', description: '返回版本数量，默认 20' }
  ]
});

const releasePromoteCommand = defineCliCommand({
  rawName: 'release promote [versionId]',
  description: '发布并切流到目标别名',
  options: [
    { rawName: '--target <target>', description: '目标别名，默认 prod' }
  ],
  descriptor: {
    title: 'Promote FC release',
    safety: {
      level: 'mutating',
      reason: '会切换 alias 指向的线上版本。'
    }
  }
});

const releaseRollbackCommand = defineCliCommand({
  rawName: 'release rollback <versionId>',
  description: '回滚到指定函数版本',
  options: [
    { rawName: '--target <target>', description: '目标别名，默认 prod' }
  ],
  descriptor: {
    title: 'Rollback FC release',
    safety: {
      level: 'destructive',
      reason: '会将线上流量回滚到旧版本，执行前请确认目标版本。'
    }
  }
});

const releasePruneCommand = defineCliCommand({
  rawName: 'release prune',
  description: '清理历史函数版本（默认仅预览）',
  options: [
    { rawName: '--keep <n>', description: '保留最近 N 个版本，默认 10' },
    { rawName: '--apply', description: '执行删除，未传则仅预览' },
    { rawName: '--yes', description: '跳过二次确认（危险）' },
    { rawName: '--preview', description: '清理预览域名绑定（而非函数版本）' }
  ],
  descriptor: {
    title: 'Prune FC historical versions',
    notes: ['默认仅预览；传 `--apply` 才会真正删除。'],
    optionInsights: {
      '--keep': { whenToUse: '需要显式控制保留最近多少个版本时使用。', cautions: ['数值过小可能导致缺少可回滚版本。'] },
      '--apply': { whenToUse: '确认预览结果后，再加上它执行真实删除。', cautions: ['不加时仅预览；加上后会真正删除。'] },
      '--yes': { whenToUse: '非交互自动化场景下跳过二次确认时使用。', cautions: ['建议仅在前一步已经做过预览时使用。'] },
      '--preview': { whenToUse: '你想清理预览域名绑定，而不是函数版本时使用。', cautions: ['不要和函数版本清理目标混淆。'] }
    },
    recommendedFlow: [
      { title: '先预览', command: 'licell release prune --output json', reason: '先看待删除项，避免误删历史版本。' },
      { title: '调整保留数', command: 'licell release prune --keep <n>', reason: '根据回滚需求决定最小保留版本数量。' },
      { title: '确认后执行', command: 'licell release prune --apply --yes', reason: '在非交互场景下执行真实清理。' }
    ],
    examples: ['licell release prune', 'licell release prune --keep 5', 'licell release prune --apply --yes'],
    agentTips: ['Agent 先执行默认预览，再决定是否加 `--apply`。'],
    safety: {
      level: 'destructive',
      reason: '可能删除历史函数版本或预览域名绑定，建议先预览并确认保留策略。',
      confirmFlags: ['--apply', '--yes']
    }
  }
});

export function registerReleaseCommands(cli: CAC) {
  registerCliCommand(cli, releaseListCommand)
    .action(async (options: { limit?: string }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(releaseListCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc']
        },
        async () => {
          showIntro(pc.bgBlue(pc.white(' 📚 Function Versions ')));
          ensureAuthOrExit();
          const project = Config.getProject();
          requireAppName(project);

          const limit = parseListLimit(options.limit, 20, 100);

          const s = createSpinner();
          const versions = await withSpinner(
            s,
            '正在拉取函数版本列表...',
            '❌ 获取版本列表失败',
            () => listFunctionVersions(project.appName, limit)
          );
          if (!versions) return;
          if (!isJsonOutput()) {
            s.stop(pc.green(`✅ 共获取 ${versions.length} 个版本`));
          }
          if (isJsonOutput()) {
            emitCommandResult({
              appName: project.appName,
              count: versions.length,
              versions
            });
            return;
          }
          if (versions.length === 0) {
            showOutro('当前函数还没有已发布版本');
            return;
          }
          for (const version of versions) {
            const id = version.versionId || 'unknown';
            const time = version.createdTime || '-';
            const desc = version.description || '-';
            console.log(`${pc.cyan(id)}  ${pc.gray(time)}  ${desc}`);
          }
          showOutro('Done.');
        }
      );
    });

  registerCliCommand(cli, releasePromoteCommand)
    .action(async (versionIdArg: string | undefined, options: { target?: string }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(releasePromoteCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc']
        },
        async () => {
          showIntro(pc.bgBlue(pc.white(' 🚀 Promote Release ')));
          ensureAuthOrExit();
          const project = Config.getProject();
          requireAppName(project);

          const target = normalizeReleaseTarget(options.target);
          const s = createSpinner();
          const versionId = await withSpinner(
            s,
            `正在准备发布到别名 ${target}...`,
            '❌ 切流失败',
            async () => {
              let resolvedVersionId = versionIdArg ? toPromptValue(versionIdArg, 'versionId') : '';
              if (!resolvedVersionId) {
                s.message('未指定 versionId，正在发布当前函数代码为新版本...');
                try {
                  resolvedVersionId = await publishFunctionVersion(
                    project.appName,
                    `promote ${target} at ${new Date().toISOString()}`
                  );
                } catch (publishErr: unknown) {
                  if (!isNoChangesPublishError(publishErr)) throw publishErr;
                  s.message('检测到当前代码无变更，复用最新已发布版本...');
                  resolvedVersionId = await getLatestPublishedVersionId(project.appName);
                }
              }
              await promoteFunctionAlias(
                project.appName,
                target,
                resolvedVersionId,
                `promoted by licell at ${new Date().toISOString()}`
              );
              return resolvedVersionId;
            }
          );
          if (!versionId) return;
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ 别名切流完成'));
          }
          if (isJsonOutput()) {
            emitCommandResult({
              appName: project.appName,
              target,
              versionId
            });
            return;
          }
          console.log(`\n🏷️  alias=${pc.cyan(target)} -> version=${pc.cyan(versionId)}\n`);
          showOutro('Done.');
        }
      );
    });

  registerCliCommand(cli, releaseRollbackCommand)
    .action(async (versionId: string, options: { target?: string }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(releaseRollbackCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc']
        },
        async () => {
          showIntro(pc.bgBlue(pc.white(' ↩ Rollback Release ')));
          ensureAuthOrExit();
          const project = Config.getProject();
          requireAppName(project);

          const target = normalizeReleaseTarget(options.target);
          const rollbackVersion = toPromptValue(versionId, 'versionId');
          const s = createSpinner();
          const rolledBack = await withSpinner(
            s,
            `正在回滚 ${target} 到版本 ${rollbackVersion}...`,
            '❌ 回滚失败',
            async () => {
              await promoteFunctionAlias(
                project.appName,
                target,
                rollbackVersion,
                `rollback by licell at ${new Date().toISOString()}`
              );
              return true;
            }
          );
          if (!rolledBack) return;
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ 回滚完成'));
          }
          if (isJsonOutput()) {
            emitCommandResult({
              appName: project.appName,
              target,
              versionId: rollbackVersion
            });
            return;
          }
          console.log(`\n🏷️  alias=${pc.cyan(target)} -> version=${pc.cyan(rollbackVersion)}\n`);
          showOutro('Done.');
        }
      );
    });

  registerCliCommand(cli, releasePruneCommand)
    .action(async (options: { keep?: string; apply?: boolean; yes?: boolean; preview?: boolean }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(releasePruneCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: options.preview ? ['fc', 'dns'] : ['fc']
        },
        async () => {
          showIntro(pc.bgBlue(pc.white(options.preview ? ' 🧹 Prune Preview Domains ' : ' 🧹 Prune Function Versions ')));
          ensureAuthOrExit();
          const project = Config.getProject();
          requireAppName(project);

          const keep = parseOptionalPositiveInt(options.keep, 'keep') || (options.preview ? 3 : 10);
          const apply = Boolean(options.apply);

          if (options.preview) {
            if (apply) {
              await ensureDestructiveActionConfirmed(`清理预览域名绑定（保留最近 ${keep} 个）`, { yes: Boolean(options.yes) });
            }
            const s = createSpinner();
            const result = await withSpinner(
              s,
              apply ? '正在清理预览域名...' : '正在预览可清理的预览域名...',
              '❌ 清理失败',
              () => prunePreviewDomainsWorkflow(project.appName, keep, apply)
            );
            if (!result) return;
            if (!isJsonOutput()) {
              s.stop(pc.green(apply ? '✅ 清理任务完成' : '✅ 预览完成'));
            }
            if (isJsonOutput()) {
              emitCommandResult({
                appName: project.appName,
                keepRequested: keep,
                applyRequested: apply,
                ...result
              }, { stage: 'release.prune.preview' });
              return;
            }
            console.log(`\n保留数量: ${pc.cyan(String(result.keep))}`);
            console.log(`发现预览域名: ${pc.cyan(String(result.totalPreviewDomains))}`);
            console.log(`候选删除: ${pc.cyan(String(result.candidates.length))}`);
            if (result.candidates.length > 0) {
              console.log(`候选: ${result.candidates.join(', ')}`);
            }
            if (apply) {
              console.log(`已删除域名绑定: ${pc.cyan(String(result.deletedDomains.length))}`);
              console.log(`已删除 OSS 路径: ${pc.cyan(String(result.deletedOssPaths.length))}`);
              if (result.failed.length > 0) {
                console.log(pc.yellow(`删除失败: ${result.failed.length}`));
                for (const item of result.failed) {
                  console.log(pc.yellow(`- ${item.domain}: ${item.reason}`));
                }
              }
            } else {
              console.log(pc.gray('\n提示: 加上 --apply 才会执行实际删除'));
            }
            console.log('');
            showOutro('Done.');
            return;
          }

          if (apply) {
            await ensureDestructiveActionConfirmed(`清理函数历史版本（保留最近 ${keep} 个）`, { yes: Boolean(options.yes) });
          }
          const s = createSpinner();
          const result = await withSpinner(
            s,
            apply ? '正在清理历史版本...' : '正在预览可清理版本...',
            '❌ 清理失败',
            () => pruneFunctionVersions(project.appName, keep, apply)
          );
          if (!result) return;
          if (!isJsonOutput()) {
            s.stop(pc.green(apply ? '✅ 清理任务完成' : '✅ 预览完成'));
          }
          if (isJsonOutput()) {
            emitCommandResult({
              appName: project.appName,
              keepRequested: keep,
              applyRequested: apply,
              ...result
            });
            return;
          }
          console.log(`\n保留数量: ${pc.cyan(String(result.keep))}`);
          console.log(`总发布版本: ${pc.cyan(String(result.totalVersions))}`);
          console.log(`Alias 保护版本: ${pc.cyan(String(result.aliasProtectedVersions.length))}`);
          console.log(`候选删除版本: ${pc.cyan(String(result.candidates.length))}`);
          if (result.candidates.length > 0) {
            console.log(`候选: ${result.candidates.join(', ')}`);
          }
          if (apply) {
            console.log(`已删除: ${pc.cyan(String(result.deleted.length))}`);
            if (result.failed.length > 0) {
              console.log(pc.yellow(`删除失败: ${result.failed.length}`));
              for (const item of result.failed) {
                console.log(pc.yellow(`- ${item.versionId}: ${item.reason}`));
              }
            }
          } else {
            console.log(pc.gray('\n提示: 加上 --apply 才会执行实际删除'));
          }
          console.log('');
          showOutro('Done.');
        }
      );
    });
}

export const releaseCommandModule = defineCommandModule({
  section: DELIVERY_SECTION,
  register: registerReleaseCommands,
  namespaces: {
    release: {
      summary: '函数版本管理、切流、回滚与清理。',
      examples: ['licell release list', 'licell release promote <versionId>', 'licell release rollback <versionId>']
    }
  },
  commands: [releaseListCommand, releasePromoteCommand, releaseRollbackCommand, releasePruneCommand]
});
