import type { CAC } from 'cac';
import { defineCommandModule, commandInvocation, defineCliCommand, registerCliCommand } from './module';
import { text, password, confirm, isCancel } from '@clack/prompts';
import pc from 'picocolors';
import { createHash } from 'crypto';
import { Config, DEFAULT_ALI_REGION } from '../utils/config';
import { readEnvWithFallback } from '../utils/env';
import { bootstrapLicellRamAccess } from '../providers/ram';
import { executeWithAuthRecovery, runAuthRepairFlow } from '../utils/auth-recovery';
import {
  toPromptValue,
  isInteractiveTTY,
  toOptionalString,
  normalizeRegion,
  maskAccessKeyId,
  showIntro,
  showOutro
} from '../utils/cli-shared';
import { createOssBucket, createSignedOssGetUrl, isOssBucketNameUnavailableError, uploadOssObjectContent } from '../providers/oss';
import { emitCliError, emitCliEvent, emitCliResult, isJsonOutput } from '../utils/output';
import {
  buildAuthTransferBucketName,
  buildAuthTransferBucketCandidates,
  buildAuthTransferObjectKey,
  collectAuthTransferSnapshot,
  createEncryptedAuthTransferBundle,
  decodeAuthTransferBundle,
  decodeAuthTransferToken,
  encodeAuthTransferToken,
  getConfiguredAuthTransferBucket,
  hasExistingAuthTransferTargets,
  restoreAuthTransferArchive,
  setConfiguredAuthTransferBucket
} from '../utils/auth-transfer';
import { SETUP_SECTION } from './sections';

const loginCommand = defineCliCommand({
  rawName: 'login',
  description: '配置阿里云凭证',
  options: [
    { rawName: '--account-id <id>', description: '阿里云 Account ID（CI 场景）' },
    { rawName: '--ak <accessKeyId>', description: '阿里云 AccessKey ID（CI 场景）' },
    { rawName: '--sk <accessKeySecret>', description: '阿里云 AccessKey Secret（CI 场景）' },
    { rawName: '--region <region>', description: `默认地域，默认 ${DEFAULT_ALI_REGION}` },
    { rawName: '--bootstrap-ram', description: '使用高权限 AK/SK 自动创建 licell 专用 RAM 用户与最小权限 AK/SK（仅保存新 key）' },
    { rawName: '--bootstrap-user <name>', description: 'bootstrap 模式下 RAM 用户名，默认 licell-operator' },
    { rawName: '--bootstrap-policy <name>', description: 'bootstrap 模式下自定义策略名，默认 LicellOperatorPolicy' }
  ],
  descriptor: {
    examples: ['licell login', 'licell login --bootstrap-ram', 'licell login --account-id <id> --ak <ak> --sk <sk> --output json'],
    notes: ['bootstrap 模式会创建或复用 licell 专用 RAM 用户，并仅保存该专用 AccessKey。'],
    interaction: {
      ttyOnly: true,
      prompts: [
        '未显式传入时，会依次提示输入 Account ID、AccessKey ID、AccessKey Secret、Region。',
        '首次纯交互登录时，会先询问是否启用 bootstrap RAM 模式。'
      ]
    },
    automation: {
      preferredOutput: 'json',
      explicitInputs: ['--account-id', '--ak', '--sk'],
      notes: ['非交互模式下必须显式提供 `--account-id`、`--ak`、`--sk`。']
    }
  }
});

const authRepairCommand = defineCliCommand({
  rawName: 'auth repair',
  description: '修复凭证权限（推荐：用超级 AK/SK 自动补齐 licell 最小权限并继续使用）',
  options: [
    { rawName: '--account-id <id>', description: '阿里云 Account ID（CI 场景）' },
    { rawName: '--ak <accessKeyId>', description: '超级 AccessKey ID（仅用于本次修复，不会保存）' },
    { rawName: '--sk <accessKeySecret>', description: '超级 AccessKey Secret（仅用于本次修复，不会保存）' },
    { rawName: '--region <region>', description: `默认地域，默认 ${DEFAULT_ALI_REGION}` },
    { rawName: '--bootstrap-user <name>', description: '修复目标 RAM 用户名（默认自动识别当前 key 所属用户）' },
    { rawName: '--bootstrap-policy <name>', description: '修复使用的自定义策略名（默认 LicellOperatorPolicy）' }
  ],
  descriptor: {
    examples: ['licell auth repair', 'licell auth repair --ak <admin-ak> --sk <admin-sk> --output json'],
    interaction: {
      ttyOnly: true,
      prompts: ['交互模式下会尽量复用当前登录态与环境变量，并在缺失时提示补录管理员凭证。']
    },
    automation: {
      preferredOutput: 'json',
      explicitInputs: ['--ak', '--sk'],
      notes: ['自动化修复时建议显式传入管理员 `--ak` / `--sk`，避免依赖当前终端状态。']
    }
  }
});

