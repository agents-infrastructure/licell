import type { CAC } from 'cac';
import { defineCommandModule, commandInvocation, defineCliCommand, registerCliCommand, type DeclaredCliCommand } from './module';
import { text } from '@clack/prompts';
import pc from 'picocolors';
import {
  applyOssBucketConfig,
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
  inspectOssBucketConfig,
  listOssBucketDomains,
  listOssBuckets,
  listOssObjects,
  normalizeOssBucketAcl,
  normalizeOssBucketDataRedundancyType,
  normalizeOssBucketStorageClass,
  planOssBucketConfig,
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
  ensureMutatingActionConfirmed,
  isInteractiveTTY,
  normalizeCustomDomain,
  showOutro,
  toOptionalString,
  toPromptValue,
  parseListLimit,
  withSpinner
} from '../utils/cli-shared';
import { resolveOptionalPayloadInput } from '../utils/payload-input';
import { parseRootAndSubdomain } from '../utils/domain';
import { emitCommandResult, isJsonOutput } from '../utils/output';
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

function printBucketConfig(config: Awaited<ReturnType<typeof inspectOssBucketConfig>>) {
  const configuredLabel = (configured: boolean, count?: number) => configured
    ? pc.cyan(count === undefined ? 'configured' : `configured (${count})`)
    : pc.gray('not configured');
  console.log(`\nbucket:     ${pc.cyan(config.bucket)}`);
  console.log(`region:     ${pc.cyan(config.regionId)}`);
  console.log(`lifecycle:  ${configuredLabel(config.lifecycle.configured, config.lifecycle.ruleCount)}`);
  for (const rule of config.lifecycle.rules) {
    console.log(`            ${pc.cyan(rule.id || '(unnamed)')}  status=${pc.gray(rule.status || '-')}  prefix=${pc.gray(rule.prefix || '(root)')}`);
  }
  console.log(`cors:       ${configuredLabel(config.cors.configured, config.cors.ruleCount)}`);
  for (const rule of config.cors.rules) {
    console.log(`            origins=${pc.cyan(rule.allowedOrigins.join(',') || '-')}  methods=${pc.gray(rule.allowedMethods.join(',') || '-')}`);
  }
  console.log(`encryption: ${config.encryption.configured ? pc.cyan(config.encryption.algorithm || 'configured') : pc.gray('not configured')}`);
  if (config.website.configured) {
    const index = config.website.indexDocument?.suffix || '-';
    const error = config.website.errorDocument
      ? `${config.website.errorDocument.key} (${config.website.errorDocument.httpStatus})`
      : '-';
    console.log(`website:    ${pc.cyan(`index=${index}  error=${error}  routingRules=${config.website.routingRuleCount}`)}`);
  } else {
    console.log(`website:    ${pc.gray('not configured')}`);
  }
}

