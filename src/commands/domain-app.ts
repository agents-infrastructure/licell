import type { CAC } from 'cac';
import { commandInvocation, defineCliCommand, defineCommandBundle, registerCliCommand } from './module';
import pc from 'picocolors';
import { normalizeReleaseTarget } from '../utils/cli-helpers';
import { bindAppDomainWorkflow, unbindAppDomainWorkflow } from '../workflows/domain';
import { executeWithAuthRecovery } from '../utils/auth-recovery';
import {
  ensureAuthOrExit,
  ensureDestructiveActionConfirmed,
  createSpinner,
  isInteractiveTTY,
  showIntro,
  showOutro,
  toPromptValue,
  withSpinner
} from '../utils/cli-shared';
import { emitCommandResult, isJsonOutput } from '../utils/output';


const domainAppBindCommand = defineCliCommand({
  rawName: 'domain app bind <domain>',
  description: '为当前应用编排 DNS、函数域名与可选 SSL',
  descriptor: {
    summary: '为当前应用编排 DNS CNAME、FC custom domain，并可选自动开启 HTTPS。',
    related: ['fn domain bind', 'dns records add', 'release promote'],
    optionInsights: {
      '--target': {
        whenToUse: '希望把域名流量路由到指定 alias（如 prod / preview）时使用。'
      },
      '--ssl': {
        whenToUse: '希望在绑定后立即具备 HTTPS 能力时使用。'
      },
      '--ssl-force-renew': {
        whenToUse: '需要忽略续签阈值，强制重新签发证书时使用。',
        cautions: ['必须与 `--ssl` 一起使用。']
      }
    },
    result: {
      summary: '结构化结果会返回域名绑定后的 alias / HTTPS 状态与最终访问地址。',
      outcomeKey: 'bound',
      fields: [
        { name: 'workflow', description: '固定为 app。' },
        { name: 'domain', description: '绑定后的自定义域名。' },
        { name: 'releaseTarget', description: '域名当前路由到的 FC alias。', required: false },
        { name: 'ssl', description: '本次是否请求自动开启 HTTPS。' },
        { name: 'aliasEnsured', description: '是否已自动确保 alias 存在并指向版本。' },
        { name: 'aliasVersionId', description: 'alias 最终对应的版本号。', required: false },
        { name: 'httpsConfigured', description: '最终是否已可通过 HTTPS 访问。' },
        { name: 'finalUrl', description: '最终访问 URL。' }
      ]
    }
  }
});

const domainAppUnbindCommand = defineCliCommand({
  rawName: 'domain app unbind <domain>',
  description: '解绑当前应用域名，并清理 FC custom domain / DNS CNAME',
  descriptor: {
    summary: '解绑应用域名，并清理对应 FC custom domain / DNS CNAME。',
    safety: {
      level: 'destructive',
      reason: '会解绑应用域名并清理对应 DNS CNAME。',
      confirmFlags: ['--yes']
    },
    related: ['fn domain unbind', 'dns records rm'],
    result: {
      summary: '结构化结果会返回已解绑域名，以及实际清理到的 FC / DNS 资源。',
      outcomeKey: 'unbound',
      fields: [
        { name: 'workflow', description: '固定为 app。' },
        { name: 'domain', description: '已解绑的自定义域名。' },
        { name: 'removedCustomDomain', description: '是否删除了对应 FC custom domain。' },
        { name: 'removedDnsRecordIds', description: '被清理的 DNS 记录 ID 列表。' }
      ]
    }
  }
});

