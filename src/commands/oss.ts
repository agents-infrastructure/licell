import type { CAC } from 'cac';
import type { CommandMetadataMap } from './module';
import { text } from '@clack/prompts';
import pc from 'picocolors';
import {
  bindOssBucketDomain,
  createOssBucket,
  createOssBucketDomainToken,
  deleteOssBucket,
  deleteOssBucketRecursively,
  getOssBucketInfo,
  listOssBucketDomains,
  listOssBuckets,
  listOssObjects,
  normalizeOssBucketAcl,
  normalizeOssBucketDataRedundancyType,
  normalizeOssBucketStorageClass,
  removeOssBucketDomain,
  updateOssBucket,
  uploadDirectoryToBucket
} from '../providers/oss';
import { executeWithAuthRecovery } from '../utils/auth-recovery';
import {
  createSpinner,
  ensureAuthOrExit,
  ensureDestructiveActionConfirmed,
  isInteractiveTTY,
  normalizeCustomDomain,
  showOutro,
  toOptionalString,
  toPromptValue,
  parseListLimit,
  withSpinner
} from '../utils/cli-shared';
import { parseRootAndSubdomain } from '../utils/domain';
import { emitCliResult, isJsonOutput } from '../utils/output';

function parsePublicAccessBlockOption(value: unknown) {
  const normalized = toOptionalString(value)?.toLowerCase();
  if (!normalized) return undefined;
  if (['on', 'true', '1', 'enable', 'enabled'].includes(normalized)) return true;
  if (['off', 'false', '0', 'disable', 'disabled'].includes(normalized)) return false;
  throw new Error('--public-access-block 仅支持 on/off');
}

function renderBucketDomains(domains: Array<{ domain: string; status?: string; lastModified?: string }>) {
  if (domains.length === 0) {
    console.log(`domains:   ${pc.gray('(none)')}`);
    return;
  }
  console.log(`domains:   ${pc.cyan(domains[0]?.domain || '-')}${domains[0]?.status ? `  ${pc.gray(`status=${domains[0].status}`)}` : ''}${domains[0]?.lastModified ? `  ${pc.gray(`updated=${domains[0].lastModified}`)}` : ''}`);
  for (const domain of domains.slice(1)) {
    console.log(`           ${pc.cyan(domain.domain)}${domain.status ? `  ${pc.gray(`status=${domain.status}`)}` : ''}${domain.lastModified ? `  ${pc.gray(`updated=${domain.lastModified}`)}` : ''}`);
  }
}

function printBucketInfo(info: Awaited<ReturnType<typeof getOssBucketInfo>>) {
  console.log(`\nname:      ${pc.cyan(info.name)}`);
  console.log(`location:  ${pc.cyan(info.location || '-')}`);
  console.log(`created:   ${pc.cyan(info.creationDate || '-')}`);
  console.log(`endpoint:  ${pc.cyan(info.extranetEndpoint || '-')}`);
  console.log(`intranet:  ${pc.cyan(info.intranetEndpoint || '-')}`);
  console.log(`acl:       ${pc.cyan(info.acl || '-')}`);
  console.log(`public:    ${pc.cyan(info.publicAccessBlock === undefined ? '-' : info.publicAccessBlock ? 'blocked' : 'allowed')}`);
  renderBucketDomains(info.domains || []);
}

