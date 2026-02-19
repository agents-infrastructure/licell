import type { CAC } from 'cac';
import { text, outro, spinner } from '@clack/prompts';
import pc from 'picocolors';
import { getOssBucketInfo, listOssBuckets, listOssObjects, uploadDirectoryToBucket } from '../providers/oss';
import { executeWithAuthRecovery } from '../utils/auth-recovery';
import {
  ensureAuthOrExit,
  isInteractiveTTY,
  toPromptValue,
  toOptionalString,
  parseListLimit,
  withSpinner
} from '../utils/cli-shared';

export function registerOssCommands(cli: CAC) {
  cli.command('oss list', '查看 OSS Bucket 列表')
    .option('--limit <n>', '返回数量，默认 50')
    .action(async (options: { limit?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: 'licell oss list',
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['oss']
        },
        async () => {
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
        }
      );
    });

  cli.command('oss info <bucket>', '查看 OSS Bucket 详情')
    .action(async (bucket: string) => {
      await executeWithAuthRecovery(
        {
          commandLabel: 'licell oss info',
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['oss']
        },
        async () => {
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
        }
      );
    });

  cli.command('oss ls <bucket> [prefix]', '列出 Bucket 对象')
    .option('--limit <n>', '返回数量，默认 100')
    .action(async (bucket: string, prefix: string | undefined, options: { limit?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: 'licell oss ls',
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['oss']
        },
        async () => {
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
        }
      );
    });

  const registerUploadCommand = (name: string, description: string) => {
    cli.command(name, description)
      .option('--bucket <bucket>', 'Bucket 名称（可替代位置参数）')
      .option('--source-dir <dir>', '本地目录（默认 dist）')
      .option('--target-dir <dir>', 'Bucket 内目标目录前缀（如 mysite 或 mysite/v2）')
      .action(async (bucket: string | undefined, options: { bucket?: unknown; sourceDir?: unknown; targetDir?: unknown }) => {
        await executeWithAuthRecovery(
          {
            commandLabel: 'licell oss upload',
            interactiveTTY: isInteractiveTTY(),
            requiredCapabilities: ['oss']
          },
          async () => {
            ensureAuthOrExit();
            const interactiveTTY = isInteractiveTTY();
            const bucketName = toOptionalString(options.bucket)
              || toOptionalString(bucket)
              || (
                interactiveTTY
                  ? toPromptValue(await text({ message: 'Bucket 名称:' }), 'bucket')
                  : undefined
              );
            if (!bucketName) throw new Error('请通过 <bucket> 或 --bucket 指定 Bucket 名称');

            const sourceDir = toOptionalString(options.sourceDir)
              || (
                interactiveTTY
                  ? toPromptValue(await text({ message: '本地目录:', initialValue: 'dist' }), 'source-dir')
                  : 'dist'
              );
            const targetDir = toOptionalString(options.targetDir);

            const s = spinner();
            const result = await withSpinner(
              s,
              `正在上传 ${sourceDir} 到 OSS Bucket ${bucketName}${targetDir ? `/${targetDir}` : ''}...`,
              '❌ OSS 目录上传失败',
              () => uploadDirectoryToBucket(bucketName, sourceDir, { targetDir })
            );
            if (!result) return;

            s.stop(pc.green(`✅ 上传完成，共 ${result.uploadedCount} 个文件`));
            const objectPrefix = result.targetDir ? `${result.targetDir}/` : '';
            console.log(`\nbucket: ${pc.cyan(result.bucket)}`);
            console.log(`prefix: ${pc.cyan(result.targetDir || '(root)')}`);
            console.log(`base:   ${pc.cyan(result.baseUrl)}`);
            console.log(`hint:   ${pc.gray(`${result.baseUrl}/${objectPrefix}<file>`)}`);
            if (result.skippedSymlinkCount > 0) {
              console.log(pc.yellow(`warning: 已跳过 ${result.skippedSymlinkCount} 个符号链接（为避免目录逃逸与递归风险）`));
            }
            console.log('');
            outro('Done.');
          }
        );
      });
  };

  registerUploadCommand('oss upload [bucket]', '上传本地目录到 OSS Bucket 指定目录');
  registerUploadCommand('oss bucket [bucket]', '上传本地目录到 OSS Bucket 指定目录（兼容命令，等同 oss upload）');
}
