import type { CAC } from 'cac';
import { defineCommandModule, commandInvocation, defineCliCommand, registerCliCommand } from './module';
import { text, isCancel } from '@clack/prompts';
import pc from 'picocolors';
import { addDnsRecord, listDnsRecords, removeDnsRecord } from '../providers/dns';
import { executeWithAuthRecovery } from '../utils/auth-recovery';
import {
  ensureAuthOrExit,
  ensureDestructiveActionConfirmed,
  createSpinner,
  isInteractiveTTY,
  showOutro,
  toPromptValue,
  toOptionalString,
  parseListLimit,
  parseOptionalPositiveInt,
  withSpinner
} from '../utils/cli-shared';
import { emitCommandResult, isJsonOutput } from '../utils/output';
import { DELIVERY_SECTION } from './sections';


const dnsRecordsListCommand = defineCliCommand({
  rawName: 'dns records list [domain]',
  description: '查看域名解析记录'
});

const dnsRecordsAddCommand = defineCliCommand({
  rawName: 'dns records add <domain>',
  description: '添加域名解析记录',
  descriptor: {
    summary: '添加一条 DNS 解析记录。',
    result: {
      summary: '结构化结果会返回新建 recordId 和完整记录参数，便于后续自动化追踪。',
      outcomeKey: 'created',
      fields: [
        { name: 'domain', description: '记录所属根域名。' },
        { name: 'recordId', description: '新建后的 DNS recordId。' },
        { name: 'rr', description: '主机记录，例如 @ / www / api。' },
        { name: 'type', description: '记录类型，例如 A / CNAME / TXT。' },
        { name: 'value', description: '记录值。' },
        { name: 'ttl', description: 'TTL 秒数。' },
        { name: 'line', description: '解析线路。' }
      ]
    }
  }
});

const dnsRecordsRmCommand = defineCliCommand({
  rawName: 'dns records rm <recordId>',
  description: '删除域名解析记录',
  descriptor: {
    summary: '删除一条 DNS 解析记录。',
    result: {
      summary: '结构化结果会返回被删除的 recordId。',
      outcomeKey: 'removed',
      fields: [
        { name: 'recordId', description: '被删除的 DNS recordId。' }
      ]
    }
  }
});