function printBucketConfigPlan(plan: Awaited<ReturnType<typeof planOssBucketConfig>>) {
  console.log(`\nbucket:     ${pc.cyan(plan.bucket)}`);
  console.log(`region:     ${pc.cyan(plan.regionId)}`);
  console.log(`changes:    ${pc.cyan(String(plan.changeCount))}`);
  for (const change of plan.changes) {
    console.log(`            ${pc.cyan(change.section)}  action=${pc.gray(change.action)}`);
  }
  console.log(`execute:    ${plan.willExecute ? pc.yellow('yes') : pc.gray('no')}`);
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

const ossRegionOption = {
  rawName: '--region <regionId>',
  description: 'OSS 地域；仅覆盖当前命令，不传则使用 licell 默认 region'
} as const;

function toOssRegionOptions(region: unknown) {
  const regionId = toOptionalString(region);
  return regionId ? { regionId } : undefined;
}

const uploadCommandOptions = [
  ossRegionOption,
  { rawName: '--bucket <bucket>', description: 'Bucket 名称（可替代位置参数）' },
  { rawName: '--source-dir <dir>', description: '本地目录（默认 dist）' },
  { rawName: '--target-dir <dir>', description: 'Bucket 内目标目录前缀（如 mysite 或 mysite/v2）' }
] as const;

const ossListCommand = defineCliCommand({
  rawName: 'oss list',
  description: '查看 OSS Bucket 列表',
  region: { scope: 'auth' },
  options: [
    ossRegionOption,
    { rawName: '--limit <n>', description: '返回数量，默认 50' }
  ],
  descriptor: {
    examples: ['licell oss list', 'licell oss list --limit 100', 'licell oss list --output json']
  }
});

const ossInfoCommand = defineCliCommand({
  rawName: 'oss info <bucket>',
  description: '查看 OSS Bucket 详情（含 ACL / 公共访问阻止 / 域名）',
  region: { scope: 'auth' },
  options: [ossRegionOption],
  descriptor: {
    summary: '查看 Bucket 基本信息，并补充 ACL、公共访问阻止、已绑定域名。',
    examples: ['licell oss info my-bucket', 'licell oss info my-bucket --output json']
  }
});

const ossConfigCommand = defineCliCommand({
  rawName: 'oss config <bucket>',
  description: '查看 OSS Bucket 生命周期、CORS、服务端加密和静态网站配置（只读）',
  region: { scope: 'auth' },
  options: [ossRegionOption],
  descriptor: {
    title: 'Inspect OSS Bucket advanced configuration',
    summary: '一次读取 Bucket 生命周期、跨域访问、服务端加密和静态网站配置，并区分未配置与查询失败。',
    examples: [
      'licell oss config my-bucket --output json',
      'licell oss config my-bucket --region cn-hangzhou --output json'
    ],
    argumentHints: {
      bucket: 'OSS Bucket 名称；可先用 `oss list --output json` 获取。'
    },
    related: ['oss list', 'oss info', 'capability search'],
    agentTips: [
      '`configured=false` 表示 OSS 明确返回该配置不存在；权限不足、Bucket 不存在和网络错误会让命令失败，不会伪装成空配置。',
      '先用 `oss info` 查看 ACL 和公共访问阻止，再用本命令检查生命周期、CORS、默认加密和静态网站托管。'
    ],
    automation: {
      preferredOutput: 'json',
      explicitInputs: ['bucket', '--region']
    },
    safety: {
      level: 'safe',
      reason: '只调用 OSS GetBucketLifecycle、GetBucketCors、GetBucketEncryption 和 GetBucketWebsite。',
      confirmFlags: []
    },
    result: {
      fields: [
        { name: 'bucket', description: '目标 OSS Bucket 名称。', required: true },
        { name: 'regionId', description: '实际查询地域。', required: true },
        { name: 'lifecycle', description: '生命周期配置状态、规则数量与规则摘要。', required: true },
        { name: 'cors', description: 'CORS 配置状态、ResponseVary 与规则摘要。', required: true },
        { name: 'encryption', description: '服务端加密状态、算法与 KMS 配置摘要。', required: true },
        { name: 'website', description: '静态网站状态、默认首页、错误页和 routing rule 数量。', required: true }
      ]
    }
  }
});

const ossConfigApplyCommand = defineCliCommand({
  rawName: 'oss config apply <bucket>',
  description: '按 desired-state 设置或删除 OSS Bucket 高级配置',
  region: { scope: 'auth' },
  options: [
    ossRegionOption,
    { rawName: '--dry-run', description: '只读取现状并生成差异计划，不写入云端' },
    { rawName: '--yes', description: '确认执行配置变更' },
    { rawName: '--payload <json>', description: '内联 JSON desired-state' },
    { rawName: '--file <path>', description: '从当前工作目录内的文件读取 JSON desired-state' }
  ],
  descriptor: {
    title: 'Apply OSS Bucket advanced configuration',
    summary: '用一个 desired-state 计划、应用并验证生命周期、CORS、服务端加密和静态网站配置。',
    examples: [
      `licell oss config apply my-bucket --payload '{"encryption":{"algorithm":"AES256"}}' --dry-run --output json`,
      `licell oss config apply my-bucket --payload '{"encryption":{"algorithm":"AES256"}}' --yes --output json`,
      `licell oss config apply my-bucket --payload '{"website":{"indexDocument":{"suffix":"index.html","supportSubDir":false},"errorDocument":{"key":"index.html","httpStatus":200}}}' --dry-run --output json`,
      'licell oss config apply my-bucket --file ./oss-config.json --dry-run --output json'
    ],
    argumentHints: {
      bucket: 'OSS Bucket 名称；先用 `oss config <bucket> --output json` 保存变更前状态。'
    },
    related: ['oss config', 'oss info'],
    agentTips: [
      'desired-state 顶层支持 lifecycle、cors、encryption、website；字段缺失表示保持不变，对应值为 null 表示删除该配置，对象表示完整替换。',
      'website 格式为 {indexDocument?:{suffix,supportSubDir?,type?:0|1|2},errorDocument?:{key,httpStatus?:200|404}}；SPA fallback 可把 indexDocument.suffix 和 errorDocument.key 都设为 index.html，并将 httpStatus 设为 200。',
      'website 对象会完整替换现有静态网站配置，目前不接受 routingRules；执行前检查 changes[].before.routingRuleCount，避免误删已有跳转或回源规则。',
      'lifecycle 格式为 {rules:[{id,status,prefix,expiration:{days},transitions:[]}]}; cors 格式为 {responseVary,rules:[{allowedOrigins,allowedMethods,allowedHeaders,exposeHeaders,maxAgeSeconds}]}; encryption 格式为 {algorithm:AES256|KMS,kmsMasterKeyId?,kmsDataEncryption?:SM4}。',
      'Agent 必须先执行 --dry-run 检查 changes[].before/after；实际执行使用同一 payload 加 --yes，命令会读回验证并在部分失败时回滚已写入 section。'
    ],
    automation: {
      preferredOutput: 'json',
      explicitInputs: ['bucket', '--region', '--payload', '--file', '--dry-run', '--yes']
    },
    safety: {
      level: 'mutating',
      reason: '会完整替换或删除 OSS Bucket 生命周期、CORS、服务端加密、静态网站配置；必须先 dry-run，并用 --yes 确认。',
      confirmFlags: ['--yes']
    },
    optionInsights: {
      '--payload': {
        whenToUse: 'desired-state 较短、可安全内联时使用。',
        cautions: ['不要同时传 --file；字段拼写错误会被拒绝。']
      },
      '--file': {
        whenToUse: '生命周期或 CORS 规则较多时使用。',
        cautions: ['文件必须位于当前工作目录内；该文件表示完整 desired-state，不是增量 patch。']
      },
      '--dry-run': {
        whenToUse: '所有自动化和 Agent 调用都应先使用。',
        cautions: ['只生成差异，不会执行写入。']
      },
      '--yes': {
        whenToUse: '确认 dry-run 计划后执行。',
        cautions: ['null 会删除对应配置；对象会完整替换已有规则。']
      }
    },
    recommendedFlow: [
      { title: '检查现状', command: 'licell oss config <bucket> --output json', reason: '记录变更前配置。' },
      { title: '生成计划', command: 'licell oss config apply <bucket> --file <path> --dry-run --output json', reason: '检查 changes[].before/after 和 changeCount。' },
      { title: '应用并验证', command: 'licell oss config apply <bucket> --file <path> --yes --output json', reason: '应用后自动读回验证。' }
    ],
    result: {
      fields: [
        { name: 'plan', description: '目标 Bucket、当前状态、desired-state、逐 section 差异和是否执行。', required: true },
        { name: 'execution.appliedSections', description: '实际完成写入的 section；dry-run 时没有 execution。' },
        { name: 'verify.performed', description: '是否执行了写入后读回验证；dry-run 固定为 false。', required: true },
        { name: 'verify.matched', description: '执行读回验证后，状态是否与 desired-state 一致。' },
        { name: 'verify.config', description: '读回的安全配置投影；dry-run 时为变更前配置。', required: true }
      ]
    }
  }
});

const ossCreateCommand = defineCliCommand({
  rawName: 'oss create <bucket>',
  description: '创建 OSS Bucket',
  region: { scope: 'auth' },
  options: [
    ossRegionOption,
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
  region: { scope: 'auth' },
  options: [
    ossRegionOption,
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
  region: { scope: 'auth' },
  options: [
    ossRegionOption,
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
  region: { scope: 'auth' },
  options: [
    ossRegionOption,
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
  region: { scope: 'auth' },
  options: [ossRegionOption],
  descriptor: {
    summary: '查看对象元数据（长度 / Content-Type / ETag / 用户自定义 metadata）。',
    examples: [
      'licell oss object info my-bucket site/index.html',
      'licell oss object info my-bucket site/index.html --region cn-hangzhou --output json'
    ]
  }
});

const ossObjectGetCommand = defineCliCommand({
  rawName: 'oss object get <bucket> <key> [file]',
  description: '下载 OSS 对象到本地文件',
  region: { scope: 'auth' },
  options: [
    ossRegionOption,
    { rawName: '--file <path>', description: '本地文件路径（可替代位置参数）' }
  ],
  descriptor: {
    summary: '下载单个对象到本地文件。',
    examples: [
      'licell oss object get my-bucket site/index.html ./index.html',
      'licell oss object get my-bucket site/app.js --file ./downloads/app.js --region cn-hangzhou'
    ],
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
  region: { scope: 'auth' },
  options: [
    ossRegionOption,
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
  region: { scope: 'auth' },
  options: [ossRegionOption],
  descriptor: {
    examples: ['licell oss domain list my-bucket', 'licell oss domain list my-bucket --output json']
  }
});

const ossDomainTokenCommand = defineCliCommand({
  rawName: 'oss domain token <bucket> <domain>',
  description: '为 Bucket 自定义域名生成 TXT 验证 token',
  region: { scope: 'auth' },
  options: [ossRegionOption],
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
  region: { scope: 'auth' },
  options: [ossRegionOption],
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
  region: { scope: 'auth' },
  options: [
    ossRegionOption,
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
  region: { scope: 'auth' },
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
  region: { scope: 'auth' },
  options: uploadCommandOptions,
  descriptor: {
    summary: '兼容命令；等同 `licell oss upload`。',
    related: ['oss upload', 'oss sync up']
  }
});

const ossSyncUpCommand = defineCliCommand({
  rawName: 'oss sync up [bucket]',
  description: '同步本地目录到 OSS Bucket（等同 oss upload）',
  region: { scope: 'auth' },
  options: uploadCommandOptions,
  descriptor: {
    summary: '同步本地目录到指定 Bucket / 目录前缀（等同 `licell oss upload`）。',
    related: ['oss upload', 'oss bucket']
  }
});

const ossSyncDownCommand = defineCliCommand({
  rawName: 'oss sync down <bucket> [prefix]',
  description: '批量下载 Bucket 对象到本地目录',
  region: { scope: 'auth' },
  options: [
    ossRegionOption,
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
    .action(async (options: { region?: unknown; limit?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(ossListCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['oss']
        },
        async () => {
          ensureAuthOrExit();
          const regionOptions = toOssRegionOptions(options.region);
          const limit = parseListLimit(options.limit, 50, 500);
          const s = createSpinner();
          const buckets = await withSpinner(
            s,
            '正在拉取 OSS Bucket 列表...',
            '❌ 获取 Bucket 列表失败',
            () => listOssBuckets(limit, regionOptions)
          );
          if (!buckets) return;
          if (!isJsonOutput()) {
            s.stop(pc.green(`✅ 共获取 ${buckets.length} 个 Bucket`));
          }
          if (isJsonOutput()) {
            emitCommandResult({
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
    .action(async (bucket: string, options: { region?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(ossInfoCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['oss']
        },
        async () => {
          ensureAuthOrExit();
          const bucketName = toPromptValue(bucket, 'bucket');
          const regionOptions = toOssRegionOptions(options.region);
          const s = createSpinner();
          const info = await withSpinner(
            s,
            `正在拉取 Bucket ${bucketName} 详情...`,
            '❌ 获取 Bucket 详情失败',
            () => getOssBucketInfo(bucketName, regionOptions)
          );
          if (!info) return;
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ 获取成功'));
          } else {
            emitCommandResult({
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

  registerCliCommand(cli, ossConfigCommand)
    .action(async (bucket: string, options: { region?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(ossConfigCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['oss-config-read']
        },
        async () => {
          ensureAuthOrExit();
          const bucketName = toPromptValue(bucket, 'bucket');
          const regionOptions = toOssRegionOptions(options.region);
          const s = createSpinner();
          const config = await withSpinner(
            s,
            `正在拉取 Bucket ${bucketName} 高级配置...`,
            '❌ 获取 Bucket 高级配置失败',
            () => inspectOssBucketConfig(bucketName, regionOptions)
          );
          if (!config) return;
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ 获取成功'));
            printBucketConfig(config);
            console.log('');
            showOutro('Done.');
            return;
          }
          emitCommandResult(config);
        }
      );
    });

  registerCliCommand(cli, ossConfigApplyCommand)
    .action(async (bucket: string, options: { region?: unknown; payload?: unknown; file?: unknown; dryRun?: unknown; yes?: unknown }) => {
      const dryRun = Boolean(options.dryRun);
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(ossConfigApplyCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: [dryRun ? 'oss-config-read' : 'oss-config-write']
        },
        async () => {
          ensureAuthOrExit();
          const bucketName = toPromptValue(bucket, 'bucket');
          const rawDesiredState = resolveOptionalPayloadInput({ payload: options.payload, file: options.file });
          if (!rawDesiredState) throw new Error('oss config apply 需要 --payload 或 --file');
          let desiredState: unknown;
          try {
            desiredState = JSON.parse(rawDesiredState);
          } catch {
            throw new Error('OSS config desired-state 不是有效 JSON');
          }
          const regionOptions = toOssRegionOptions(options.region);
          const s = createSpinner();
          if (dryRun) {
            const plan = await withSpinner(
              s,
              `正在规划 Bucket ${bucketName} 高级配置变更...`,
              '❌ 生成 OSS config 计划失败',
              () => planOssBucketConfig(bucketName, desiredState, regionOptions)
            );
            if (!plan) return;
            const result = { plan, verify: { performed: false, config: plan.current } };
            if (isJsonOutput()) emitCommandResult(result);
            else {
              s.stop(pc.green('✅ 计划生成成功'));
              printBucketConfigPlan(plan);
              console.log('');
              showOutro('Done (dry-run).');
            }
            return;
          }
          await ensureMutatingActionConfirmed(`应用 Bucket ${bucketName} 高级配置`, {
            yes: Boolean(options.yes),
            interactiveTTY: isInteractiveTTY()
          });
          const result = await withSpinner(
            s,
            `正在应用并验证 Bucket ${bucketName} 高级配置...`,
            '❌ 应用 OSS config 失败',
            () => applyOssBucketConfig(bucketName, desiredState, regionOptions)
          );
          if (!result) return;
          if (isJsonOutput()) emitCommandResult(result);
          else {
            s.stop(pc.green('✅ 配置已应用并通过读回验证'));
            printBucketConfigPlan(result.plan);
            console.log('');
            showOutro('Done.');
          }
        }
      );
    });

  registerCliCommand(cli, ossCreateCommand)
    .action(async (bucket: string, options: { region?: unknown; acl?: unknown; storageClass?: unknown; redundancy?: unknown; publicAccessBlock?: unknown }) => {
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
          const regionOptions = toOssRegionOptions(options.region);

          const s = createSpinner();
          const result = await withSpinner(
            s,
            `正在创建 Bucket ${bucketName}...`,
            '❌ 创建 Bucket 失败',
            () => createOssBucket(bucketName, {
              ...(regionOptions || {}),
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
            emitCommandResult({
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
    .action(async (bucket: string, options: { region?: unknown; acl?: unknown; publicAccessBlock?: unknown }) => {
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
          const regionOptions = toOssRegionOptions(options.region);
          if (!acl && publicAccessBlock === undefined) {
            throw new Error('oss update 至少需要一个变更：--acl 或 --public-access-block');
          }

          const s = createSpinner();
          const info = await withSpinner(
            s,
            `正在更新 Bucket ${bucketName} 配置...`,
            '❌ 更新 Bucket 配置失败',
            () => updateOssBucket(bucketName, {
              ...(regionOptions || {}),
              acl: acl ? normalizeOssBucketAcl(acl) : undefined,
              publicAccessBlock
            })
          );
          if (!info) return;
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ Bucket 配置已更新'));
          } else {
            emitCommandResult({
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
    .action(async (bucket: string, options: { region?: unknown; recursive?: boolean; yes?: boolean }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(ossRmCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['oss']
        },
        async () => {
          ensureAuthOrExit();
          const bucketName = toPromptValue(bucket, 'bucket');
          const regionOptions = toOssRegionOptions(options.region);
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
            () => (options.recursive
              ? deleteOssBucketRecursively(bucketName, regionOptions)
              : deleteOssBucket(bucketName, regionOptions))
          );
          if (!result) return;

          if (!isJsonOutput()) {
            s.stop(pc.green(result.deletedBucket ? '✅ Bucket 已删除' : '✅ Bucket 不存在，无需删除'));
          } else {
            emitCommandResult({
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
    .action(async (bucket: string, prefix: string | undefined, options: { region?: unknown; limit?: unknown }) => {
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
          const regionOptions = toOssRegionOptions(options.region);
          const limit = parseListLimit(options.limit, 100, 2000);
          const s = createSpinner();
          const objects = await withSpinner(
            s,
            `正在列出 ${bucketName} 对象...`,
            '❌ 获取对象列表失败',
            () => listOssObjects(bucketName, normalizedPrefix || undefined, limit, regionOptions)
          );
          if (!objects) return;
          if (!isJsonOutput()) {
            s.stop(pc.green(`✅ 共获取 ${objects.length} 个对象`));
          }
          if (isJsonOutput()) {
            emitCommandResult({
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
    .action(async (bucket: string, key: string, options: { region?: unknown }) => {
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
          const regionOptions = toOssRegionOptions(options.region);
          const s = createSpinner();
          const info = await withSpinner(
            s,
            `正在读取 ${bucketName}/${objectKey} 元数据...`,
            '❌ 获取对象元数据失败',
            () => getOssObjectInfo(bucketName, objectKey, regionOptions)
          );
          if (!info) return;
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ 获取成功'));
          } else {
            emitCommandResult({
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
    .action(async (bucket: string, key: string, file: string | undefined, options: { region?: unknown; file?: unknown }) => {
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
          const regionOptions = toOssRegionOptions(options.region);
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
            () => downloadOssObject(bucketName, objectKey, outputFile, regionOptions)
          );
          if (!result) return;
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ 下载完成'));
          } else {
            emitCommandResult({
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
    .action(async (bucket: string, key: string, options: { region?: unknown; yes?: boolean }) => {
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
          const regionOptions = toOssRegionOptions(options.region);
          await ensureDestructiveActionConfirmed(
            `删除 OSS 对象 ${bucketName}/${objectKey}`,
            { yes: Boolean(options.yes) }
          );

          const s = createSpinner();
          const result = await withSpinner(
            s,
            `正在删除 ${bucketName}/${objectKey}...`,
            '❌ 删除对象失败',
            () => deleteOssObject(bucketName, objectKey, regionOptions)
          );
          if (!result) return;
          if (!isJsonOutput()) {
            s.stop(pc.green(result.deleted ? '✅ 对象已删除' : '✅ 对象不存在，无需删除'));
          } else {
            emitCommandResult({
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
    .action(async (bucket: string, options: { region?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(ossDomainListCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['oss']
        },
        async () => {
          ensureAuthOrExit();
          const bucketName = toPromptValue(bucket, 'bucket');
          const regionOptions = toOssRegionOptions(options.region);
          const s = createSpinner();
          const domains = await withSpinner(
            s,
            `正在获取 Bucket ${bucketName} 的域名绑定...`,
            '❌ 获取 Bucket 域名失败',
            () => listOssBucketDomains(bucketName, regionOptions)
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
    .action(async (bucket: string, domain: string, options: { region?: unknown }) => {
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
          const regionOptions = toOssRegionOptions(options.region);
          const s = createSpinner();
          const token = await withSpinner(
            s,
            `正在为 ${normalizedDomain} 生成 OSS 域名验证 token...`,
            '❌ 生成域名验证 token 失败',
            () => createOssBucketDomainToken(bucketName, normalizedDomain, regionOptions)
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
    .action(async (bucket: string, domain: string, options: { region?: unknown }) => {
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
          const regionOptions = toOssRegionOptions(options.region);
          const s = createSpinner();
          const binding = await withSpinner(
            s,
            `正在为 Bucket ${bucketName} 绑定域名 ${normalizedDomain}...`,
            '❌ Bucket 域名绑定失败',
            () => bindOssBucketDomain(bucketName, normalizedDomain, regionOptions)
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
    .action(async (bucket: string, domain: string, options: { region?: unknown; yes?: boolean }) => {
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
          const regionOptions = toOssRegionOptions(options.region);
          await ensureDestructiveActionConfirmed(`解绑 Bucket ${bucketName} 的 OSS 域名 ${normalizedDomain}`, { yes: Boolean(options.yes) });

          const s = createSpinner();
          const result = await withSpinner(
            s,
            `正在解绑域名 ${normalizedDomain}...`,
            '❌ 解绑 Bucket 域名失败',
            async () => ({
              unbound: await removeOssBucketDomain(bucketName, normalizedDomain, regionOptions)
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
      .action(async (bucket: string | undefined, actionOptions: { region?: unknown; bucket?: unknown; sourceDir?: unknown; targetDir?: unknown }) => {
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
            const regionOptions = toOssRegionOptions(actionOptions.region);

            const s = createSpinner();
            const result = await withSpinner(
              s,
              `正在上传 ${sourceDir} 到 OSS Bucket ${bucketName}${targetDir ? `/${targetDir}` : ''}...`,
              '❌ OSS 目录上传失败',
              () => uploadDirectoryToBucket(bucketName, sourceDir, {
                ...(regionOptions || {}),
                targetDir
              })
            );
            if (!result) return;

            if (!isJsonOutput()) {
              s.stop(pc.green(`✅ 上传完成，共 ${result.uploadedCount} 个文件`));
            } else {
              emitCommandResult({
                bucket: result.bucket,
                sourceDir,
                targetDir: result.targetDir || null,
                uploadedCount: result.uploadedCount,
                skippedSymlinkCount: result.skippedSymlinkCount,
                baseUrl: result.baseUrl
              }, { stage: options.stage });
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
    .action(async (bucket: string, prefix: string | undefined, options: { region?: unknown; destDir?: unknown }) => {
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
          const regionOptions = toOssRegionOptions(options.region);
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
            () => downloadOssObjectsToDirectory(bucketName, destDir, {
              ...(regionOptions || {}),
              prefix: normalizedPrefix || undefined
            })
          );
          if (!result) return;
          if (!isJsonOutput()) {
            s.stop(pc.green(`✅ 下载完成，共 ${result.downloadedCount} 个对象`));
          } else {
            emitCommandResult({
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
        '首次绑定 OSS 原生域名前，通常先执行 `licell oss domain token`，再添加 TXT 验证记录。',
        '`oss config` 会并行读取生命周期、CORS、服务端加密和静态网站配置；未配置与无权限会被明确区分。',
        '`oss config apply` 使用 desired-state 完整替换选中的配置 section；必须先 dry-run，再显式确认。',
        '所有 OSS 子命令都支持 `--region <regionId>` 覆盖当前调用的地域；未传时使用 licell 默认 region，且覆盖不会写回全局配置。'
      ],
      examples: [
        'licell oss list',
        'licell oss create my-bucket --acl private',
        'licell oss info my-bucket',
        'licell oss config my-bucket --output json',
        `licell oss config apply my-bucket --payload '{"encryption":{"algorithm":"AES256"}}' --dry-run --output json`,
        `licell oss config apply my-bucket --payload '{"website":{"indexDocument":{"suffix":"index.html"},"errorDocument":{"key":"index.html","httpStatus":200}}}' --dry-run --output json`,
        'licell oss object info my-bucket site/index.html',
        'licell oss object get my-bucket site/index.html ./index.html --region cn-hangzhou',
        'licell oss sync down my-bucket site --dest-dir ./downloads/site'
      ],
      agentTips: [
        '自动化场景优先使用 `--output json`，尤其是 `oss info`、`oss config`、`oss object info`、`oss domain token`、`oss domain list`。',
        '要删除 Bucket 或对象时，先确认是否需要 `--yes` / `--recursive`。'
      ],
      recommendedFlow: [
        { title: '先看现状', command: 'licell oss list --output json', reason: '先拿到当前账号下的 Bucket 清单。' },
        { title: '创建 Bucket', command: 'licell oss create <bucket>', reason: '按需指定 ACL、存储类型、冗余类型。' },
        { title: '检查基础配置', command: 'licell oss info <bucket> --output json', reason: '确认 ACL、公共访问阻止与已绑定域名。' },
        { title: '检查高级配置', command: 'licell oss config <bucket> --output json', reason: '确认生命周期、CORS、默认服务端加密与静态网站托管。' },
        { title: '规划高级配置变更', command: 'licell oss config apply <bucket> --file <path> --dry-run --output json', reason: '执行前检查完整 desired-state 差异。' },
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
    ossConfigCommand,
    ossConfigApplyCommand,
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
