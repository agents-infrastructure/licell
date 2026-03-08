import type { CAC } from 'cac';
import { commandInvocation, defineCliCommand, defineCommandBundle, registerCliCommand } from './module';
import pc from 'picocolors';
import {
  bindFnCustomDomain,
  getFnCustomDomain,
  listFnCustomDomains,
  removeFnCustomDomain,
  resolveDefaultFcGatewayDomain,
  type FnCustomDomainState
} from '../providers/fc';
import { ensureDomainCname, removeMatchingCnameRecords } from '../providers/dns';
import { executeWithAuthRecovery, type AuthCapability } from '../utils/auth-recovery';
import {
  createSpinner,
  ensureAuthOrExit,
  ensureDestructiveActionConfirmed,
  isInteractiveTTY,
  parseListLimit,
  showOutro,
  toOptionalString,
  toPromptValue,
  withSpinner
} from '../utils/cli-shared';
import { Config } from '../utils/config';
import { emitCommandResult, isJsonOutput } from '../utils/output';


const fnDomainListCommand = defineCliCommand({
  rawName: 'fn domain list',
  description: '查看 FC 自定义域名列表'
});

const fnDomainInfoCommand = defineCliCommand({
  rawName: 'fn domain info <domain>',
  description: '查看 FC 自定义域名详情'
});

const fnDomainBindCommand = defineCliCommand({
  rawName: 'fn domain bind <domain>',
  description: '绑定或更新 FC 自定义域名（资源级，不默认改 DNS）',
  descriptor: {
    summary: '绑定或更新 FC 自定义域名路由。',
    related: ['domain app bind', 'dns records add'],
    optionInsights: {
      '--function': {
        whenToUse: '当当前目录不是 licell 项目，或你要显式绑定到其他函数时使用。'
      },
      '--target': {
        whenToUse: '需要将域名路由到指定 alias / version 时使用，例如 prod、preview、1。'
      },
      '--ensure-dns': {
        whenToUse: '希望顺手确保 DNS CNAME 指向当前账号 FC 网关时使用。',
        cautions: ['该选项会写入 DNS，因此需要额外的 DNS 权限。']
      }
    },
    recommendedFlow: [
      {
        title: '查看现状',
        command: 'licell fn domain list --output json',
        reason: '先确认该地域已存在的自定义域名，避免重复或覆盖。'
      },
      {
        title: '绑定 FC 域名',
        command: 'licell fn domain bind <domain> --function <name> --target <target>',
        reason: '以资源级方式创建或更新 FC custom domain。'
      },
      {
        title: '需要 DNS / SSL 时改走 workflow',
        command: 'licell domain app bind <domain> --ssl',
        reason: '跨资源编排更适合交给 workflow 命令处理。'
      }
    ],
    result: {
      summary: '结构化结果会返回 FC 自定义域名的目标函数、路由与最终状态快照。',
      outcomeKey: 'bound',
      fields: [
        { name: 'domain', description: '绑定后的 FC 自定义域名。' },
        { name: 'functionName', description: '目标函数名。' },
        { name: 'qualifier', description: '目标 alias / version。', required: false },
        { name: 'path', description: '路由路径。' },
        { name: 'protocol', description: '接入协议。' },
        { name: 'ensureDns', description: '本次是否顺带确保了 DNS CNAME。' },
        { name: 'info', description: 'FC 返回的 custom domain 状态快照。' }
      ]
    }
  }
});

const fnDomainUnbindCommand = defineCliCommand({
  rawName: 'fn domain unbind <domain>',
  description: '解绑 FC 自定义域名',
  descriptor: {
    summary: '解绑 FC 自定义域名，可选同步清理 DNS。',
    safety: {
      level: 'destructive',
      reason: '会删除 FC custom domain；启用 --cleanup-dns 时还会删除匹配的 DNS CNAME。',
      confirmFlags: ['--yes']
    },
    optionInsights: {
      '--cleanup-dns': {
        whenToUse: '确认该域名对应的 DNS CNAME 也应一起移除时使用。',
        cautions: ['会删除匹配的 DNS CNAME 记录，请先执行 `licell dns records list <domain>` 确认。']
      }
    },
    result: {
      summary: '结构化结果会返回解绑状态与 DNS 清理结果。',
      outcomeKey: 'unbound',
      fields: [
        { name: 'domain', description: '已解绑的 FC 自定义域名。' },
        { name: 'cleanupDns', description: '是否请求同步清理 DNS。' },
        { name: 'removedDnsRecordIds', description: '被清理的 DNS 记录 ID 列表。' }
      ]
    }
  }
});