const authExportCommand = defineCliCommand({
  rawName: 'auth export [passkey]',
  description: '加密打包当前 licell 全局凭证状态到私有 OSS，并生成 restore token',
  options: [
    { rawName: '--bucket <bucket>', description: '指定导出到哪个 OSS Bucket；默认按账号+region 推导并自动创建' },
    { rawName: '--expires-hours <hours>', description: 'restore token 内签名下载链接的有效小时数，默认 168' }
  ],
  descriptor: {
    safety: {
      level: 'mutating',
      reason: '会读取本机 ~/.licell-cli 凭证状态，加密后上传到私有 OSS Bucket。'
    },
    summary: '把当前机器的 licell 全局登录状态加密备份到私有 OSS，并返回一条可跨机器 restore 的 token。',
    examples: [
      'licell auth export',
      'licell auth export my-passphrase-123',
      'licell auth export --expires-hours 72 --output json'
    ],
    optionInsights: {
      '--bucket': {
        whenToUse: '需要把 auth bundle 上传到指定 Bucket，而不是默认的账号级 auth Bucket 时使用。',
        cautions: ['目标 Bucket 需要属于当前账号且允许 PutObject。']
      },
      '--expires-hours': {
        whenToUse: '需要控制 restore token 内签名下载链接的有效时间时使用。',
        cautions: ['超时后 token 将无法直接 restore，但 OSS 对象仍保留在 Bucket 中。']
      }
    },
    notes: [
      '默认会一起打包 ~/.licell-cli/auth.json、~/.licell-cli/config.json、~/.licell-cli/acme/ 下的文件。',
      'OSS 对象默认放在 private + public-access-block=on 的 Bucket 中，restore 通过时效性签名 URL 拉取。',
      'restore token 不包含明文 AK/SK；真正敏感内容在对象内，需 passkey 才能解密。'
    ],
    interaction: {
      ttyOnly: true,
      prompts: ['未传 `[passkey]` 时，会隐藏输入并二次确认 passkey。']
    },
    automation: {
      preferredOutput: 'json',
      explicitInputs: ['[passkey]'],
      notes: ['自动化导出时建议显式传入 passkey，避免等待终端交互。']
    }
  }
});

const authRestoreCommand = defineCliCommand({
  rawName: 'auth restore <token> [passkey]',
  cliRawName: 'auth restore [token] [passkey]',
  description: '使用 restore token + passkey 一键恢复 licell 全局凭证状态',
  options: [
    { rawName: '--yes', description: '检测到本地已有 ~/.licell-cli 文件时，跳过二次确认并直接覆盖' }
  ],
  descriptor: {
    safety: {
      level: 'mutating',
      reason: '会把解密后的全局凭证状态写回 ~/.licell-cli/。',
      confirmFlags: ['--yes']
    },
    summary: '通过 token 下载加密 bundle，并恢复 ~/.licell-cli 下的 auth/config/acme 状态。',
    examples: [
      'licell auth restore licell-auth-v1.<token>',
      'licell auth restore licell-auth-v1.<token> my-passphrase-123',
      'licell auth restore licell-auth-v1.<token> --yes'
    ],
    argumentHints: {
      token: 'restore token。TTY 交互环境下可省略并提示输入；自动化 / Agent 调用请显式传入。',
      passkey: '解密 passkey。TTY 交互环境下可省略并隐藏输入；自动化 / Agent 调用请显式传入。'
    },
    notes: [
      'restore 不依赖当前机器已登录；它通过 token 内的时效性签名 URL 从 OSS 拉取 bundle。',
      '如果本地已存在 ~/.licell-cli/auth.json / config.json / acme 文件，默认会先确认再覆盖。',
      '仅在 TTY 交互环境下允许省略 token / passkey 并逐步提示；非交互模式保持显式参数约束。'
    ],
    interaction: {
      ttyOnly: true,
      prompts: [
        '可直接执行 `licell auth restore`，然后按提示输入 restore token 与 passkey。',
        '检测到本地已有 ~/.licell-cli 文件时，会先确认是否覆盖。'
      ]
    },
    automation: {
      preferredOutput: 'json',
      explicitInputs: ['<token>', '[passkey]', '--yes'],
      notes: ['自动化恢复时建议显式传入 token、passkey；若允许覆盖现有文件，再追加 `--yes`。']
    }
  }
});