export function registerDnsCommands(cli: CAC) {
  registerCliCommand(cli, dnsRecordsListCommand)
    .option('--limit <n>', '返回数量，默认 100')
    .action(async (domain: string | undefined, options: { limit?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(dnsRecordsListCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['dns']
        },
        async () => {
          ensureAuthOrExit();
          let domainInput = domain;
          if (!domainInput) {
            if (!isInteractiveTTY()) {
              throw new Error('缺少域名参数，请使用：licell dns records list <domain>');
            }
            const promptValue = await text({
              message: '请输入要查看的域名:',
              placeholder: 'example.com'
            });
            if (isCancel(promptValue)) process.exit(0);
            domainInput = toPromptValue(promptValue, '域名');
          }

          const normalizedDomain = toPromptValue(domainInput, '域名').toLowerCase();
          const limit = parseListLimit(options.limit, 100, 500);
          const s = createSpinner();
          const records = await withSpinner(
            s,
            `正在拉取 ${normalizedDomain} 的解析记录...`,
            '❌ 获取 DNS 记录失败',
            () => listDnsRecords(normalizedDomain, limit)
          );
          if (!records) return;
          if (!isJsonOutput()) {
            s.stop(pc.green(`✅ 共获取 ${records.length} 条记录`));
          }
          if (isJsonOutput()) {
            emitCommandResult({
              domain: normalizedDomain,
              count: records.length,
              records
            });
            return;
          }
          if (records.length === 0) {
            showOutro('当前域名无解析记录');
            return;
          }
          for (const record of records) {
            console.log(
              `${pc.cyan(record.recordId)}  ${pc.gray(record.rr)} ${pc.gray(record.type)} ${pc.gray(record.value)} ttl=${pc.gray(String(record.ttl || '-'))}`
            );
          }
          console.log('');
          showOutro('Done.');
        }
      );
    });

  registerCliCommand(cli, dnsRecordsAddCommand)
    .option('--rr <rr>', '主机记录，如 @/www/api')
    .option('--type <type>', '记录类型，如 A/CNAME/TXT')
    .option('--value <value>', '记录值')
    .option('--ttl <ttl>', 'TTL 秒，默认 600')
    .option('--line <line>', '线路，默认 default')
    .action(async (domain: string, options: { rr?: unknown; type?: unknown; value?: unknown; ttl?: unknown; line?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(dnsRecordsAddCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['dns']
        },
        async () => {
          ensureAuthOrExit();
          const normalizedDomain = toPromptValue(domain, '域名').toLowerCase();
          const rr = toOptionalString(options.rr);
          const type = toOptionalString(options.type);
          const value = toOptionalString(options.value);
          if (!rr || !type || !value) {
            throw new Error('dns records add 需要提供 --rr --type --value');
          }
          const ttl = parseOptionalPositiveInt(options.ttl, 'ttl');
          const line = toOptionalString(options.line) || 'default';

          const s = createSpinner();
          const recordId = await withSpinner(
            s,
            '正在添加 DNS 记录...',
            '❌ DNS 记录创建失败',
            () => addDnsRecord(normalizedDomain, { rr, type, value, ttl, line })
          );
          if (!recordId) return;
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ DNS 记录已创建'));
          }
          if (isJsonOutput()) {
            emitCommandResult({
              domain: normalizedDomain,
              recordId,
              rr,
              type,
              value,
              ttl: ttl || 600,
              line
            });
            return;
          }
          console.log(`\nrecordId: ${pc.cyan(recordId)}\n`);
          showOutro('Done.');
        }
      );
    });

  registerCliCommand(cli, dnsRecordsRmCommand)
    .option('--yes', '跳过二次确认（危险）')
    .action(async (recordId: string, options: { yes?: boolean }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(dnsRecordsRmCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['dns']
        },
        async () => {
          ensureAuthOrExit();
          const normalizedRecordId = toPromptValue(recordId, 'recordId');
          await ensureDestructiveActionConfirmed(`删除 DNS 记录 ${normalizedRecordId}`, { yes: Boolean(options.yes) });
          const s = createSpinner();
          const removed = await withSpinner(
            s,
            `正在删除记录 ${normalizedRecordId}...`,
            '❌ DNS 记录删除失败',
            async () => {
              await removeDnsRecord(normalizedRecordId);
              return true;
            }
          );
          if (!removed) return;
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ DNS 记录已删除'));
            showOutro('Done.');
          } else {
            emitCommandResult({
              recordId: normalizedRecordId,
              removed: true
            });
          }
        }
      );
    });
}

export const dnsCommandModule = defineCommandModule({
  section: DELIVERY_SECTION,
  register: registerDnsCommands,
  namespaces: {
    dns: {
      summary: 'DNS 解析工作流入口。',
      examples: ['licell dns records --help', 'licell dns records list example.com'],
      taskHints: [
        {
          phase: 'inspect',
          title: '先查看某个域名当前解析',
          description: '在添加、删除记录前，先把现状拉出来，避免误删或重复写入。',
          commands: ['licell dns records list example.com --output json']
        },
        {
          phase: 'mutate',
          title: '新增或删除单条解析记录',
          description: '确认现状后，再执行 add / rm 这类原子操作。',
          commands: ['licell dns records add example.com', 'licell dns records rm <recordId> --yes']
        }
      ]
    },
    'dns records': {
      summary: 'DNS 解析记录的查看、添加与删除。',
      examples: ['licell dns records list example.com', 'licell dns records add example.com', 'licell dns records rm <recordId>'],
      agentTips: ['修改解析前，先 `list --output json` 获取现状，避免误删记录。']
    }
  },
  commands: [dnsRecordsListCommand, dnsRecordsAddCommand, dnsRecordsRmCommand]
});
