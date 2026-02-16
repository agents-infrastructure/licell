import type { CAC } from 'cac';
import { intro, outro, spinner } from '@clack/prompts';
import pc from 'picocolors';
import { formatErrorMessage } from '../utils/errors';
import { normalizeReleaseTarget } from '../utils/cli-helpers';
import { bindCustomDomain, unbindCustomDomain } from '../providers/domain';
import { issueAndBindSSL } from '../providers/ssl';
import {
  ensureAuthOrExit,
  requireAppName,
  toPromptValue
} from '../utils/cli-shared';
import { Config } from '../utils/config';

export function registerDomainCommands(cli: CAC) {
  cli.command('domain add <domain>', '绑定自定义域名')
    .option('--ssl', '自动配置 Let\'s Encrypt 免费证书开启 HTTPS')
    .option('--ssl-force-renew', '配合 --ssl 强制续签证书（忽略到期阈值）')
    .option('--target <target>', '将域名路由到指定 FC alias（如 prod/preview）')
    .action(async (domain: string, options: { ssl?: boolean; sslForceRenew?: boolean; target?: string }) => {
      intro(pc.bgCyan(pc.black(' 🌐 Domain & SSL Configuration ')));
      const auth = ensureAuthOrExit();
      const normalizedDomain = toPromptValue(domain, '域名');
      const releaseTarget = options.target ? normalizeReleaseTarget(options.target) : undefined;
      if (options.sslForceRenew && !options.ssl) throw new Error('--ssl-force-renew 需要与 --ssl 一起使用');
      const project = Config.getProject();
      requireAppName(project);

      const s = spinner();
      try {
        s.start(`正在配置云解析 DNS，将 ${normalizedDomain} 指向应用...`);
        const targetFcDomain = `${auth.accountId}.${auth.region}.fc.aliyuncs.com`;
        await bindCustomDomain(normalizedDomain, targetFcDomain, releaseTarget);
        let finalUrl = `http://${normalizedDomain}`;
        if (options.ssl) {
          s.message('DNS CNAME 配置成功。正在接管 Let\'s Encrypt 签发流程...');
          finalUrl = await issueAndBindSSL(normalizedDomain, s, { forceRenew: Boolean(options.sslForceRenew) });
        }
        s.stop(pc.green('✅ 域名绑定与网络平面配置大功告成！'));
        if (releaseTarget) {
          console.log(`\n🏷️  域名路由已绑定 alias=${pc.cyan(releaseTarget)}\n`);
        }
        outro(`🔗 你的应用现在可通过安全的 ${pc.cyan(pc.underline(finalUrl))} 访问`);
      } catch (err: unknown) {
        s.stop(pc.red('❌ 配置流程中断'));
        console.error(formatErrorMessage(err));
        process.exitCode = 1;
      }
    });

  cli.command('domain rm <domain>', '解绑自定义域名并清理 DNS CNAME')
    .action(async (domain: string) => {
      intro(pc.bgCyan(pc.black(' 🌐 Domain Removal ')));
      ensureAuthOrExit();
      const normalizedDomain = toPromptValue(domain, '域名').toLowerCase();
      const s = spinner();
      s.start(`正在解绑域名 ${normalizedDomain}...`);
      try {
        await unbindCustomDomain(normalizedDomain);
        s.stop(pc.green('✅ 域名已解绑并完成 DNS 清理'));
        outro('Done.');
      } catch (err: unknown) {
        s.stop(pc.red('❌ 域名解绑失败'));
        console.error(formatErrorMessage(err));
        process.exitCode = 1;
      }
    });
}