const logoutCommand = defineCliCommand({
  rawName: 'logout',
  description: '清除本地凭证'
});

const whoamiCommand = defineCliCommand({
  rawName: 'whoami',
  description: '查看当前登录身份'
});

const switchCommand = defineCliCommand({
  rawName: 'switch',
  description: '切换默认 region',
  options: [
    { rawName: '--region <region>', description: '目标 region（如 cn-hangzhou）' }
  ]
});

function parsePositiveHours(value: unknown, fallbackHours: number) {
  const normalized = toOptionalString(value);
  if (!normalized) return fallbackHours;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error('--expires-hours 必须是大于 0 的数字');
  }
  return parsed;
}

async function resolvePasskey(
  rawPasskey: unknown,
  options: {
    interactiveTTY: boolean;
    prompt: string;
    confirmPrompt?: string;
  }
) {
  const provided = toOptionalString(rawPasskey);
  if (provided) {
    if (provided.trim().length < 12) throw new Error('passkey 长度至少需要 12 个字符');
    return provided.trim();
  }
  if (!options.interactiveTTY) {
    throw new Error('非交互模式下需要显式传入 passkey');
  }
  const first = toPromptValue(await password({ message: options.prompt }), 'passkey').trim();
  if (first.length < 12) throw new Error('passkey 长度至少需要 12 个字符');
  if (!options.confirmPrompt) return first;
  const second = toPromptValue(await password({ message: options.confirmPrompt }), 'passkey 确认').trim();
  if (first !== second) throw new Error('两次输入的 passkey 不一致');
  return first;
}

/**
 * 仅对少数高摩擦但语义单一的输入（如 restore token）开放 TTY 补录。
 * 资源 CRUD / 危险操作 / 机器调用场景仍保持显式参数，避免破坏 Agent 与脚本的确定性。
 */
async function resolveRestoreToken(rawToken: unknown, interactiveTTY: boolean) {
  const provided = toOptionalString(rawToken);
  if (provided) {
    if (!provided.startsWith('licell-auth-v1.')) {
      throw new Error('restore token 格式非法，应以 licell-auth-v1. 开头');
    }
    return provided;
  }
  if (!interactiveTTY) {
    throw new Error('非交互模式下需要显式传入 restore token');
  }
  const prompted = toPromptValue(await text({ message: '输入 restore token:' }), 'restore token');
  if (!prompted.startsWith('licell-auth-v1.')) {
    throw new Error('restore token 格式非法，应以 licell-auth-v1. 开头');
  }
  return prompted;
}

async function downloadSignedAuthBundle(url: string, expectedSha256: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`下载 auth bundle 失败: HTTP ${response.status}`);
    }
    const content = Buffer.from(await response.arrayBuffer());
    const actualSha256 = createHash('sha256').update(content).digest('hex');
    if (actualSha256 !== expectedSha256) {
      throw new Error(`auth bundle 校验失败: expected=${expectedSha256}, actual=${actualSha256}`);
    }
    return content;
  } finally {
    clearTimeout(timer);
  }
}

function formatHumanDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (input: number) => String(input).padStart(2, '0');
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const offsetAbs = Math.abs(offsetMinutes);
  const offsetHours = Math.floor(offsetAbs / 60);
  const offsetRemainderMinutes = offsetAbs % 60;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())} UTC${sign}${pad(offsetHours)}:${pad(offsetRemainderMinutes)}`;
}

export function buildAuthExportHumanOutput(input: {
  token: string;
  expiresAt: string;
  fileCount: number;
  revokeCommand: string;
  bucketPreferenceSaved?: boolean;
}) {
  const lines = [
    '',
    pc.green('已生成可在另一台机器恢复的授权包。'),
    '',
    pc.bold('目标机器执行：'),
    pc.cyan(`licell auth restore '<restore-token>' '<passkey>' --yes`),
    pc.gray('把 <restore-token> 替换为下面那一整行；passkey 使用本次 export 时输入的同一个值。'),
    '',
    pc.bold('restore token（复制下面整行）：'),
    pc.cyan(input.token),
    '',
    `${pc.bold('有效期至：')} ${pc.cyan(formatHumanDateTime(input.expiresAt))}`,
    `${pc.bold('包含文件：')} ${pc.cyan(String(input.fileCount))}`
  ];

  if (input.bucketPreferenceSaved === false) {
    lines.push(pc.gray('提示：本地配置目录不可写，已跳过保存默认 auth bucket。'));
  }

  lines.push(
    '',
    pc.bold('安全提醒：'),
    pc.gray('请把 restore token 和 passkey 分开发送。'),
    '',
    pc.bold('如需撤销：'),
    pc.cyan(input.revokeCommand),
    ''
  );

  return lines.join('\n');
}

export function persistAuthTransferBucketPreference(accountId: string, region: string, bucket: string) {
  const globalConfig = Config.getGlobalConfig();
  const nextRegistry = setConfiguredAuthTransferBucket(
    globalConfig.authTransferBuckets,
    accountId,
    region,
    bucket
  );
  try {
    Config.setGlobalConfig({ authTransferBuckets: nextRegistry });
    return true;
  } catch {
    return false;
  }
}

async function ensureAuthTransferBucket(options: { accountId: string; region: string; requestedBucket?: string }) {
  const requestedBucket = toOptionalString(options.requestedBucket)?.toLowerCase();
  const globalConfig = Config.getGlobalConfig();
  const configuredBucket = requestedBucket
    ? undefined
    : getConfiguredAuthTransferBucket(globalConfig.authTransferBuckets, options.accountId, options.region);
  const candidates = requestedBucket
    ? [requestedBucket]
    : Array.from(new Set([
      ...(configuredBucket ? [configuredBucket] : []),
      ...buildAuthTransferBucketCandidates(options.accountId, options.region)
    ]));

  let lastError: unknown;
  for (const candidate of candidates) {
    try {
      const bucketResult = await createOssBucket(candidate, {
        acl: 'private',
        allowExisting: true,
        publicAccessBlock: true
      });
      const bucketPreferenceSaved = !requestedBucket
        ? persistAuthTransferBucketPreference(options.accountId, options.region, candidate)
        : undefined;
      return {
        bucket: candidate,
        bucketResult,
        bucketPreferenceSaved
      };
    } catch (err: unknown) {
      if (requestedBucket || !isOssBucketNameUnavailableError(err)) {
        throw err;
      }
      lastError = err;
    }
  }

  throw lastError || new Error(`无法为当前账号分配可用的 auth transfer bucket (${options.accountId}, ${options.region})`);
}

export async function runInteractiveLogin(options: { accountId?: unknown; ak?: unknown; sk?: unknown; region?: unknown; bootstrapRam?: unknown; bootstrapUser?: unknown; bootstrapPolicy?: unknown } = {}) {
  const interactiveTTY = isInteractiveTTY();
  const accountIdOpt = toOptionalString(options.accountId) || readEnvWithFallback(process.env, 'LICELL_ACCOUNT_ID', 'ALI_ACCOUNT_ID');
  const akOpt = toOptionalString(options.ak) || readEnvWithFallback(process.env, 'LICELL_ACCESS_KEY_ID', 'ALI_ACCESS_KEY_ID');
  const skOpt = toOptionalString(options.sk) || readEnvWithFallback(process.env, 'LICELL_ACCESS_KEY_SECRET', 'ALI_ACCESS_KEY_SECRET');
  const regionOpt = toOptionalString(options.region) || readEnvWithFallback(process.env, 'LICELL_REGION', 'ALI_REGION');
  let bootstrapRam = Boolean(options.bootstrapRam);

  if (interactiveTTY && !bootstrapRam && !accountIdOpt && !akOpt && !skOpt) {
    console.log(pc.gray('\n不会配置 RAM 权限？建议使用 bootstrap 模式自动完成最小权限配置。'));
    console.log(pc.gray('超级 AK/SK 获取地址: https://ram.console.aliyun.com/profile/access-keys'));
    console.log(pc.gray('安全说明: licell 不会保存你输入的超级 key，仅保存自动创建的 licell 专用 key。\n'));
    const chooseBootstrap = await confirm({
      message: '是否启用 bootstrap 模式自动配置 RAM 用户与专用 AccessKey？',
      initialValue: true
    });
    if (isCancel(chooseBootstrap)) process.exit(0);
    bootstrapRam = Boolean(chooseBootstrap);
  }

  if (!interactiveTTY && (!accountIdOpt || !akOpt || !skOpt)) {
    throw new Error('非交互模式下 login 需要传入 --account-id、--ak、--sk');
  }
  const accountId = accountIdOpt
    ? toPromptValue(accountIdOpt, 'Account ID')
    : toPromptValue(await text({ message: '输入阿里云 Account ID (主账号ID):' }), 'Account ID');
  const ak = akOpt
    ? toPromptValue(akOpt, 'AccessKey ID')
    : toPromptValue(await text({ message: '输入 AccessKey ID:' }), 'AccessKey ID');
  const sk = skOpt
    ? toPromptValue(skOpt, 'AccessKey Secret')
    : toPromptValue(await password({ message: '输入 AccessKey Secret:' }), 'AccessKey Secret');

  const region = !interactiveTTY && !regionOpt
    ? DEFAULT_ALI_REGION
    : regionOpt
      ? toPromptValue(regionOpt, 'Region').toLowerCase()
      : toPromptValue(
        await text({ message: `默认 Region (回车使用 ${DEFAULT_ALI_REGION}):`, initialValue: DEFAULT_ALI_REGION }),
        'Region'
      ).toLowerCase();

  if (!bootstrapRam) {
    Config.setAuth({ accountId, ak, sk, region, authSource: 'manual' });
    if (isJsonOutput()) {
      emitCliResult({
        stage: 'auth',
        action: 'login',
        mode: 'manual',
        accountId,
        region
      });
    } else {
      showOutro(pc.green('✅ 凭证已安全保存至 ~/.licell-cli/auth.json'));
    }
    return;
  }

  const bootstrapUser = toOptionalString(options.bootstrapUser);
  const bootstrapPolicy = toOptionalString(options.bootstrapPolicy);
  console.log(pc.gray('\nbootstrap 模式：正在创建 licell 专用 RAM 子用户与 AccessKey（不会保存你输入的高权限 key）...'));
  const bootstrap = await bootstrapLicellRamAccess({
    adminAuth: { accountId, ak, sk, region },
    userName: bootstrapUser || undefined,
    policyName: bootstrapPolicy || undefined
  });
  Config.setAuth({
    accountId,
    ak: bootstrap.accessKeyId,
    sk: bootstrap.accessKeySecret,
    region,
    authSource: 'bootstrap',
    ramUser: bootstrap.userName,
    ramPolicy: bootstrap.policyName
  });
  const actionSummary = `${bootstrap.createdUser ? 'created-user' : 'reuse-user'}, ${bootstrap.createdPolicy ? 'created-policy' : 'reuse-policy'}`;
  if (isJsonOutput()) {
    emitCliResult({
      stage: 'auth',
      action: 'login',
      mode: 'bootstrap',
      accountId,
      region,
      ramUser: bootstrap.userName,
      ramPolicy: bootstrap.policyName,
      summary: actionSummary
    });
  } else {
    showOutro(pc.green(`✅ bootstrap 完成，已保存 licell 专用凭证到 ~/.licell-cli/auth.json (${actionSummary})`));
  }
}

export function registerAuthCommands(cli: CAC) {
  registerCliCommand(cli, loginCommand)
    .action(async (options: { accountId?: unknown; ak?: unknown; sk?: unknown; region?: unknown; bootstrapRam?: unknown; bootstrapUser?: unknown; bootstrapPolicy?: unknown }) => {
      if (!isJsonOutput()) {
        showIntro(pc.bgBlue(pc.white(' ▲ Licell CLI (AliCloud) ')));
      } else {
        emitCliEvent({ stage: 'auth', action: 'login', status: 'start' });
      }
      await runInteractiveLogin(options);
    });

  registerCliCommand(cli, authRepairCommand)
    .action(async (options: {
      accountId?: unknown;
      ak?: unknown;
      sk?: unknown;
      region?: unknown;
      bootstrapUser?: unknown;
      bootstrapPolicy?: unknown;
    }) => {
      if (!isJsonOutput()) {
        showIntro(pc.bgBlue(pc.white(' ▲ Licell Auth Repair ')));
      } else {
        emitCliEvent({ stage: 'auth', action: 'auth repair', status: 'start' });
      }
      const interactiveTTY = isInteractiveTTY();
      const accountIdOpt = toOptionalString(options.accountId)
        || readEnvWithFallback(process.env, 'LICELL_BOOTSTRAP_ACCOUNT_ID', 'LICELL_ACCOUNT_ID')
        || readEnvWithFallback(process.env, 'ALI_ACCOUNT_ID');
      const akOpt = toOptionalString(options.ak)
        || readEnvWithFallback(process.env, 'LICELL_BOOTSTRAP_ACCESS_KEY_ID', 'LICELL_ACCESS_KEY_ID')
        || readEnvWithFallback(process.env, 'ALI_ACCESS_KEY_ID');
      const skOpt = toOptionalString(options.sk)
        || readEnvWithFallback(process.env, 'LICELL_BOOTSTRAP_ACCESS_KEY_SECRET', 'LICELL_ACCESS_KEY_SECRET')
        || readEnvWithFallback(process.env, 'ALI_ACCESS_KEY_SECRET');
      const regionOpt = toOptionalString(options.region)
        || readEnvWithFallback(process.env, 'LICELL_BOOTSTRAP_REGION', 'LICELL_REGION')
        || readEnvWithFallback(process.env, 'ALI_REGION');
      const bootstrapUser = toOptionalString(options.bootstrapUser);
      const bootstrapPolicy = toOptionalString(options.bootstrapPolicy);
      const currentAuth = Config.getAuth();

      const result = await runAuthRepairFlow({
        commandLabel: commandInvocation(authRepairCommand),
        reason: 'manual',
        interactiveTTY,
        currentAuth,
        accountId: accountIdOpt || currentAuth?.accountId,
        region: regionOpt || currentAuth?.region,
        adminAk: akOpt,
        adminSk: skOpt,
        bootstrapUser: bootstrapUser || undefined,
        bootstrapPolicy: bootstrapPolicy || undefined,
        forceRotateKey: false
      });

      const mode = result.rotatedKey ? 'rotated-key' : 'reuse-current-key';
      if (isJsonOutput()) {
        emitCliResult({
          stage: 'auth',
          action: 'auth repair',
          mode,
          accountId: result.accountId,
          region: result.region,
          userName: result.userName,
          policyName: result.policyName
        });
      } else {
        showOutro(pc.green(`✅ 授权修复完成，已更新 ~/.licell-cli/auth.json (${mode}, user=${result.userName}, policy=${result.policyName})`));
      }
    });

  registerCliCommand(cli, authExportCommand)
    .action(async (passkey: unknown, options: { bucket?: unknown; expiresHours?: unknown }) => {
      const interactiveTTY = isInteractiveTTY();
      const run = async () => {
        const auth = Config.requireAuth();
        const resolvedPasskey = await resolvePasskey(passkey, {
          interactiveTTY,
          prompt: '输入导出 passkey（至少 12 位）:',
          confirmPrompt: '再次输入 passkey 确认:'
        });
        const snapshot = collectAuthTransferSnapshot();
        const bundle = createEncryptedAuthTransferBundle(resolvedPasskey, snapshot);
        const expiresHours = parsePositiveHours(options.expiresHours, 168);
        const objectKey = buildAuthTransferObjectKey();

        const { bucket, bucketResult, bucketPreferenceSaved } = await ensureAuthTransferBucket({
          accountId: auth.accountId,
          region: auth.region,
          requestedBucket: toOptionalString(options.bucket) || undefined
        });
        await uploadOssObjectContent(bucket, objectKey, bundle.content, {
          contentType: 'application/vnd.licell.auth-bundle+json'
        });
        const signedGet = createSignedOssGetUrl(bucket, objectKey, Math.ceil(expiresHours * 3600));
        const token = encodeAuthTransferToken({
          schemaVersion: '1.0',
          kind: 'licell-auth-restore',
          bucket,
          key: objectKey,
          region: auth.region,
          signedGetUrl: signedGet.url,
          expiresAt: signedGet.expiresAt,
          objectSha256: bundle.sha256,
          createdAt: new Date().toISOString()
        });
        const restoreCommand = `licell auth restore '${token}' '<passkey>'`;
        const revokeCommand = `licell oss object rm ${bucket} ${objectKey} --yes`;

        if (isJsonOutput()) {
          emitCliResult({
            stage: 'auth.export',
            action: 'export',
            bucket,
            key: objectKey,
            bucketCreated: bucketResult.created,
            ...(bucketPreferenceSaved !== undefined ? { bucketPreferenceSaved } : {}),
            expiresAt: signedGet.expiresAt,
            fileCount: bundle.fileCount,
            includes: {
              auth: snapshot.includedAuth,
              globalConfig: snapshot.includedGlobalConfig,
              acmeFiles: snapshot.includedAcmeFiles
            },
            token,
            restoreCommand,
            revokeCommand
          });
        } else {
          console.log(buildAuthExportHumanOutput({
            token,
            expiresAt: signedGet.expiresAt,
            fileCount: bundle.fileCount,
            revokeCommand,
            bucketPreferenceSaved
          }));
          showOutro('已完成 auth export。');
        }
      };

      if (!isJsonOutput()) {
        showIntro(pc.bgBlue(pc.white(' ▲ Licell Auth Export ')));
      } else {
        emitCliEvent({ stage: 'auth.export', action: 'export', status: 'start' });
      }
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(authExportCommand),
          interactiveTTY,
          requiredCapabilities: ['oss']
        },
        run
      );
    });

  registerCliCommand(cli, authRestoreCommand)
    .action(async (token: unknown, passkey: unknown, options: { yes?: unknown }) => {
      const interactiveTTY = isInteractiveTTY();
      if (!isJsonOutput()) {
        showIntro(pc.bgBlue(pc.white(' ▲ Licell Auth Restore ')));
      } else {
        emitCliEvent({ stage: 'auth.restore', action: 'restore', status: 'start' });
      }

      const resolvedToken = await resolveRestoreToken(token, interactiveTTY);
      const payload = decodeAuthTransferToken(resolvedToken);
      if (new Date(payload.expiresAt).getTime() <= Date.now()) {
        throw new Error(`restore token 已过期: ${payload.expiresAt}`);
      }
      const resolvedPasskey = await resolvePasskey(passkey, {
        interactiveTTY,
        prompt: '输入 restore passkey:'
      });
      const bundleContent = await downloadSignedAuthBundle(payload.signedGetUrl, payload.objectSha256);
      const archive = decodeAuthTransferBundle(bundleContent, resolvedPasskey);
      const existingTargets = hasExistingAuthTransferTargets(archive);

      if (existingTargets.length > 0 && !Boolean(options.yes)) {
        if (!interactiveTTY) {
          throw new Error('检测到本机已存在 ~/.licell-cli 文件；非交互模式下请追加 --yes 允许覆盖');
        }
        const proceed = await confirm({
          message: `检测到 ${existingTargets.length} 个已存在的 ~/.licell-cli 文件，是否覆盖恢复？`,
          initialValue: false
        });
        if (isCancel(proceed)) process.exit(0);
        if (!proceed) {
          showOutro(pc.yellow('已取消恢复。'));
          return;
        }
      }

      const result = restoreAuthTransferArchive(archive);
      if (isJsonOutput()) {
        emitCliResult({
          stage: 'auth.restore',
          action: 'restore',
          bucket: payload.bucket,
          key: payload.key,
          expiresAt: payload.expiresAt,
          restoredFiles: result.restoredFiles,
          overwrittenFiles: existingTargets.length,
          targetDir: result.targetDir
        });
      } else {
        console.log(`\nbucket:          ${pc.cyan(payload.bucket)}`);
        console.log(`object:          ${pc.cyan(payload.key)}`);
        console.log(`restored files:  ${pc.cyan(String(result.restoredFiles))}`);
        console.log(`overwritten:     ${pc.cyan(String(existingTargets.length))}`);
        console.log(`target dir:      ${pc.cyan(result.targetDir)}\n`);
        showOutro(pc.green('✅ licell 全局凭证状态已恢复'));
      }
    });

  registerCliCommand(cli, logoutCommand)
    .action(() => {
      const existing = Config.getAuth();
      if (!existing) {
        if (isJsonOutput()) {
          emitCliResult({ stage: 'auth', action: 'logout', cleared: false });
        } else {
          showOutro(pc.yellow('当前没有可清理的登录凭证'));
        }
        return;
      }
      Config.clearAuth();
      if (isJsonOutput()) {
        emitCliResult({ stage: 'auth', action: 'logout', cleared: true });
      } else {
        showOutro(pc.green('✅ 已清除 ~/.licell-cli/auth.json'));
      }
    });

  registerCliCommand(cli, whoamiCommand)
    .action(() => {
      const auth = Config.getAuth();
      if (!auth) {
        const err = new Error('未登录，请先执行 `licell login`');
        if (isJsonOutput()) {
          emitCliError(err, { stage: 'auth' });
        } else {
          showOutro(pc.red('未登录，请先执行 `licell login`'));
        }
        process.exitCode = 1;
        return;
      }
      const maskedAk = maskAccessKeyId(auth.ak);
      if (isJsonOutput()) {
        emitCliResult({
          stage: 'auth',
          action: 'whoami',
          accountId: auth.accountId,
          region: auth.region,
          ak: maskedAk
        });
      } else {
        console.log(`\naccountId: ${pc.cyan(auth.accountId)}`);
        console.log(`region:    ${pc.cyan(auth.region)}`);
        console.log(`ak:        ${pc.cyan(maskedAk)}\n`);
        showOutro('Done.');
      }
    });

  registerCliCommand(cli, switchCommand)
    .action(async (options: { region?: unknown }) => {
      const auth = Config.getAuth();
      if (!auth) {
        const err = new Error('未登录，请先执行 `licell login`');
        if (isJsonOutput()) {
          emitCliError(err, { stage: 'auth' });
        } else {
          showOutro(pc.red('未登录，请先执行 `licell login`'));
        }
        process.exitCode = 1;
        return;
      }
      const interactiveTTY = isInteractiveTTY();
      const providedRegion = toOptionalString(options.region);
      if (!providedRegion && !interactiveTTY) {
        throw new Error('非交互模式下 switch 需要传入 --region');
      }
      const region = providedRegion
        ? normalizeRegion(providedRegion)
        : normalizeRegion(toPromptValue(await text({ message: '输入新 region:', initialValue: auth.region }), 'region'));
      if (region === auth.region) {
        if (isJsonOutput()) {
          emitCliResult({
            stage: 'auth',
            action: 'switch',
            changed: false,
            region
          });
        } else {
          showOutro(pc.yellow(`region 未变化，仍为 ${region}`));
        }
        return;
      }
      Config.setAuth({ ...auth, region });
      if (isJsonOutput()) {
        emitCliResult({
          stage: 'auth',
          action: 'switch',
          changed: true,
          region
        });
      } else {
        showOutro(pc.green(`✅ 默认 region 已切换为 ${region}`));
      }
    });
}

export const authCommandModule = defineCommandModule({
  section: SETUP_SECTION,
  register: registerAuthCommands,
  namespaces: {
    auth: {
      summary: '授权修复与凭证治理。',
      notes: [
        '首次配置凭证通常使用 `licell login`；`licell auth repair` 用于补齐 RAM 权限。',
        '`licell auth export` / `licell auth restore` 可把当前 ~/.licell-cli 全局状态加密转移到另一台机器。'
      ],
      examples: ['licell login', 'licell auth repair', 'licell auth export', 'licell auth restore <token>']
    }
  },
  commands: [loginCommand, authRepairCommand, authExportCommand, authRestoreCommand, logoutCommand, whoamiCommand, switchCommand]
});