export function registerDomainAppCommands(cli: CAC) {
  registerCliCommand(cli, domainAppBindCommand)
    .option('--ssl', '自动配置 Let\'s Encrypt 免费证书开启 HTTPS')
    .option('--ssl-force-renew', '配合 --ssl 强制续签证书（忽略到期阈值）')
    .option('--target <target>', '将域名路由到指定 FC alias（如 prod/preview）')
    .action(async (domain: string, options: { ssl?: boolean; sslForceRenew?: boolean; target?: string }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(domainAppBindCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc', 'dns']
        },
        async () => {
          showIntro(pc.bgCyan(pc.black(' 🌐 App Domain Workflow ')));
          await ensureAuthOrExit();
          const normalizedDomain = toPromptValue(domain, '域名');
          const releaseTarget = normalizeReleaseTarget(options.target);
          if (options.sslForceRenew && !options.ssl) throw new Error('--ssl-force-renew 需要与 --ssl 一起使用');

          const s = createSpinner();
          const result = await withSpinner(
            s,
            `正在配置应用域名 ${normalizedDomain}...`,
            '❌ 应用域名工作流执行失败',
            () => bindAppDomainWorkflow(normalizedDomain, {
              releaseTarget,
              enableHttps: Boolean(options.ssl),
              forceSslRenew: Boolean(options.sslForceRenew),
              spinner: s
            })
          );
          if (!result) return;
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ 应用域名工作流执行完成'));
          }
          if (isJsonOutput()) {
            emitCommandResult({
              workflow: 'app',
              domain: result.domainName,
              releaseTarget: result.releaseTarget,
              ssl: Boolean(options.ssl),
              aliasEnsured: result.aliasEnsured,
              aliasVersionId: result.aliasVersionId || null,
              httpsConfigured: result.httpsConfigured,
              finalUrl: result.finalUrl
            });
            return;
          }
          console.log(`\n🏷️  域名路由 alias=${pc.cyan(result.releaseTarget)}`);
          if (!result.aliasEnsured) {
            console.log(pc.yellow('⚠️ 未能自动确保 alias，可先 deploy 后再执行 licell release promote'));
          }
          showOutro(`🔗 你的应用现在可通过 ${pc.cyan(pc.underline(result.finalUrl))} 访问`);
        }
      );
    });

  registerCliCommand(cli, domainAppUnbindCommand)
    .option('--yes', '跳过二次确认（危险）')
    .action(async (domain: string, options: { yes?: boolean }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(domainAppUnbindCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc', 'dns', 'cdn']
        },
        async () => {
          showIntro(pc.bgCyan(pc.black(' 🌐 App Domain Removal ')));
          await ensureAuthOrExit();
          const normalizedDomain = toPromptValue(domain, '域名').toLowerCase();
          await ensureDestructiveActionConfirmed(`解绑应用域名 ${normalizedDomain}`, { yes: Boolean(options.yes) });
          const s = createSpinner();
          const result = await withSpinner(
            s,
            `正在解绑应用域名 ${normalizedDomain}...`,
            '❌ 应用域名解绑失败',
            () => unbindAppDomainWorkflow(normalizedDomain)
          );
          if (!result) return;
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ 应用域名已解绑并完成 CDN / DNS 清理'));
            showOutro('Done.');
            return;
          }
          emitCommandResult({
            workflow: 'app',
            domain: result.domainName,
            removedCdnDomain: result.removedCdnDomain,
            removedCustomDomain: result.removedCustomDomain,
            removedDnsRecordIds: result.removedDnsRecordIds
          });
        }
      );
    });
}

export const domainAppCommandBundle = defineCommandBundle({
  register: registerDomainAppCommands,
  namespaces: {
    'domain app': {
      summary: '面向应用/API 的域名 workflow，编排 DNS、FC custom domain、alias 与可选 HTTPS。',
      notes: ['`licell deploy --domain ...` / `--domain-suffix ...` 内部会复用同一套 app domain workflow。'],
      examples: ['licell domain app bind api.example.com --target prod', 'licell domain app unbind api.example.com --yes'],
      related: ['fn domain', 'dns records', 'release promote'],
      taskHints: [
        {
          phase: 'mutate',
          title: '给 API 绑定生产域名并启用 HTTPS',
          description: '执行 app workflow，同时编排 alias、DNS 与 SSL。',
          commands: ['licell domain app bind api.example.com --target prod --ssl']
        },
        {
          phase: 'cleanup',
          title: '下线应用域名',
          description: '解绑应用入口，并清理对应 CDN、FC custom domain 与 DNS CNAME。',
          commands: ['licell domain app unbind api.example.com --yes']
        }
      ]
    }
  },
  commands: [domainAppBindCommand, domainAppUnbindCommand]
});
