import type { CAC } from 'cac';
import { outro, spinner } from '@clack/prompts';
import pc from 'picocolors';
import { getOssBucketInfo, listOssBuckets, listOssObjects } from '../providers/oss';
import {
  ensureAuthOrExit,
  toPromptValue,
  toOptionalString,
  parseListLimit,
  withSpinner
} from '../utils/cli-shared';

export function registerOssCommands(cli: CAC) {
  cli.command('oss list', '查看 OSS Bucket 列表')
    .option('--limit <n>', '返回数量，默认 50')
    .action(async (options: { limit?: unknown }) => {
      ensureAuthOrExit();
      const limit = parseListLimit(options.limit, 50, 500);
      const s = spinner();
      const buckets = await withSpinner(
        s,
        '正在拉取 OSS Bucket 列表...',
        '❌ 获取 Bucket 列表失败',
        () => listOssBuckets(limit)
      );
      if (!buckets) return;
      s.stop(pc.green(`✅ 共获取 ${buckets.length} 个 Bucket`));
      if (buckets.length === 0) {
        outro('当前账号没有 Bucket');
        return;
      }
      for (const bucket of buckets) {
        console.log(`${pc.cyan(bucket.name)}  region=${pc.gray(bucket.location || '-')}  created=${pc.gray(bucket.creationDate || '-')}`);
      }
      console.log('');
      outro('Done.');
    });

  cli.command('oss info <bucket>', '查看 OSS Bucket 详情')
    .action(async (bucket: string) => {
      ensureAuthOrExit();
      const bucketName = toPromptValue(bucket, 'bucket');
      const s = spinner();
      const info = await withSpinner(
        s,
        `正在拉取 Bucket ${bucketName} 详情...`,
        '❌ 获取 Bucket 详情失败',
        () => getOssBucketInfo(bucketName)
      );
      if (!info) return;
      s.stop(pc.green('✅ 获取成功'));
      console.log(`\nname:      ${pc.cyan(info.name)}`);
      console.log(`location:  ${pc.cyan(info.location || '-')}`);
      console.log(`created:   ${pc.cyan(info.creationDate || '-')}`);
      console.log(`endpoint:  ${pc.cyan(info.extranetEndpoint || '-')}`);
      console.log(`intranet:  ${pc.cyan(info.intranetEndpoint || '-')}`);
      console.log('');
      outro('Done.');
    });

  cli.command('oss ls <bucket> [prefix]', '列出 Bucket 对象')
    .option('--limit <n>', '返回数量，默认 100')
    .action(async (bucket: string, prefix: string | undefined, options: { limit?: unknown }) => {
      ensureAuthOrExit();
      const bucketName = toPromptValue(bucket, 'bucket');
      const normalizedPrefix = toOptionalString(prefix);
      const limit = parseListLimit(options.limit, 100, 2000);
      const s = spinner();
      const objects = await withSpinner(
        s,
        `正在列出 ${bucketName} 对象...`,
        '❌ 获取对象列表失败',
        () => listOssObjects(bucketName, normalizedPrefix || undefined, limit)
      );
      if (!objects) return;
      s.stop(pc.green(`✅ 共获取 ${objects.length} 个对象`));
      if (objects.length === 0) {
        outro('当前条件下无对象');
        return;
      }
      for (const object of objects) {
        console.log(`${pc.cyan(object.name)}  size=${pc.gray(String(object.size ?? '-'))}  modified=${pc.gray(object.lastModified || '-')}`);
      }
      console.log('');
      outro('Done.');
    });
}
