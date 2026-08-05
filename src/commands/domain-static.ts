import type { CAC } from 'cac';
import { commandInvocation, defineCliCommand, defineCommandBundle, registerCliCommand } from './module';
import pc from 'picocolors';
import { Config } from '../utils/config';
import { resolveOssBucketName } from '../providers/oss';
import { issueAndBindSSLWithArtifacts } from '../providers/ssl';
import { bindStaticDomainWorkflow, unbindStaticDomainWorkflow } from '../workflows/domain';
import { executeWithAuthRecovery } from '../utils/auth-recovery';
import {
  ensureAuthOrExit,
  ensureDestructiveActionConfirmed,
  createSpinner,
  isInteractiveTTY,
  requireAppName,
  showIntro,
  showOutro,
  toOptionalString,
  toPromptValue,
  withSpinner
} from '../utils/cli-shared';
import { emitCommandResult, isJsonOutput } from '../utils/output';


const domainStaticBindCommand = defineCliCommand({
  rawName: 'domain static bind <domain>',
  description: '为静态站点编排 CDN、DNS 与可选 HTTPS',
  region: { scope: 'project' },
  options: [
    { rawName: '--component <name>', description: '在 workspace / monorepo 根目录显式选择 component' },
    { rawName: '--bucket <bucket>', description: '指定已有 OSS Bucket；默认使用当前项目推导出的 Bucket' },
    { rawName: '--ssl', description: '自动签发证书并配置 CDN HTTPS' },
    { rawName: '--ssl-force-renew', description: '配合 --ssl 强制续签证书（忽略到期阈值）' }
  ],
  descriptor: {
    summary: '将静态站点域名接到 CDN，并把 DNS CNAME 切到 CDN；可选自动启用 HTTPS。',
    related: ['oss domain bind', 'deploy --type static'],
    optionInsights: {
      '--bucket': {
        whenToUse: '当前目录不是 licell 项目，或需要显式指定已有 OSS Bucket 时使用。'
      },
      '--ssl': {
        whenToUse: '希望在静态域名接入后立即具备 CDN HTTPS 能力时使用。'
      },
      '--ssl-force-renew': {
        whenToUse: '需要忽略续签阈值，强制重新签发证书时使用。',
        cautions: ['必须与 `--ssl` 一起使用。']
      }
    },
    result: {
      summary: '结构化结果会返回静态域名接入 CDN 后的源站、CNAME 与最终访问 URL。',
      outcomeKey: 'bound',
      fields: [
        { name: 'workflow', description: '固定为 static。' },
        { name: 'domain', description: '绑定后的静态站点域名。' },
        { name: 'bucket', description: '关联的 OSS Bucket 名称。' },
        { name: 'originDomain', description: 'CDN 回源使用的 OSS 域名。' },
        { name: 'cdnCname', description: 'CDN 分配的 CNAME。' },
        { name: 'ssl', description: '本次是否请求自动开启 HTTPS。' },
        { name: 'httpsConfigured', description: '最终是否已可通过 HTTPS 访问。' },
        { name: 'finalUrl', description: '最终访问 URL。' }
      ]
    }
  }
});

const domainStaticUnbindCommand = defineCliCommand({
  rawName: 'domain static unbind <domain>',
  description: '解绑静态站点域名，并清理 CDN / DNS',
  region: { scope: 'project' },
  descriptor: {
    summary: '解绑静态站点域名，并清理对应 CDN domain / DNS CNAME。',
    safety: {
      level: 'destructive',
      reason: '会解绑静态域名并清理 CDN / DNS。',
      confirmFlags: ['--yes']
    },
    related: ['oss domain unbind', 'dns records rm'],
    result: {
      summary: '结构化结果会返回已解绑域名，以及实际清理到的 DNS 记录。',
      outcomeKey: 'unbound',
      fields: [
        { name: 'workflow', description: '固定为 static。' },
        { name: 'domain', description: '已解绑的静态站点域名。' },
        { name: 'removedDnsRecordIds', description: '被清理的 DNS 记录 ID 列表。' }
      ]
    }
  }
});

