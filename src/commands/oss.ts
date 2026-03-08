import type { CAC } from 'cac';
import { defineCommandModule, commandInvocation, defineCliCommand, registerCliCommand, type DeclaredCliCommand } from './module';
import { text } from '@clack/prompts';
import pc from 'picocolors';
import {
  bindOssBucketDomain,
  createOssBucket,
  createOssBucketDomainToken,
  deleteOssBucket,
  deleteOssBucketRecursively,
  deleteOssObject,
  downloadOssObject,
  downloadOssObjectsToDirectory,
  getOssBucketInfo,
  getOssObjectInfo,
  listOssBucketDomains,
  listOssBuckets,
  listOssObjects,
  normalizeOssBucketAcl,
  normalizeOssBucketDataRedundancyType,
  normalizeOssBucketStorageClass,
  removeOssBucketDomain,
  resolveDefaultOssDownloadDir,
  resolveDefaultOssDownloadFilePath,
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
import { emitCliResult, emitCommandResult, isJsonOutput } from '../utils/output';
import { DELIVERY_SECTION } from './sections';

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

function printObjectInfo(info: Awaited<ReturnType<typeof getOssObjectInfo>>) {
  console.log(`\nbucket:    ${pc.cyan(info.bucket)}`);
  console.log(`key:       ${pc.cyan(info.key)}`);
  console.log(`size:      ${pc.cyan(String(info.contentLength ?? info.size ?? '-'))}`);
  console.log(`type:      ${pc.cyan(info.contentType || '-')}`);
  console.log(`etag:      ${pc.cyan(info.etag || '-')}`);
  console.log(`modified:  ${pc.cyan(info.lastModified || '-')}`);
  console.log(`class:     ${pc.cyan(info.storageClass || '-')}`);
  const metadataEntries = Object.entries(info.metadata || {});
  if (metadataEntries.length === 0) {
    console.log(`metadata:  ${pc.gray('(none)')}`);
    return;
  }
  console.log(`metadata:  ${pc.cyan(`${metadataEntries[0]![0]}=${metadataEntries[0]![1]}`)}`);
  for (const [key, value] of metadataEntries.slice(1)) {
    console.log(`           ${pc.cyan(`${key}=${value}`)}`);
  }
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

const uploadCommandOptions = [
  { rawName: '--bucket <bucket>', description: 'Bucket 名称（可替代位置参数）' },
  { rawName: '--source-dir <dir>', description: '本地目录（默认 dist）' },
  { rawName: '--target-dir <dir>', description: 'Bucket 内目标目录前缀（如 mysite 或 mysite/v2）' }
] as const;

const ossListCommand = defineCliCommand({
  rawName: 'oss list',
  description: '查看 OSS Bucket 列表',
  options: [
    { rawName: '--limit <n>', description: '返回数量，默认 50' }
  ],
  descriptor: {
    examples: ['licell oss list', 'licell oss list --limit 100', 'licell oss list --output json']
  }
});

const ossInfoCommand = defineCliCommand({
  rawName: 'oss info <bucket>',
  description: '查看 OSS Bucket 详情（含 ACL / 公共访问阻止 / 域名）',
  descriptor: {
    summary: '查看 Bucket 基本信息，并补充 ACL、公共访问阻止、已绑定域名。',
    examples: ['licell oss info my-bucket', 'licell oss info my-bucket --output json']
  }
});

const ossCreateCommand = defineCliCommand({
  rawName: 'oss create <bucket>',
  description: '创建 OSS Bucket',
  options: [
    { rawName: '--acl <acl>', description: 'Bucket ACL：private / public-read / public-read-write' },
    { rawName: '--storage-class <class>', description: '默认存储类型：standard / ia / archive / cold-archive / deep-cold-archive' },
    { rawName: '--redundancy <type>', description: '冗余类型：lrs / zrs' },
    { rawName: '--public-access-block <mode>', description: 'Bucket 级公共访问阻止：on / off' }
  ],
  descriptor: {
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
  }
});

const ossUpdateCommand = defineCliCommand({
  rawName: 'oss update <bucket>',
  description: '更新 OSS Bucket 属性（ACL / 公共访问阻止）',
  options: [
    { rawName: '--acl <acl>', description: 'Bucket ACL：private / public-read / public-read-write' },
    { rawName: '--public-access-block <mode>', description: 'Bucket 级公共访问阻止：on / off' }
  ],
  descriptor: {
    safety: {
      level: 'mutating',
      reason: '会更新 Bucket ACL 或公共访问阻止状态。'
    },
    examples: ['licell oss update my-bucket --acl private', 'licell oss update my-bucket --public-access-block on']
  }
});

const ossRmCommand = defineCliCommand({
  rawName: 'oss rm <bucket>',
  description: '删除 OSS Bucket（默认仅删空 Bucket）',
  options: [
    { rawName: '--recursive', description: '先删除对象，再删除 Bucket（危险）' },
    { rawName: '--yes', description: '跳过二次确认（危险）' }
  ],
  descriptor: {
    safety: {
      level: 'destructive',
      reason: '会删除 Bucket；加 `--recursive` 时还会删除其中对象。',
      confirmFlags: ['--yes']
    },
    examples: ['licell oss rm my-bucket --yes', 'licell oss rm my-bucket --recursive --yes']
  }
});

const ossLsCommand = defineCliCommand({
  rawName: 'oss ls <bucket> [prefix]',
  description: '列出 Bucket 对象',
  options: [
    { rawName: '--limit <n>', description: '返回数量，默认 100' }
  ],
  descriptor: {
    summary: '列出 Bucket 中的对象，可按 prefix 过滤。',
    examples: ['licell oss ls my-bucket', 'licell oss ls my-bucket assets/ --limit 200']
  }
});

const ossObjectInfoCommand = defineCliCommand({
  rawName: 'oss object info <bucket> <key>',
  description: '查看 OSS 对象元数据',
  descriptor: {
    summary: '查看对象元数据（长度 / Content-Type / ETag / 用户自定义 metadata）。',
    examples: ['licell oss object info my-bucket site/index.html', 'licell oss object info my-bucket site/index.html --output json']
  }
});

const ossObjectGetCommand = defineCliCommand({
  rawName: 'oss object get <bucket> <key> [file]',
  description: '下载 OSS 对象到本地文件',
  options: [
    { rawName: '--file <path>', description: '本地文件路径（可替代位置参数）' }
  ],
  descriptor: {
    summary: '下载单个对象到本地文件。',
    examples: ['licell oss object get my-bucket site/index.html ./index.html', 'licell oss object get my-bucket site/app.js --file ./downloads/app.js'],
    optionInsights: {
      '--file': {
        whenToUse: '需要把对象保存到指定本地路径，而不是默认文件名时使用。',
        cautions: ['如不指定，默认使用对象 key 的最后一个文件名。']
      }
    }
  }
});

const ossObjectRmCommand = defineCliCommand({
  rawName: 'oss object rm <bucket> <key>',
  description: '删除 OSS 对象',
  options: [
    { rawName: '--yes', description: '跳过二次确认（危险）' }
  ],
  descriptor: {
    safety: {
      level: 'destructive',
      reason: '会删除指定 OSS 对象。',
      confirmFlags: ['--yes']
    },
    examples: ['licell oss object rm my-bucket site/old.js --yes']
  }
});

const ossDomainListCommand = defineCliCommand({
  rawName: 'oss domain list <bucket>',
  description: '查看 Bucket 已绑定的原生 OSS 域名',
  descriptor: {
    examples: ['licell oss domain list my-bucket', 'licell oss domain list my-bucket --output json']
  }
});

const ossDomainTokenCommand = defineCliCommand({
  rawName: 'oss domain token <bucket> <domain>',
  description: '为 Bucket 自定义域名生成 TXT 验证 token',
  descriptor: {
    summary: '为待绑定的 OSS 自定义域名生成 TXT 验证 token。',
    examples: ['licell oss domain token my-bucket static.example.com', 'licell oss domain token my-bucket static.example.com --output json'],
    related: ['oss domain bind', 'dns records add'],
    recommendedFlow: [
      { title: '生成 token', command: 'licell oss domain token <bucket> <domain> --output json', reason: '先拿到 TXT 记录名和值。' },
      { title: '补 DNS TXT', command: 'licell dns records add <rootDomain> --rr <rr> --type TXT --value <token>', reason: '完成 OSS 域名所有权验证。' },
      { title: '执行绑定', command: 'licell oss domain bind <bucket> <domain>', reason: 'TXT 生效后正式把域名绑定到 Bucket。' }
    ],
    result: {
      summary: '结构化结果会返回 OSS 域名验证 token，以及建议写入的 DNS TXT 记录。',
      fields: [
        { name: 'bucket', description: '目标 OSS Bucket 名称。' },
        { name: 'domain', description: '待验证的自定义域名。' },
        { name: 'token', description: 'OSS 返回的域名验证 token。' },
        { name: 'dnsVerification', description: '推荐写入的 DNS TXT 记录信息。' }
      ]
    }
  }
});

const ossDomainBindCommand = defineCliCommand({
  rawName: 'oss domain bind <bucket> <domain>',
  description: '为 Bucket 绑定原生 OSS 自定义域名',
  descriptor: {
    safety: {
      level: 'mutating',
      reason: '会把自定义域名绑定到 OSS Bucket。'
    },
    notes: ['如果提示域名所有权未验证，请先执行 `licell oss domain token`。'],
    result: {
      summary: '结构化结果会返回绑定的 Bucket / 域名，以及 OSS 返回的绑定状态。',
      outcomeKey: 'bound',
      fields: [
        { name: 'bucket', description: '目标 OSS Bucket 名称。' },
        { name: 'domain', description: '已绑定的自定义域名。' },
        { name: 'binding', description: 'OSS 返回的域名绑定状态。' }
      ]
    }
  }
});

const ossDomainUnbindCommand = defineCliCommand({
  rawName: 'oss domain unbind <bucket> <domain>',
  description: '解绑 Bucket 原生 OSS 自定义域名',
  options: [
    { rawName: '--yes', description: '跳过二次确认（危险）' }
  ],
  descriptor: {
    summary: '解绑 Bucket 原生 OSS 自定义域名。',
    safety: {
      level: 'destructive',
      reason: '会解除 OSS Bucket 与自定义域名的绑定。',
      confirmFlags: ['--yes']
    },
    result: {
      summary: '结构化结果会返回解绑目标与最终解绑状态。',
      outcomeKey: 'unbound',
      fields: [
        { name: 'bucket', description: '目标 OSS Bucket 名称。' },
        { name: 'domain', description: '已解绑或尝试解绑的自定义域名。' }
      ]
    }
  }
});

const ossUploadCommand = defineCliCommand({
  rawName: 'oss upload [bucket]',
  description: '上传本地目录到 OSS Bucket 指定目录',
  options: uploadCommandOptions,
  descriptor: {
    summary: '上传本地目录到指定 Bucket / 目录前缀。',
    related: ['oss sync up'],
    examples: ['licell oss upload my-bucket --source-dir dist', 'licell oss upload my-bucket --source-dir dist --target-dir web/v2']
  }
});

const ossBucketCommand = defineCliCommand({
  rawName: 'oss bucket [bucket]',
  description: '上传本地目录到 OSS Bucket 指定目录（兼容命令，等同 oss upload）',
  options: uploadCommandOptions,
  descriptor: {
    summary: '兼容命令；等同 `licell oss upload`。',
    related: ['oss upload', 'oss sync up']
  }
});

const ossSyncUpCommand = defineCliCommand({
  rawName: 'oss sync up [bucket]',
  description: '同步本地目录到 OSS Bucket（等同 oss upload）',
  options: uploadCommandOptions,
  descriptor: {
    summary: '同步本地目录到指定 Bucket / 目录前缀（等同 `licell oss upload`）。',
    related: ['oss upload', 'oss bucket']
  }
});

const ossSyncDownCommand = defineCliCommand({
  rawName: 'oss sync down <bucket> [prefix]',
  description: '批量下载 Bucket 对象到本地目录',
  options: [
    { rawName: '--dest-dir <dir>', description: '本地目标目录（默认 oss-download/<bucket>）' }
  ],
  descriptor: {
    summary: '把 Bucket 中某个 prefix 的对象批量下载到本地目录。',
    examples: ['licell oss sync down my-bucket --dest-dir ./downloads', 'licell oss sync down my-bucket web --dest-dir ./downloads/web'],
    optionInsights: {
      '--dest-dir': {
        whenToUse: '需要控制本地落盘目录时使用。',
        cautions: ['对象 key 中的相对路径会映射到该目录下。']
      }
    }
  }
});

export function registerOssCommands(cli: CAC) {
  registerCliCommand(cli, ossListCommand)
    .action(async (options: { limit?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(ossListCommand),
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

  registerCliCommand(cli, ossInfoCommand)
    .action(async (bucket: string) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(ossInfoCommand),
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

  registerCliCommand(cli, ossCreateCommand)
    .action(async (bucket: string, options: { acl?: unknown; storageClass?: unknown; redundancy?: unknown; publicAccessBlock?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(ossCreateCommand),
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

  registerCliCommand(cli, ossUpdateCommand)
    .action(async (bucket: string, options: { acl?: unknown; publicAccessBlock?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(ossUpdateCommand),
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

  registerCliCommand(cli, ossRmCommand)
    .action(async (bucket: string, options: { recursive?: boolean; yes?: boolean }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(ossRmCommand),
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

  registerCliCommand(cli, ossLsCommand)
    .action(async (bucket: string, prefix: string | undefined, options: { limit?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(ossLsCommand),
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


  registerCliCommand(cli, ossObjectInfoCommand)
    .action(async (bucket: string, key: string) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(ossObjectInfoCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['oss']
        },
        async () => {
          ensureAuthOrExit();
          const bucketName = toPromptValue(bucket, 'bucket');
          const objectKey = toPromptValue(key, 'key');
          const s = createSpinner();
          const info = await withSpinner(
            s,
            `正在读取 ${bucketName}/${objectKey} 元数据...`,
            '❌ 获取对象元数据失败',
            () => getOssObjectInfo(bucketName, objectKey)
          );
          if (!info) return;
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ 获取成功'));
          } else {
            emitCliResult({
              stage: 'oss.object.info',
              bucket: bucketName,
              key: objectKey,
              info
            });
            return;
          }
          printObjectInfo(info);
          console.log('');
          showOutro('Done.');
        }
      );
    });

  registerCliCommand(cli, ossObjectGetCommand)
    .action(async (bucket: string, key: string, file: string | undefined, options: { file?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(ossObjectGetCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['oss']
        },
        async () => {
          ensureAuthOrExit();
          const interactiveTTY = isInteractiveTTY();
          const bucketName = toPromptValue(bucket, 'bucket');
          const objectKey = toPromptValue(key, 'key');
          const outputFile = toOptionalString(options.file)
            || toOptionalString(file)
            || (
              interactiveTTY
                ? toPromptValue(await text({ message: '本地文件路径:', initialValue: resolveDefaultOssDownloadFilePath(objectKey) }), 'file')
                : resolveDefaultOssDownloadFilePath(objectKey)
            );

          const s = createSpinner();
          const result = await withSpinner(
            s,
            `正在下载 ${bucketName}/${objectKey} 到 ${outputFile}...`,
            '❌ 对象下载失败',
            () => downloadOssObject(bucketName, objectKey, outputFile)
          );
          if (!result) return;
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ 下载完成'));
          } else {
            emitCliResult({
              stage: 'oss.object.get',
              bucket: result.bucket,
              key: result.key,
              filePath: result.filePath,
              contentLength: result.contentLength ?? null,
              contentType: result.contentType ?? null,
              etag: result.etag ?? null
            });
            return;
          }
          console.log(`\nbucket:  ${pc.cyan(result.bucket)}`);
          console.log(`key:     ${pc.cyan(result.key)}`);
          console.log(`file:    ${pc.cyan(result.filePath)}`);
          console.log(`size:    ${pc.cyan(String(result.contentLength ?? '-'))}`);
          console.log(`type:    ${pc.cyan(result.contentType || '-')}`);
          console.log('');
          showOutro('Done.');
        }
      );
    });

  registerCliCommand(cli, ossObjectRmCommand)
    .action(async (bucket: string, key: string, options: { yes?: boolean }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(ossObjectRmCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['oss']
        },
        async () => {
          ensureAuthOrExit();
          const bucketName = toPromptValue(bucket, 'bucket');
          const objectKey = toPromptValue(key, 'key');
          await ensureDestructiveActionConfirmed(
            `删除 OSS 对象 ${bucketName}/${objectKey}`,
            { yes: Boolean(options.yes) }
          );

          const s = createSpinner();
          const result = await withSpinner(
            s,
            `正在删除 ${bucketName}/${objectKey}...`,
            '❌ 删除对象失败',
            () => deleteOssObject(bucketName, objectKey)
          );
          if (!result) return;
          if (!isJsonOutput()) {
            s.stop(pc.green(result.deleted ? '✅ 对象已删除' : '✅ 对象不存在，无需删除'));
          } else {
            emitCliResult({
              stage: 'oss.object.rm',
              bucket: result.bucket,
              key: result.key,
              deleted: result.deleted
            });
            return;
          }
          console.log(`\nbucket:   ${pc.cyan(result.bucket)}`);
          console.log(`key:      ${pc.cyan(result.key)}`);
          console.log(`deleted:  ${pc.cyan(result.deleted ? 'yes' : 'no')}`);
          console.log('');
          showOutro('Done.');
        }
      );
    });

  registerCliCommand(cli, ossDomainListCommand)
    .action(async (bucket: string) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(ossDomainListCommand),
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
            emitCommandResult({
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

  registerCliCommand(cli, ossDomainTokenCommand)
    .action(async (bucket: string, domain: string) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(ossDomainTokenCommand),
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
            emitCommandResult({
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

  registerCliCommand(cli, ossDomainBindCommand)
    .action(async (bucket: string, domain: string) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(ossDomainBindCommand),
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
            emitCommandResult({
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

  registerCliCommand(cli, ossDomainUnbindCommand)
    .action(async (bucket: string, domain: string, options: { yes?: boolean }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(ossDomainUnbindCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['oss']
        },
        async () => {
          ensureAuthOrExit();
          const bucketName = toPromptValue(bucket, 'bucket');
          const normalizedDomain = normalizeCustomDomain(domain);
          await ensureDestructiveActionConfirmed(`解绑 Bucket ${bucketName} 的 OSS 域名 ${normalizedDomain}`, { yes: Boolean(options.yes) });

          const s = createSpinner();
          const result = await withSpinner(
            s,
            `正在解绑域名 ${normalizedDomain}...`,
            '❌ 解绑 Bucket 域名失败',
            async () => ({
              unbound: await removeOssBucketDomain(bucketName, normalizedDomain)
            })
          );
          if (!result) return;
          if (!isJsonOutput()) {
            s.stop(pc.green(result.unbound ? '✅ 域名已解绑' : '✅ 域名不存在，无需解绑'));
          } else {
            emitCommandResult({
              bucket: bucketName,
              domain: normalizedDomain,
              unbound: result.unbound
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

  const registerUploadCommand = (
    command: DeclaredCliCommand,
    options: { stage: string }
  ) => {
    registerCliCommand(cli, command)
      .action(async (bucket: string | undefined, actionOptions: { bucket?: unknown; sourceDir?: unknown; targetDir?: unknown }) => {
        await executeWithAuthRecovery(
          {
            commandLabel: commandInvocation(command),
            interactiveTTY: isInteractiveTTY(),
            requiredCapabilities: ['oss']
          },
          async () => {
            ensureAuthOrExit();
            const interactiveTTY = isInteractiveTTY();
            const bucketName = toOptionalString(actionOptions.bucket)
              || toOptionalString(bucket)
              || (
                interactiveTTY
                  ? toPromptValue(await text({ message: 'Bucket 名称:' }), 'bucket')
                  : undefined
              );
            if (!bucketName) throw new Error('请通过 <bucket> 或 --bucket 指定 Bucket 名称');

            const sourceDir = toOptionalString(actionOptions.sourceDir)
              || (
                interactiveTTY
                  ? toPromptValue(await text({ message: '本地目录:', initialValue: 'dist' }), 'source-dir')
                  : 'dist'
              );
            const targetDir = toOptionalString(actionOptions.targetDir);

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
                stage: options.stage,
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
            console.log(`
bucket: ${pc.cyan(result.bucket)}`);
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

  registerCliCommand(cli, ossSyncDownCommand)
    .action(async (bucket: string, prefix: string | undefined, options: { destDir?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(ossSyncDownCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['oss']
        },
        async () => {
          ensureAuthOrExit();
          const interactiveTTY = isInteractiveTTY();
          const bucketName = toPromptValue(bucket, 'bucket');
          const normalizedPrefix = toOptionalString(prefix);
          const destDir = toOptionalString(options.destDir)
            || (
              interactiveTTY
                ? toPromptValue(await text({ message: '本地目标目录:', initialValue: resolveDefaultOssDownloadDir(bucketName) }), 'dest-dir')
                : resolveDefaultOssDownloadDir(bucketName)
            );

          const s = createSpinner();
          const result = await withSpinner(
            s,
            `正在下载 ${bucketName}${normalizedPrefix ? `/${normalizedPrefix}` : ''} 到 ${destDir}...`,
            '❌ OSS 批量下载失败',
            () => downloadOssObjectsToDirectory(bucketName, destDir, { prefix: normalizedPrefix || undefined })
          );
          if (!result) return;
          if (!isJsonOutput()) {
            s.stop(pc.green(`✅ 下载完成，共 ${result.downloadedCount} 个对象`));
          } else {
            emitCliResult({
              stage: 'oss.sync.down',
              bucket: result.bucket,
              prefix: result.prefix || null,
              destinationDir: result.destinationDir,
              downloadedCount: result.downloadedCount,
              skippedPlaceholderCount: result.skippedPlaceholderCount
            });
            return;
          }
          console.log(`\nbucket:    ${pc.cyan(result.bucket)}`);
          console.log(`prefix:    ${pc.cyan(result.prefix || '(root)')}`);
          console.log(`destDir:   ${pc.cyan(result.destinationDir)}`);
          console.log(`download:  ${pc.cyan(String(result.downloadedCount))}`);
          if (result.skippedPlaceholderCount > 0) {
            console.log(pc.yellow(`warning: 已跳过 ${result.skippedPlaceholderCount} 个目录占位对象`));
          }
          console.log('');
          showOutro('Done.');
        }
      );
    });

  registerUploadCommand(ossUploadCommand, {
    stage: 'oss.upload'
  });
  registerUploadCommand(ossBucketCommand, {
    stage: 'oss.upload'
  });
  registerUploadCommand(ossSyncUpCommand, {
    stage: 'oss.sync.up'
  });
}

export const ossCommandModule = defineCommandModule({
  section: DELIVERY_SECTION,
  register: registerOssCommands,
  namespaces: {
    oss: {
      summary: 'OSS Bucket 的创建、属性配置、原生域名绑定与对象上传/下载/删除/同步。',
      notes: [
        '`deploy static` 的生产域名默认走 CDN(sourceType=oss) + DNS；这里补充的是 OSS Bucket 原生管理能力。',
        '首次绑定 OSS 原生域名前，通常先执行 `licell oss domain token`，再添加 TXT 验证记录。'
      ],
      examples: [
        'licell oss list',
        'licell oss create my-bucket --acl private',
        'licell oss info my-bucket',
        'licell oss object info my-bucket site/index.html',
        'licell oss object get my-bucket site/index.html ./index.html',
        'licell oss sync down my-bucket site --dest-dir ./downloads/site'
      ],
      agentTips: [
        '自动化场景优先使用 `--output json`，尤其是 `oss info`、`oss object info`、`oss domain token`、`oss domain list`。',
        '要删除 Bucket 或对象时，先确认是否需要 `--yes` / `--recursive`。'
      ],
      recommendedFlow: [
        { title: '先看现状', command: 'licell oss list --output json', reason: '先拿到当前账号下的 Bucket 清单。' },
        { title: '创建 Bucket', command: 'licell oss create <bucket>', reason: '按需指定 ACL、存储类型、冗余类型。' },
        { title: '检查配置', command: 'licell oss info <bucket> --output json', reason: '确认 ACL、公共访问阻止与已绑定域名。' },
        { title: '上传内容', command: 'licell oss sync up <bucket> --source-dir dist', reason: '把本地构建产物上传到 Bucket。' },
        { title: '下载验证', command: 'licell oss object info <bucket> <key> --output json', reason: '确认对象元数据，必要时再执行下载。' }
      ]
    },
    'oss object': {
      summary: '单个 OSS 对象的查看、下载与删除。',
      examples: [
        'licell oss object info my-bucket site/index.html',
        'licell oss object get my-bucket site/index.html ./tmp/index.html',
        'licell oss object rm my-bucket site/old.js --yes'
      ]
    },
    'oss sync': {
      summary: '目录级 OSS 同步：上传本地目录或批量下载对象前缀。',
      notes: ['`oss sync up` 等同 `oss upload`；`oss sync down` 会把 prefix 下对象映射到本地目录。'],
      examples: ['licell oss sync up my-bucket --source-dir dist --target-dir web', 'licell oss sync down my-bucket web --dest-dir ./downloads/web']
    },
    'oss domain': {
      summary: 'OSS Bucket 原生自定义域名（CNAME）管理。',
      notes: [
        '原生 OSS 域名与 `deploy static` 的 CDN 域名链路不同；如需 CDN 加速与证书托管，优先使用 static deploy。',
        '原生域名首次绑定通常需要先生成 token，再通过 DNS TXT 记录完成所有权验证。'
      ],
      examples: ['licell oss domain list my-bucket', 'licell oss domain token my-bucket static.example.com', 'licell oss domain bind my-bucket static.example.com']
    }
  },
  commands: [
    ossListCommand,
    ossInfoCommand,
    ossCreateCommand,
    ossUpdateCommand,
    ossRmCommand,
    ossLsCommand,
    ossObjectInfoCommand,
    ossObjectGetCommand,
    ossObjectRmCommand,
    ossUploadCommand,
    ossBucketCommand,
    ossSyncUpCommand,
    ossSyncDownCommand,
    ossDomainListCommand,
    ossDomainTokenCommand,
    ossDomainBindCommand,
    ossDomainUnbindCommand
  ]
});
