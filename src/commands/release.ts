import type { CAC } from 'cac';
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
import { emitCliResult, isJsonOutput } from '../utils/output';

export function registerReleaseCommands(cli: CAC) {
  cli.command('release list', '查看函数版本列表')
    .option('--limit <n>', '返回版本数量，默认 20')
    .action(async (options: { limit?: string }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: 'licell release list',
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
            emitCliResult({
              stage: 'release.list',
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

  cli.command('release promote [versionId]', '发布并切流到目标别名')
    .option('--target <target>', '目标别名，默认 prod')
    .action(async (versionIdArg: string | undefined, options: { target?: string }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: 'licell release promote',
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
            emitCliResult({
              stage: 'release.promote',
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

  cli.command('release rollback <versionId>', '回滚到指定函数版本')
    .option('--target <target>', '目标别名，默认 prod')
    .action(async (versionId: string, options: { target?: string }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: 'licell release rollback',
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
            emitCliResult({
              stage: 'release.rollback',
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

  cli.command('release prune', '清理历史函数版本（默认仅预览）')
    .option('--keep <n>', '保留最近 N 个版本，默认 10')
    .option('--apply', '执行删除，未传则仅预览')
    .option('--yes', '跳过二次确认（危险）')
    .action(async (options: { keep?: string; apply?: boolean; yes?: boolean }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: 'licell release prune',
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc']
        },
        async () => {
          showIntro(pc.bgBlue(pc.white(' 🧹 Prune Function Versions ')));
          ensureAuthOrExit();
          const project = Config.getProject();
          requireAppName(project);

          const keep = parseOptionalPositiveInt(options.keep, 'keep') || 10;
          const apply = Boolean(options.apply);
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
            emitCliResult({
              stage: 'release.prune',
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