export function registerDomainStaticCommands(cli: CAC) {
  registerCliCommand(cli, domainStaticBindCommand)
    .option('--component <name>', '在 workspace / monorepo 根目录显式选择 component')
    .option('--bucket <bucket>', '指定已有 OSS Bucket；默认使用当前项目推导出的 Bucket')
    .option('--ssl', '自动签发证书并配置 CDN HTTPS')
    .option('--ssl-force-renew', '配合 --ssl 强制续签证书（忽略到期阈值）')
    .action(async (domain: string, options: { component?: unknown; bucket?: unknown; ssl?: boolean; sslForceRenew?: boolean }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(domainStaticBindCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['oss', 'cdn', 'dns']
        },
        async () => {
          showIntro(pc.bgCyan(pc.black(' 🌐 Static Domain Workflow ')));
          await ensureAuthOrExit();
          const normalizedDomain = toPromptValue(domain, '域名');
          const component = toOptionalString(options.component);
          const project = Config.getProject(component ? { component } : undefined);
          const bucketName = (() => {
            const explicitBucket = toOptionalString(options.bucket);
            if (explicitBucket) return explicitBucket;
            if (!component) return undefined;
            requireAppName(project);
            return resolveOssBucketName(project.appName);
          })();
          if (options.sslForceRenew && !options.ssl) throw new Error('--ssl-force-renew 需要与 --ssl 一起使用');

          const s = createSpinner();
          const result = await withSpinner(
            s,
            `正在为静态站点配置域名 ${normalizedDomain}...`,
            '❌ 静态域名工作流执行失败',
            async () => {
              let tlsArtifacts: { certificate?: string; privateKey?: string } | undefined;
              if (options.ssl) {
                const sslResult = await issueAndBindSSLWithArtifacts(normalizedDomain, s, {
                  forceRenew: Boolean(options.sslForceRenew),
                  bindToFcDomain: false
                });
                tlsArtifacts = {
                  certificate: sslResult.certificate,
                  privateKey: sslResult.privateKey
                };
              }
              return await bindStaticDomainWorkflow(normalizedDomain, {
                bucketName,
                tlsArtifacts,
                preferHttps: Boolean(options.ssl)
              });
            }
          );
          if (!result) return;
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ 静态域名工作流执行完成'));
          }
          if (isJsonOutput()) {
            emitCommandResult({
              workflow: 'static',
              component: component || null,
              domain: result.domainName,
              bucket: result.bucketName,
              originDomain: result.originDomain,
              cdnCname: result.cdnCname,
              ssl: Boolean(options.ssl),
              httpsConfigured: result.httpsConfigured,
              finalUrl: result.finalUrl
            });
            return;
          }
          console.log(`\nbucket:    ${pc.cyan(result.bucketName)}`);
          console.log(`origin:    ${pc.cyan(result.originDomain)}`);
          console.log(`cdn cname: ${pc.cyan(result.cdnCname)}`);
          showOutro(`🔗 静态站点现在可通过 ${pc.cyan(pc.underline(result.finalUrl))} 访问`);
        }
      );
    });

  registerCliCommand(cli, domainStaticUnbindCommand)
    .option('--yes', '跳过二次确认（危险）')
    .action(async (domain: string, options: { yes?: boolean }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(domainStaticUnbindCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['cdn', 'dns']
        },
        async () => {
          showIntro(pc.bgCyan(pc.black(' 🌐 Static Domain Removal ')));
          await ensureAuthOrExit();
          const normalizedDomain = toPromptValue(domain, '域名').toLowerCase();
          await ensureDestructiveActionConfirmed(`解绑静态域名 ${normalizedDomain}`, { yes: Boolean(options.yes) });
          const s = createSpinner();
          const result = await withSpinner(
            s,
            `正在解绑静态域名 ${normalizedDomain}...`,
            '❌ 静态域名解绑失败',
            () => unbindStaticDomainWorkflow(normalizedDomain)
          );
          if (!result) return;
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ 静态域名已解绑并完成 CDN / DNS 清理'));
            showOutro('Done.');
            return;
          }
          emitCommandResult({
            workflow: 'static',
            domain: result.domainName,
            removedDnsRecordIds: result.removedDnsRecordIds
          });
        }
      );
    });
}

export const domainStaticCommandBundle = defineCommandBundle({
  register: registerDomainStaticCommands,
  namespaces: {
    'domain static': {
      summary: '面向静态站点的域名 workflow，编排 CDN、DNS 与可选 HTTPS。',
      notes: ['`licell deploy --type static --domain ...` 内部复用同一套 static domain workflow。'],
      examples: ['licell domain static bind static.example.com --ssl', 'licell domain static unbind static.example.com --yes'],
      related: ['oss domain', 'dns records', 'deploy --type static'],
      taskHints: [
        {
          phase: 'mutate',
          title: '给静态站点绑定域名',
          description: '执行 static workflow，同时处理 CDN、DNS 与 HTTPS。',
          commands: ['licell domain static bind static.example.com --ssl']
        },
        {
          phase: 'cleanup',
          title: '下线静态站点域名',
          description: '解绑静态站点域名，并清理关联 CDN / DNS 配置。',
          commands: ['licell domain static unbind static.example.com --yes']
        }
      ]
    }
  },
  commands: [domainStaticBindCommand, domainStaticUnbindCommand]
});
