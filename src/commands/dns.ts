import type { CAC } from 'cac';
import { outro, spinner } from '@clack/prompts';
import pc from 'picocolors';
import { addDnsRecord, listDnsRecords, removeDnsRecord } from '../providers/domain';
import {
  ensureAuthOrExit,
  toPromptValue,
  toOptionalString,
  parseListLimit,
  parseOptionalPositiveInt,
  withSpinner
} from '../utils/cli-shared';

export function registerDnsCommands(cli: CAC) {
  cli.command('dns records list <domain>', '查看域名解析记录')
    .option('--limit <n>', '返回数量，默认 100')
    .action(async (domain: string, options: { limit?: unknown }) => {
      ensureAuthOrExit();
      const normalizedDomain = toPromptValue(domain, '域名').toLowerCase();
      const limit = parseListLimit(options.limit, 100, 500);
      const s = spinner();
      const records = await withSpinner(
        s,
        `正在拉取 ${normalizedDomain} 的解析记录...`,
        '❌ 获取 DNS 记录失败',
        () => listDnsRecords(normalizedDomain, limit)
      );
      if (!records) return;
      s.stop(pc.green(`✅ 共获取 ${records.length} 条记录`));
      if (records.length === 0) {
        outro('当前域名无解析记录');
        return;
      }
      for (const record of records) {
        console.log(
          `${pc.cyan(record.recordId)}  ${pc.gray(record.rr)} ${pc.gray(record.type)} ${pc.gray(record.value)} ttl=${pc.gray(String(record.ttl || '-'))}`
        );
      }
      console.log('');
      outro('Done.');
    });

  cli.command('dns records add <domain>', '添加域名解析记录')
    .option('--rr <rr>', '主机记录，如 @/www/api')
    .option('--type <type>', '记录类型，如 A/CNAME/TXT')
    .option('--value <value>', '记录值')
    .option('--ttl <ttl>', 'TTL 秒，默认 600')
    .option('--line <line>', '线路，默认 default')
    .action(async (domain: string, options: { rr?: unknown; type?: unknown; value?: unknown; ttl?: unknown; line?: unknown }) => {
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

      const s = spinner();
      const recordId = await withSpinner(
        s,
        '正在添加 DNS 记录...',
        '❌ DNS 记录创建失败',
        () => addDnsRecord(normalizedDomain, { rr, type, value, ttl, line })
      );
      if (!recordId) return;
      s.stop(pc.green('✅ DNS 记录已创建'));
      console.log(`\nrecordId: ${pc.cyan(recordId)}\n`);
      outro('Done.');
    });

  cli.command('dns records rm <recordId>', '删除域名解析记录')
    .action(async (recordId: string) => {
      ensureAuthOrExit();
      const normalizedRecordId = toPromptValue(recordId, 'recordId');
      const s = spinner();
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
      s.stop(pc.green('✅ DNS 记录已删除'));
      outro('Done.');
    });
}