function resolveFunctionName(input: unknown) {
  const explicit = toOptionalString(input);
  if (explicit) return explicit;
  const project = Config.getProject();
  if (project.appName) return project.appName;
  throw new Error('请通过 --function 指定函数名，或先在当前项目执行 licell deploy 生成 appName');
}

function getPrimaryRoute(domain: FnCustomDomainState) {
  return domain.routes[0];
}

export function registerFnDomainCommands(cli: CAC) {
  registerCliCommand(cli, fnDomainListCommand)
    .option('--limit <n>', '返回数量，默认 20')
    .option('--prefix <prefix>', '按域名前缀过滤')
    .action(async (options: { limit?: unknown; prefix?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(fnDomainListCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc']
        },
        async () => {
          ensureAuthOrExit();
          const limit = parseListLimit(options.limit, 20, 200);
          const prefix = toOptionalString(options.prefix);
          const s = createSpinner();
          const domains = await withSpinner(
            s,
            '正在拉取 FC 自定义域名列表...',
            '❌ 获取 FC 自定义域名失败',
            () => listFnCustomDomains(limit, { prefix: prefix || undefined })
          );
          if (!domains) return;
          if (!isJsonOutput()) {
            s.stop(pc.green(`✅ 共获取 ${domains.length} 个自定义域名`));
          }
          if (isJsonOutput()) {
            emitCommandResult({
              count: domains.length,
              domains
            });
            return;
          }
          if (domains.length === 0) {
            showOutro('当前地域没有 FC 自定义域名');
            return;
          }
          for (const domain of domains) {
            const primaryRoute = getPrimaryRoute(domain);
            console.log(
              `${pc.cyan(domain.domainName)}  protocol=${pc.gray(domain.protocol || '-')}  function=${pc.gray(primaryRoute?.functionName || '-')}  target=${pc.gray(primaryRoute?.qualifier || '-')}`
            );
          }
          console.log('');
          showOutro('Done.');
        }
      );
    });

  registerCliCommand(cli, fnDomainInfoCommand)
    .action(async (domain: string) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(fnDomainInfoCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc']
        },
        async () => {
          ensureAuthOrExit();
          const normalizedDomain = toPromptValue(domain, '域名').toLowerCase();
          const s = createSpinner();
          const info = await withSpinner(
            s,
            `正在拉取 ${normalizedDomain} 详情...`,
            '❌ 获取 FC 自定义域名详情失败',
            () => getFnCustomDomain(normalizedDomain)
          );
          if (!info) throw new Error(`未找到 FC 自定义域名：${normalizedDomain}`);
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ 获取成功'));
          }
          if (isJsonOutput()) {
            emitCommandResult({
              domain: normalizedDomain,
              info
            });
            return;
          }

          console.log(`\ndomain:   ${pc.cyan(info.domainName)}`);
          console.log(`protocol: ${pc.cyan(info.protocol || '-')}`);
          console.log(`tls:      ${pc.cyan(info.certConfig ? 'enabled' : 'disabled')}`);
          console.log(`created:  ${pc.cyan(info.createdAt || '-')}`);
          console.log(`updated:  ${pc.cyan(info.updatedAt || '-')}`);
          console.log(`routes:   ${pc.cyan(String(info.routes.length))}`);
          for (const route of info.routes) {
            console.log(`  - ${route.path} -> ${route.functionName || '-'}${route.qualifier ? `@${route.qualifier}` : ''}`);
          }
          console.log('');
          showOutro('Done.');
        }
      );
    });

  registerCliCommand(cli, fnDomainBindCommand)
    .option('--function <name>', '指定函数名；默认使用当前项目 appName')
    .option('--target <target>', '指定 alias/version（如 prod/preview/1）')
    .option('--path <path>', '路由路径，默认 /*')
    .option('--protocol <protocol>', '自定义域名协议，默认 HTTP')
    .option('--ensure-dns', '同时确保 DNS CNAME 指向当前账号 FC 网关')
    .action(async (domain: string, options: { function?: unknown; target?: unknown; path?: unknown; protocol?: unknown; ensureDns?: boolean }) => {
      const requiredCapabilities: AuthCapability[] = options.ensureDns ? ['fc', 'dns'] : ['fc'];
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(fnDomainBindCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities
        },
        async () => {
          ensureAuthOrExit();
          const normalizedDomain = toPromptValue(domain, '域名').toLowerCase();
          const functionName = resolveFunctionName(options.function);
          const qualifier = toOptionalString(options.target);
          const path = toOptionalString(options.path) || '/*';
          const protocol = toOptionalString(options.protocol) || 'HTTP';
          const s = createSpinner();
          const info = await withSpinner(
            s,
            `正在绑定 FC 自定义域名 ${normalizedDomain}...`,
            '❌ FC 自定义域名绑定失败',
            async () => {
              if (options.ensureDns) {
                await ensureDomainCname(normalizedDomain, resolveDefaultFcGatewayDomain());
              }
              return bindFnCustomDomain(normalizedDomain, {
                functionName,
                qualifier: qualifier || undefined,
                path,
                protocol
              });
            }
          );
          if (!info) return;
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ FC 自定义域名已绑定'));
          }
          if (isJsonOutput()) {
            emitCommandResult({
              domain: normalizedDomain,
              functionName,
              qualifier: qualifier || null,
              path,
              protocol,
              ensureDns: Boolean(options.ensureDns),
              info
            });
            return;
          }
          const primaryRoute = getPrimaryRoute(info);
          console.log(`\nfunction: ${pc.cyan(primaryRoute?.functionName || functionName)}`);
          console.log(`path:     ${pc.cyan(primaryRoute?.path || path)}`);
          if (qualifier) console.log(`target:   ${pc.cyan(qualifier)}`);
          if (options.ensureDns) console.log(`dns:      ${pc.cyan('CNAME ensured')}`);
          console.log(`url:      ${pc.cyan(`http://${normalizedDomain}`)}`);
          console.log('');
          showOutro('Done.');
        }
      );
    });

  registerCliCommand(cli, fnDomainUnbindCommand)
    .option('--cleanup-dns', '同时清理对应 DNS CNAME')
    .option('--yes', '跳过二次确认（危险）')
    .action(async (domain: string, options: { cleanupDns?: boolean; yes?: boolean }) => {
      const requiredCapabilities: AuthCapability[] = options.cleanupDns ? ['fc', 'dns'] : ['fc'];
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(fnDomainUnbindCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities
        },
        async () => {
          ensureAuthOrExit();
          const normalizedDomain = toPromptValue(domain, '域名').toLowerCase();
          await ensureDestructiveActionConfirmed(
            options.cleanupDns ? `解绑 FC 自定义域名 ${normalizedDomain} 并清理 DNS` : `解绑 FC 自定义域名 ${normalizedDomain}`,
            { yes: Boolean(options.yes) }
          );
          const s = createSpinner();
          const result = await withSpinner(
            s,
            `正在解绑 FC 自定义域名 ${normalizedDomain}...`,
            '❌ 解绑 FC 自定义域名失败',
            async () => ({
              removed: await removeFnCustomDomain(normalizedDomain),
              removedDnsRecordIds: options.cleanupDns ? await removeMatchingCnameRecords(normalizedDomain) : []
            })
          );
          if (!result) return;
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ FC 自定义域名已解绑'));
          }
          if (isJsonOutput()) {
            emitCommandResult({
              domain: normalizedDomain,
              unbound: result.removed,
              cleanupDns: Boolean(options.cleanupDns),
              removedDnsRecordIds: result.removedDnsRecordIds
            });
            return;
          }
          if (options.cleanupDns) {
            console.log(`\ndns cleanup: ${pc.cyan(String(result.removedDnsRecordIds.length))} records`);
          }
          showOutro('Done.');
        }
      );
    });
}