function buildOssDomainVerificationHint(domain: string, token: string) {
  const { rootDomain, subDomain } = parseRootAndSubdomain(domain);
  const rr = subDomain === '@' ? '_dnsauth' : `_dnsauth.${subDomain}`;
  return {
    rootDomain,
    rr,
    fullRecord: `${rr}.${rootDomain}`,
    type: 'TXT',
    value: token
  } as const;
}

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
          const s = createSpinner();
          const buckets = await withSpinner(
            s,
            '正在拉取 OSS Bucket 列表...',
            '❌ 获取 Bucket 列表失败',
            () => listOssBuckets(limit)
          );
          if (!buckets) return;
          if (!isJsonOutput()) {
            s.stop(pc.green(`✅ 共获取 ${buckets.length} 个 Bucket`));
          }
          if (isJsonOutput()) {
            emitCliResult({
              stage: 'oss.list',
              count: buckets.length,
              buckets
            });
            return;
          }
          if (buckets.length === 0) {
            showOutro('当前账号没有 Bucket');
            return;
          }
          for (const bucket of buckets) {
            console.log(`${pc.cyan(bucket.name)}  region=${pc.gray(bucket.location || '-')}  created=${pc.gray(bucket.creationDate || '-')}`);
          }
          console.log('');
          showOutro('Done.');
        }
      );
    });

  cli.command('oss info <bucket>', '查看 OSS Bucket 详情（含 ACL / 公共访问阻止 / 域名）')
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
          const s = createSpinner();
          const info = await withSpinner(
            s,
            `正在拉取 Bucket ${bucketName} 详情...`,
            '❌ 获取 Bucket 详情失败',
            () => getOssBucketInfo(bucketName)
          );
          if (!info) return;
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ 获取成功'));
          } else {
            emitCliResult({
              stage: 'oss.info',
              bucket: bucketName,
              info
            });
            return;
          }
          printBucketInfo(info);
          console.log('');
          showOutro('Done.');
        }
      );
    });

  cli.command('oss create <bucket>', '创建 OSS Bucket')
    .option('--acl <acl>', 'Bucket ACL：private / public-read / public-read-write')
    .option('--storage-class <class>', '默认存储类型：standard / ia / archive / cold-archive / deep-cold-archive')
    .option('--redundancy <type>', '冗余类型：lrs / zrs')
    .option('--public-access-block <mode>', 'Bucket 级公共访问阻止：on / off')
    .action(async (bucket: string, options: { acl?: unknown; storageClass?: unknown; redundancy?: unknown; publicAccessBlock?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: 'licell oss create',
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['oss']
        },
        async () => {
          ensureAuthOrExit();
          const bucketName = toPromptValue(bucket, 'bucket');
          const acl = toOptionalString(options.acl);
          const storageClass = toOptionalString(options.storageClass);
          const redundancy = toOptionalString(options.redundancy);
          const publicAccessBlock = parsePublicAccessBlockOption(options.publicAccessBlock);

          const s = createSpinner();
          const result = await withSpinner(
            s,
            `正在创建 Bucket ${bucketName}...`,
            '❌ 创建 Bucket 失败',
            () => createOssBucket(bucketName, {
              acl: acl ? normalizeOssBucketAcl(acl) : undefined,
              storageClass: storageClass ? normalizeOssBucketStorageClass(storageClass) : undefined,
              dataRedundancyType: redundancy ? normalizeOssBucketDataRedundancyType(redundancy) : undefined,
              publicAccessBlock
            })
          );
          if (!result) return;
          if (!isJsonOutput()) {
            s.stop(pc.green(result.created ? '✅ Bucket 已创建' : '✅ Bucket 已存在，已校验可访问'));
          } else {
            emitCliResult({
              stage: 'oss.create',
              bucket: bucketName,
              created: result.created,
              info: result.info
            });
            return;
          }
          printBucketInfo(result.info);
          console.log('');
          showOutro('Done.');
        }
      );
    });

  cli.command('oss update <bucket>', '更新 OSS Bucket 属性（ACL / 公共访问阻止）')
    .option('--acl <acl>', 'Bucket ACL：private / public-read / public-read-write')
    .option('--public-access-block <mode>', 'Bucket 级公共访问阻止：on / off')
    .action(async (bucket: string, options: { acl?: unknown; publicAccessBlock?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: 'licell oss update',
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['oss']
        },
        async () => {
          ensureAuthOrExit();
          const bucketName = toPromptValue(bucket, 'bucket');
          const acl = toOptionalString(options.acl);
          const publicAccessBlock = parsePublicAccessBlockOption(options.publicAccessBlock);
          if (!acl && publicAccessBlock === undefined) {
            throw new Error('oss update 至少需要一个变更：--acl 或 --public-access-block');
          }

          const s = createSpinner();
          const info = await withSpinner(
            s,
            `正在更新 Bucket ${bucketName} 配置...`,
            '❌ 更新 Bucket 配置失败',
            () => updateOssBucket(bucketName, {
              acl: acl ? normalizeOssBucketAcl(acl) : undefined,
              publicAccessBlock
            })
          );
          if (!info) return;
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ Bucket 配置已更新'));
          } else {
            emitCliResult({
              stage: 'oss.update',
              bucket: bucketName,
              info
            });
            return;
          }
          printBucketInfo(info);
          console.log('');
          showOutro('Done.');
        }
      );
    });

  cli.command('oss rm <bucket>', '删除 OSS Bucket（默认仅删空 Bucket）')
    .option('--recursive', '先删除对象，再删除 Bucket（危险）')
    .option('--yes', '跳过二次确认（危险）')
    .action(async (bucket: string, options: { recursive?: boolean; yes?: boolean }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: 'licell oss rm',
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['oss']
        },
        async () => {
          ensureAuthOrExit();
          const bucketName = toPromptValue(bucket, 'bucket');
          await ensureDestructiveActionConfirmed(
            options.recursive ? `递归删除 OSS Bucket ${bucketName}` : `删除 OSS Bucket ${bucketName}`,
            { yes: Boolean(options.yes) }
          );

          const s = createSpinner();
          const result = await withSpinner(
            s,
            options.recursive
              ? `正在递归删除 Bucket ${bucketName} 及其对象...`
              : `正在删除空 Bucket ${bucketName}...`,
            '❌ 删除 Bucket 失败',
            () => (options.recursive ? deleteOssBucketRecursively(bucketName) : deleteOssBucket(bucketName))
          );
          if (!result) return;

          if (!isJsonOutput()) {
            s.stop(pc.green(result.deletedBucket ? '✅ Bucket 已删除' : '✅ Bucket 不存在，无需删除'));
          } else {
            emitCliResult({
              stage: 'oss.rm',
              bucket: bucketName,
              recursive: Boolean(options.recursive),
              result
            });
            return;
          }

          console.log(`\nbucket:          ${pc.cyan(result.bucket)}`);
          console.log(`deletedObjects:  ${pc.cyan(String(result.deletedObjects))}`);
          console.log(`deletedBucket:   ${pc.cyan(result.deletedBucket ? 'yes' : 'no')}`);
          console.log('');
          showOutro('Done.');
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
          const s = createSpinner();
          const objects = await withSpinner(
            s,
            `正在列出 ${bucketName} 对象...`,
            '❌ 获取对象列表失败',
            () => listOssObjects(bucketName, normalizedPrefix || undefined, limit)
          );
          if (!objects) return;
          if (!isJsonOutput()) {
            s.stop(pc.green(`✅ 共获取 ${objects.length} 个对象`));
          }
          if (isJsonOutput()) {
            emitCliResult({
              stage: 'oss.ls',
              bucket: bucketName,
              prefix: normalizedPrefix || null,
              count: objects.length,
              objects
            });
            return;
          }
          if (objects.length === 0) {
            showOutro('当前条件下无对象');
            return;
          }
          for (const object of objects) {
            console.log(`${pc.cyan(object.name)}  size=${pc.gray(String(object.size ?? '-'))}  modified=${pc.gray(object.lastModified || '-')}`);
          }
          console.log('');
          showOutro('Done.');
        }
      );
    });

  cli.command('oss domain list <bucket>', '查看 Bucket 已绑定的原生 OSS 域名')
    .action(async (bucket: string) => {
      await executeWithAuthRecovery(
        {
          commandLabel: 'licell oss domain list',
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['oss']
        },
        async () => {
          ensureAuthOrExit();
          const bucketName = toPromptValue(bucket, 'bucket');
          const s = createSpinner();
          const domains = await withSpinner(
            s,
            `正在获取 Bucket ${bucketName} 的域名绑定...`,
            '❌ 获取 Bucket 域名失败',
            () => listOssBucketDomains(bucketName)
          );
          if (!domains) return;
          if (!isJsonOutput()) {
            s.stop(pc.green(`✅ 共获取 ${domains.length} 个域名绑定`));
          }
          if (isJsonOutput()) {
            emitCliResult({
              stage: 'oss.domain.list',
              bucket: bucketName,
              count: domains.length,
              domains
            });
            return;
          }
          if (domains.length === 0) {
            showOutro('当前 Bucket 暂无绑定域名');
            return;
          }
          for (const domain of domains) {
            console.log(`${pc.cyan(domain.domain)}  status=${pc.gray(domain.status || '-')}  updated=${pc.gray(domain.lastModified || '-')}`);
          }
          console.log('');
          showOutro('Done.');
        }
      );
    });

  cli.command('oss domain token <bucket> <domain>', '为 Bucket 自定义域名生成 TXT 验证 token')
    .action(async (bucket: string, domain: string) => {
      await executeWithAuthRecovery(
        {
          commandLabel: 'licell oss domain token',
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['oss', 'dns']
        },
        async () => {
          ensureAuthOrExit();
          const bucketName = toPromptValue(bucket, 'bucket');
          const normalizedDomain = normalizeCustomDomain(domain);
          const s = createSpinner();
          const token = await withSpinner(
            s,
            `正在为 ${normalizedDomain} 生成 OSS 域名验证 token...`,
            '❌ 生成域名验证 token 失败',
            () => createOssBucketDomainToken(bucketName, normalizedDomain)
          );
          if (!token) return;
          const hint = buildOssDomainVerificationHint(normalizedDomain, token.token);
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ 已生成验证 token'));
          } else {
            emitCliResult({
              stage: 'oss.domain.token',
              bucket: bucketName,
              domain: normalizedDomain,
              token,
              dnsVerification: hint
            });
            return;
          }
          console.log(`\nbucket:      ${pc.cyan(token.bucket || bucketName)}`);
          console.log(`domain:      ${pc.cyan(token.cname || normalizedDomain)}`);
          console.log(`token:       ${pc.cyan(token.token)}`);
          console.log(`expireTime:  ${pc.cyan(token.expireTime || '-')}`);
          console.log(`txt name:    ${pc.cyan(hint.fullRecord)}`);
          console.log(`txt value:   ${pc.cyan(hint.value)}`);
          console.log(`hint:        ${pc.gray(`licell dns records add ${hint.rootDomain} --rr ${hint.rr} --type TXT --value ${JSON.stringify(hint.value)}`)}`);
          console.log('');
          showOutro('Done.');
        }
      );
    });

  cli.command('oss domain bind <bucket> <domain>', '为 Bucket 绑定原生 OSS 自定义域名')
    .action(async (bucket: string, domain: string) => {
      await executeWithAuthRecovery(
        {
          commandLabel: 'licell oss domain bind',
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['oss']
        },
        async () => {
          ensureAuthOrExit();
          const bucketName = toPromptValue(bucket, 'bucket');
          const normalizedDomain = normalizeCustomDomain(domain);
          const s = createSpinner();
          const binding = await withSpinner(
            s,
            `正在为 Bucket ${bucketName} 绑定域名 ${normalizedDomain}...`,
            '❌ Bucket 域名绑定失败',
            () => bindOssBucketDomain(bucketName, normalizedDomain)
          );
          if (!binding) return;
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ Bucket 域名已绑定'));
          } else {
            emitCliResult({
              stage: 'oss.domain.bind',
              bucket: bucketName,
              domain: normalizedDomain,
              binding
            });
            return;
          }
          console.log(`\ndomain:   ${pc.cyan(binding.domain)}`);
          console.log(`status:   ${pc.cyan(binding.status || '-')}`);
          console.log(`updated:  ${pc.cyan(binding.lastModified || '-')}`);
          console.log('');
          showOutro('Done.');
        }
      );
    });

  cli.command('oss domain rm <bucket> <domain>', '解绑 Bucket 原生 OSS 自定义域名')
    .option('--yes', '跳过二次确认（危险）')
    .action(async (bucket: string, domain: string, options: { yes?: boolean }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: 'licell oss domain rm',
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['oss']
        },
        async () => {
          ensureAuthOrExit();
          const bucketName = toPromptValue(bucket, 'bucket');
          const normalizedDomain = normalizeCustomDomain(domain);
          await ensureDestructiveActionConfirmed(`解绑 Bucket ${bucketName} 的 OSS 域名 ${normalizedDomain}`, { yes: Boolean(options.yes) });

          const s = createSpinner();
          const removed = await withSpinner(
            s,
            `正在解绑域名 ${normalizedDomain}...`,
            '❌ 解绑 Bucket 域名失败',
            () => removeOssBucketDomain(bucketName, normalizedDomain)
          );
          if (!removed) return;
          if (!isJsonOutput()) {
            s.stop(pc.green(removed ? '✅ 域名已解绑' : '✅ 域名不存在，无需解绑'));
          } else {
            emitCliResult({
              stage: 'oss.domain.rm',
              bucket: bucketName,
              domain: normalizedDomain,
              removed
            });
            return;
          }
          console.log(`\nbucket:  ${pc.cyan(bucketName)}`);
          console.log(`domain:  ${pc.cyan(normalizedDomain)}`);
          console.log('');
          showOutro('Done.');
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

            const s = createSpinner();
            const result = await withSpinner(
              s,
              `正在上传 ${sourceDir} 到 OSS Bucket ${bucketName}${targetDir ? `/${targetDir}` : ''}...`,
              '❌ OSS 目录上传失败',
              () => uploadDirectoryToBucket(bucketName, sourceDir, { targetDir })
            );
            if (!result) return;

            if (!isJsonOutput()) {
              s.stop(pc.green(`✅ 上传完成，共 ${result.uploadedCount} 个文件`));
            } else {
              emitCliResult({
                stage: 'oss.upload',
                bucket: result.bucket,
                sourceDir,
                targetDir: result.targetDir || null,
                uploadedCount: result.uploadedCount,
                skippedSymlinkCount: result.skippedSymlinkCount,
                baseUrl: result.baseUrl
              });
              return;
            }
            const objectPrefix = result.targetDir ? `${result.targetDir}/` : '';
            console.log(`\nbucket: ${pc.cyan(result.bucket)}`);
            console.log(`prefix: ${pc.cyan(result.targetDir || '(root)')}`);
            console.log(`base:   ${pc.cyan(result.baseUrl)}`);
            console.log(`hint:   ${pc.gray(`${result.baseUrl}/${objectPrefix}<file>`)}`);
            if (result.skippedSymlinkCount > 0) {
              console.log(pc.yellow(`warning: 已跳过 ${result.skippedSymlinkCount} 个符号链接（为避免目录逃逸与递归风险）`));
            }
            console.log('');
            showOutro('Done.');
          }
        );
      });
  };

  registerUploadCommand('oss upload [bucket]', '上传本地目录到 OSS Bucket 指定目录');
  registerUploadCommand('oss bucket [bucket]', '上传本地目录到 OSS Bucket 指定目录（兼容命令，等同 oss upload）');
}

