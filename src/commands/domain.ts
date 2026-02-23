import type { CAC } from 'cac';
import pc from 'picocolors';
import { normalizeReleaseTarget } from '../utils/cli-helpers';
import { bindCustomDomain, unbindCustomDomain } from '../providers/domain';
import { publishFunctionVersion, promoteFunctionAlias } from '../providers/fc';
import { issueAndBindSSL } from '../providers/ssl';
import { executeWithAuthRecovery } from '../utils/auth-recovery';
import {
  ensureAuthOrExit,
  ensureDestructiveActionConfirmed,
  createSpinner,
  isInteractiveTTY,
  isNoChangesPublishError,
  getLatestPublishedVersionId,
  showIntro,
  showOutro,
  requireAppName,
  toPromptValue,
  withSpinner
} from '../utils/cli-shared';
import { Config } from '../utils/config';
import { emitCliResult, isJsonOutput } from '../utils/output';

export function registerDomainCommands(cli: CAC) {
  cli.command('domain add <domain>', '绑定自定义域名')
    .option('--ssl', '自动配置 Let\'s Encrypt 免费证书开启 HTTPS')
    .option('--ssl-force-renew', '配合 --ssl 强制续签证书（忽略到期阈值）')
    .option('--target <target>', '将域名路由到指定 FC alias（如 prod/preview）')
    .action(async (domain: string, options: { ssl?: boolean; sslForceRenew?: boolean; target?: string }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: 'licell domain add',
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc', 'dns']
        },
        async () => {
          showIntro(pc.bgCyan(pc.black(' 🌐 Domain & SSL Configuration ')));
          const auth = await ensureAuthOrExit();
          const normalizedDomain = toPromptValue(domain, '域名');
          const releaseTarget = normalizeReleaseTarget(options.target);
          if (options.sslForceRenew && !options.ssl) throw new Error('--ssl-force-renew 需要与 --ssl 一起使用');
          const project = Config.getProject();
          requireAppName(project);

          const s = createSpinner();
          const finalUrl = await withSpinner(
            s,
            `正在配置云解析 DNS，将 ${normalizedDomain} 指向应用...`,
            '❌ 配置流程中断',
            async () => {
              const targetFcDomain = `${auth.accountId}.${auth.region}.fc.aliyuncs.com`;
              await bindCustomDomain(normalizedDomain, targetFcDomain, releaseTarget);
              try {
                s.message(`正在确保别名 ${releaseTarget} 存在...`);
                let versionId: string;
                try {
                  versionId = await publishFunctionVersion(
                    project.appName!,
                    `domain bind ${releaseTarget} at ${new Date().toISOString()}`
                  );
                } catch (publishErr: unknown) {
                  if (!isNoChangesPublishError(publishErr)) throw publishErr;
                  versionId = await getLatestPublishedVersionId(project.appName!);
                }
                await promoteFunctionAlias(
                  project.appName!,
                  releaseTarget,
                  versionId,
                  `domain bind by licell at ${new Date().toISOString()}`
                );
              } catch {
                if (!isJsonOutput()) {
                  console.warn(pc.yellow(`⚠️ 未能自动创建别名 ${releaseTarget}，请先 deploy 后执行 licell release promote`));
                }
              }
              if (options.ssl) {
                s.message('DNS CNAME 配置成功。正在接管 Let\'s Encrypt 签发流程...');
                return issueAndBindSSL(normalizedDomain, s, { forceRenew: Boolean(options.sslForceRenew) });
              }
              return `http://${normalizedDomain}`;
            }
          );
          if (!finalUrl) return;
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ 域名绑定与网络平面配置大功告成！'));
          }
          if (isJsonOutput()) {
            emitCliResult({
              stage: 'domain.add',
              domain: normalizedDomain,
              releaseTarget: releaseTarget || null,
              ssl: Boolean(options.ssl),
              finalUrl
            });
            return;
          }
          if (releaseTarget) {
            console.log(`\n🏷️  域名路由已绑定 alias=${pc.cyan(releaseTarget)}\n`);
          }
          showOutro(`🔗 你的应用现在可通过安全的 ${pc.cyan(pc.underline(finalUrl))} 访问`);
        }
      );
    });

  cli.command('domain rm <domain>', '解绑自定义域名并清理 DNS CNAME')
    .option('--yes', '跳过二次确认（危险）')
    .action(async (domain: string, options: { yes?: boolean }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: 'licell domain rm',
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc', 'dns']
        },
        async () => {
          showIntro(pc.bgCyan(pc.black(' 🌐 Domain Removal ')));
          await ensureAuthOrExit();
          const normalizedDomain = toPromptValue(domain, '域名').toLowerCase();
          await ensureDestructiveActionConfirmed(`解绑域名 ${normalizedDomain}`, { yes: Boolean(options.yes) });
          const s = createSpinner();
          const removed = await withSpinner(
            s,
            `正在解绑域名 ${normalizedDomain}...`,
            '❌ 域名解绑失败',
            async () => {
              await unbindCustomDomain(normalizedDomain);
              return true;
            }
          );
          if (!removed) return;
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ 域名已解绑并完成 DNS 清理'));
            showOutro('Done.');
          } else {
            emitCliResult({
              stage: 'domain.rm',
              domain: normalizedDomain,
              removed: true
            });
          }
        }
      );
    });
}