export const fnDomainCommandBundle = defineCommandBundle({
  register: registerFnDomainCommands,
  namespaces: {
    'fn domain': {
      summary: 'FC 自定义域名的原子操作入口，默认只操作 FC 资源本身。',
      notes: [
        '这是资源级命令：默认不会自动修改 DNS。',
        '若希望同时编排 DNS / alias / SSL，请优先使用 `licell domain app bind` 工作流命令。'
      ],
      examples: [
        'licell fn domain list',
        'licell fn domain info api.example.com',
        'licell fn domain bind api.example.com --function my-app --target prod',
        'licell fn domain unbind api.example.com --yes'
      ],
      related: ['domain app', 'dns records'],
      taskHints: [
        {
          phase: 'inspect',
          title: '查看当前 FC 域名绑定',
          description: '先列出现有自定义域名，再决定是否继续绑定或解绑。',
          commands: ['licell fn domain list --output json']
        },
        {
          phase: 'mutate',
          title: '把域名绑定到指定函数 alias',
          description: '当你只想操作 FC custom domain 本身，而不联动 DNS / SSL 时使用。',
          commands: ['licell fn domain bind api.example.com --function my-app --target prod']
        }
      ]
    }
  },
  commands: [fnDomainListCommand, fnDomainInfoCommand, fnDomainBindCommand, fnDomainUnbindCommand]
});