export const ossCommandMetadata: CommandMetadataMap = {
  oss: {
    summary: 'OSS Bucket 的创建、属性配置、原生域名绑定与对象上传/查看。',
    notes: [
      '`deploy static` 的生产域名默认走 CDN(sourceType=oss) + DNS；这里补充的是 OSS Bucket 原生管理能力。',
      '首次绑定 OSS 原生域名前，通常先执行 `licell oss domain token`，再添加 TXT 验证记录。'
    ],
    examples: [
      'licell oss list',
      'licell oss create my-bucket --acl private',
      'licell oss info my-bucket',
      'licell oss update my-bucket --acl public-read --public-access-block off',
      'licell oss domain token my-bucket static.example.com',
      'licell oss upload my-bucket --source-dir dist'
    ],
    agentTips: [
      '自动化场景优先使用 `--output json`，尤其是 `oss info`、`oss domain token`、`oss domain list`。',
      '要删除 Bucket 时，先确认是否需要 `--recursive` 清理对象。'
    ],
    recommendedFlow: [
      { title: '先看现状', command: 'licell oss list --output json', reason: '先拿到当前账号下的 Bucket 清单。' },
      { title: '创建 Bucket', command: 'licell oss create <bucket>', reason: '按需指定 ACL、存储类型、冗余类型。' },
      { title: '检查配置', command: 'licell oss info <bucket> --output json', reason: '确认 ACL、公共访问阻止与已绑定域名。' },
      { title: '域名验证', command: 'licell oss domain token <bucket> <domain>', reason: '为原生 OSS 域名绑定准备 TXT 验证记录。' },
      { title: '上传内容', command: 'licell oss upload <bucket> --source-dir dist', reason: '把本地构建产物上传到 Bucket。' }
    ]
  },
  'oss create': {
    safety: {
      level: 'mutating',
      reason: '会创建新的 OSS Bucket，并可能设置 ACL / 冗余 / 存储类型。'
    },
    optionInsights: {
      '--acl': {
        whenToUse: '需要显式决定 Bucket 是私有还是公共可读时使用。',
        cautions: ['公共 ACL 可能被 Bucket 或账号级公共访问阻止策略拦截。']
      },
      '--public-access-block': {
        whenToUse: '需要在 Bucket 级别显式阻止公共 ACL 时使用。',
        cautions: ['开启后不要再把 ACL 设为 public-read / public-read-write。']
      },
      '--storage-class': {
        whenToUse: '需要在创建时指定默认存储类型时使用。',
        cautions: ['归档类存储适合冷数据，不适合频繁在线读取。']
      },
      '--redundancy': {
        whenToUse: '需要显式指定 LRS / ZRS 时使用。',
        cautions: ['ZRS 通常成本更高，需按业务容灾目标选择。']
      }
    }
  },
  'oss update': {
    safety: {
      level: 'mutating',
      reason: '会更新 Bucket ACL 或公共访问阻止状态。'
    },
    examples: ['licell oss update my-bucket --acl private', 'licell oss update my-bucket --public-access-block on']
  },
  'oss rm': {
    safety: {
      level: 'destructive',
      reason: '会删除 Bucket；加 `--recursive` 时还会删除其中对象。',
      confirmFlags: ['--yes']
    },
    examples: ['licell oss rm my-bucket --yes', 'licell oss rm my-bucket --recursive --yes']
  },
  'oss info': {
    summary: '查看 Bucket 基本信息，并补充 ACL、公共访问阻止、已绑定域名。',
    examples: ['licell oss info my-bucket', 'licell oss info my-bucket --output json']
  },
  'oss ls': {
    summary: '列出 Bucket 中的对象，可按 prefix 过滤。',
    examples: ['licell oss ls my-bucket', 'licell oss ls my-bucket assets/ --limit 200']
  },
  'oss upload': {
    summary: '上传本地目录到指定 Bucket / 目录前缀。',
    examples: ['licell oss upload my-bucket --source-dir dist', 'licell oss upload my-bucket --source-dir dist --target-dir web/v2']
  },
  'oss bucket': {
    summary: '兼容命令；等同 `licell oss upload`。',
    related: ['oss upload']
  },
  'oss domain': {
    summary: 'OSS Bucket 原生自定义域名（CNAME）管理。',
    notes: [
      '原生 OSS 域名与 `deploy static` 的 CDN 域名链路不同；如需 CDN 加速与证书托管，优先使用 static deploy。',
      '原生域名首次绑定通常需要先生成 token，再通过 DNS TXT 记录完成所有权验证。'
    ],
    examples: ['licell oss domain list my-bucket', 'licell oss domain token my-bucket static.example.com', 'licell oss domain bind my-bucket static.example.com']
  },
  'oss domain token': {
    summary: '为待绑定的 OSS 自定义域名生成 TXT 验证 token。',
    examples: ['licell oss domain token my-bucket static.example.com', 'licell oss domain token my-bucket static.example.com --output json'],
    related: ['oss domain bind', 'dns records add'],
    recommendedFlow: [
      { title: '生成 token', command: 'licell oss domain token <bucket> <domain> --output json', reason: '先拿到 TXT 记录名和值。' },
      { title: '补 DNS TXT', command: 'licell dns records add <rootDomain> --rr <rr> --type TXT --value <token>', reason: '完成 OSS 域名所有权验证。' },
      { title: '执行绑定', command: 'licell oss domain bind <bucket> <domain>', reason: 'TXT 生效后正式把域名绑定到 Bucket。' }
    ]
  },
  'oss domain bind': {
    safety: {
      level: 'mutating',
      reason: '会把自定义域名绑定到 OSS Bucket。'
    },
    notes: ['如果提示域名所有权未验证，请先执行 `licell oss domain token`。']
  },
  'oss domain rm': {
    safety: {
      level: 'destructive',
      reason: '会解除 OSS Bucket 与自定义域名的绑定。',
      confirmFlags: ['--yes']
    }
  }
};
