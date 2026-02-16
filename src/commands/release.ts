import type { CAC } from 'cac';
import { intro, outro, spinner } from '@clack/prompts';
import pc from 'picocolors';
import { formatErrorMessage } from '../utils/errors';
import { normalizeReleaseTarget } from '../utils/cli-helpers';
import {
  publishFunctionVersion,
  promoteFunctionAlias,
  pruneFunctionVersions,
  listFunctionVersions
} from '../providers/fc';
import {
  ensureAuthOrExit,
  requireAppName,
  toPromptValue,
  isNoChangesPublishError,
  getLatestPublishedVersionId
} from '../utils/cli-shared';
import { Config } from '../utils/config';

export function registerReleaseCommands(cli: CAC) {
  cli.command('release list', '查看函数版本列表')
    .option('--limit <n>', '返回版本数量，默认 20')
    .action(async (options: { limit?: string }) => {
      intro(pc.bgBlue(pc.white(' 📚 Function Versions ')));
      ensureAuthOrExit();
      const project = Config.getProject();
      requireAppName(project);

      const requestedLimit = options.limit ? Number(options.limit) : 20;
      const limit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.min(Math.floor(requestedLimit), 100) : 20;

      const s = spinner();
      s.start('正在拉取函数版本列表...');
      try {
        const versions = await listFunctionVersions(project.appName, limit);
        s.stop(pc.green(`✅ 共获取 ${versions.length} 个版本`));
        if (versions.length === 0) {
          outro('当前函数还没有已发布版本');
          return;
        }
        for (const version of versions) {
          const id = version.versionId || 'unknown';
          const time = version.createdTime || '-';
          const desc = version.description || '-';
          console.log(`${pc.cyan(id)}  ${pc.gray(time)}  ${desc}`);
        }
        outro('Done.');
      } catch (err: unknown) {
        s.stop(pc.red('❌ 获取版本列表失败'));
        console.error(formatErrorMessage(err));
        process.exitCode = 1;
      }
    });

  cli.command('release promote [versionId]', '发布并切流到目标别名')
    .option('--target <target>', '目标别名，默认 prod')
    .action(async (versionIdArg: string | undefined, options: { target?: string }) => {
      intro(pc.bgBlue(pc.white(' 🚀 Promote Release ')));
      ensureAuthOrExit();
      const project = Config.getProject();
      requireAppName(project);

      const target = normalizeReleaseTarget(options.target);
      const s = spinner();
      s.start(`正在准备发布到别名 ${target}...`);
      try {
        let versionId = versionIdArg ? toPromptValue(versionIdArg, 'versionId') : '';
        if (!versionId) {
          s.message('未指定 versionId，正在发布当前函数代码为新版本...');
          try {
            versionId = await publishFunctionVersion(
              project.appName,
              `promote ${target} at ${new Date().toISOString()}`
            );
          } catch (publishErr: unknown) {
            if (!isNoChangesPublishError(publishErr)) throw publishErr;
            s.message('检测到当前代码无变更，复用最新已发布版本...');
            versionId = await getLatestPublishedVersionId(project.appName);
          }
        }
        await promoteFunctionAlias(project.appName, target, versionId, `promoted by aero-cli at ${new Date().toISOString()}`);
        s.stop(pc.green('✅ 别名切流完成'));
        console.log(`\n🏷️  alias=${pc.cyan(target)} -> version=${pc.cyan(versionId)}\n`);
        outro('Done.');
      } catch (err: unknown) {
        s.stop(pc.red('❌ 切流失败'));
        console.error(formatErrorMessage(err));
        process.exitCode = 1;
      }
    });

  cli.command('release rollback <versionId>', '回滚到指定函数版本')
    .option('--target <target>', '目标别名，默认 prod')
    .action(async (versionId: string, options: { target?: string }) => {
      intro(pc.bgBlue(pc.white(' ↩ Rollback Release ')));
      ensureAuthOrExit();
      const project = Config.getProject();
      requireAppName(project);

      const target = normalizeReleaseTarget(options.target);
      const rollbackVersion = toPromptValue(versionId, 'versionId');
      const s = spinner();
      s.start(`正在回滚 ${target} 到版本 ${rollbackVersion}...`);
      try {
        await promoteFunctionAlias(
          project.appName,
          target,
          rollbackVersion,
          `rollback by aero-cli at ${new Date().toISOString()}`
        );
        s.stop(pc.green('✅ 回滚完成'));
        console.log(`\n🏷️  alias=${pc.cyan(target)} -> version=${pc.cyan(rollbackVersion)}\n`);
        outro('Done.');
      } catch (err: unknown) {
        s.stop(pc.red('❌ 回滚失败'));
        console.error(formatErrorMessage(err));
        process.exitCode = 1;
      }
    });

  cli.command('release prune', '清理历史函数版本（默认仅预览）')
    .option('--keep <n>', '保留最近 N 个版本，默认 10')
    .option('--apply', '执行删除，未传则仅预览')
    .action(async (options: { keep?: string; apply?: boolean }) => {
      intro(pc.bgBlue(pc.white(' 🧹 Prune Function Versions ')));
      ensureAuthOrExit();
      const project = Config.getProject();
      requireAppName(project);

      const requestedKeep = options.keep ? Number(options.keep) : 10;
      const keep = Number.isFinite(requestedKeep) && requestedKeep > 0 ? Math.floor(requestedKeep) : 10;
      const apply = Boolean(options.apply);
      const s = spinner();
      s.start(apply ? '正在清理历史版本...' : '正在预览可清理版本...');

      try {
        const result = await pruneFunctionVersions(project.appName, keep, apply);
        s.stop(pc.green(apply ? '✅ 清理任务完成' : '✅ 预览完成'));
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
        outro('Done.');
      } catch (err: unknown) {
        s.stop(pc.red('❌ 清理失败'));
        console.error(formatErrorMessage(err));
        process.exitCode = 1;
      }
    });
}
