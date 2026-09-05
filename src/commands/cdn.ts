import type { CAC } from 'cac';
import pc from 'picocolors';
import { listCdnDomainsForAgent } from '../providers/cdn-query';
import { executeWithAuthRecovery } from '../utils/auth-recovery';
import { ensureAuthOrExit, isInteractiveTTY, parseListLimit, toOptionalString } from '../utils/cli-shared';
import { emitCommandResult, isJsonOutput } from '../utils/output';
import { commandInvocation, defineCliCommand, defineCommandModule, registerCliCommand } from './module';
import { DELIVERY_SECTION } from './sections';

const cdnDomainsCommand = defineCliCommand({
  rawName: 'cdn domains',
  description: '列出 CDN 加速域名（只读）',
  region: { scope: 'auth' },
  options: [
    { rawName: '--region <regionId>', description: '查询地域；不传则使用当前 licell 默认 region' },
    { rawName: '--domain <domain>', description: '按完整 CDN 域名过滤' },
    { rawName: '--status <status>', description: '按 CDN 域名状态过滤，例如 online' },
    { rawName: '--prefix <prefix>', description: '按域名前缀过滤' },
    { rawName: '--source <source>', description: '按回源地址过滤' },
    { rawName: '--limit <n>', description: '返回数量，默认 50，最大 200' }
  ],
  descriptor: {
    title: 'List CDN domains',
    summary: '通过 CDN DescribeUserDomains 只读 API 列出加速域名、CNAME、状态和回源摘要。',
    examples: [
      'licell cdn domains --region cn-hangzhou --output json',
      'licell cdn domains --prefix static. --status online --output json'
    ],
    related: ['domain static', 'domain app', 'api invoke', 'capability search'],
    agentTips: [
      '先读取 `domains[].domainName` 和 `domains[].cname`，需要修改 CDN 配置时回到 `domain` workflow。',
      '本命令只读取 CDN 域名摘要，不创建、删除或修改加速域名。',
      '结果带 `totalCount/truncated`；出现截断时先缩小过滤范围，再继续读取。'
    ],
    automation: {
      preferredOutput: 'json',
      explicitInputs: ['--region', '--domain', '--status', '--prefix', '--source', '--limit']
    },
    safety: {
      level: 'safe',
      reason: '只调用 CDN DescribeUserDomains 读取域名摘要，不修改 CDN 配置。',
      confirmFlags: []
    },
    recommendedFlow: [
      { title: '列出 CDN 域名', command: 'licell cdn domains --output json', reason: '获取当前地域的 CDN 域名和 CNAME。' },
      { title: '绑定静态站点域名', command: 'licell domain static bind <domain> --ssl', reason: '需要变更 CDN、DNS 或 HTTPS 时使用完整 workflow。' },
      { title: '探索其他 CDN 能力', command: 'licell capability search --product cdn --intent "查看 CDN 域名详情" --action inspect --output json', reason: '发现域名详情、刷新和配置等未封装的 protocol API。' }
    ],
    result: {
      summary: '返回 CDN 域名摘要、过滤条件、总数和截断状态。',
      outcomeKey: 'domains',
      fields: [
        { name: 'stage', description: '固定为 `cdn.domains`。', required: true },
        { name: 'regionId', description: '实际查询地域。', required: true },
        { name: 'count', description: '本次返回域名数量。', required: true },
        { name: 'totalCount', description: '云端匹配域名总数。', required: true },
        { name: 'limit', description: '本次查询使用的返回数量上限。', required: true },
        { name: 'truncated', description: '结果是否因 limit 或单页读取而截断。', required: true },
        { name: 'filters', description: '实际使用的域名、状态、前缀和回源过滤条件。', required: true },
        { name: 'requestId', description: 'CDN API requestId。', required: false },
        { name: 'domains[]', description: '域名、CNAME、状态、HTTPS 状态和回源摘要。', required: true }
      ]
    }
  }
});

export function registerCdnCommands(cli: CAC) {
  registerCliCommand(cli, cdnDomainsCommand).action(async (options: {
    region?: unknown;
    domain?: unknown;
    status?: unknown;
    prefix?: unknown;
    source?: unknown;
    limit?: unknown;
  }) => {
    const result = await executeWithAuthRecovery(
      { commandLabel: commandInvocation(cdnDomainsCommand), interactiveTTY: isInteractiveTTY() },
      async () => {
        await ensureAuthOrExit();
        const value = await listCdnDomainsForAgent({
          regionId: toOptionalString(options.region),
          domainName: toOptionalString(options.domain),
          status: toOptionalString(options.status),
          prefix: toOptionalString(options.prefix),
          source: toOptionalString(options.source),
          limit: parseListLimit(options.limit, 50, 200)
        });
        if (isJsonOutput()) emitCommandResult(value);
        return value;
      }
    );
    if (!isJsonOutput()) {
      console.log(pc.bold(`CDN domains (${result.count})`));
      for (const domain of result.domains) {
        console.log(`- ${pc.cyan(domain.domainName)}  ${domain.status || '-'}  ${domain.cname || '-'}`);
      }
    }
  });
}

export const cdnCommandModule = defineCommandModule({
  section: DELIVERY_SECTION,
  register: registerCdnCommands,
  namespaces: {
    cdn: {
      title: 'CDN Services',
      summary: '只读发现 CDN 加速域名，并通过 domain workflow 或 capability fallback 继续管理配置。',
      examples: ['licell cdn domains --output json'],
      agentTips: [
        '先使用 `cdn domains` 查询域名；变更 CDN、DNS 或 HTTPS 使用 `domain` workflow。'
      ]
    }
  },
  commands: [cdnDomainsCommand]
});
