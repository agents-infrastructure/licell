import type { CAC } from 'cac';
import { intro, outro, text, password, confirm, isCancel } from '@clack/prompts';
import pc from 'picocolors';
import { Config, DEFAULT_ALI_REGION } from '../utils/config';
import { readEnvWithFallback } from '../utils/env';
import { bootstrapLicellRamAccess } from '../providers/ram';
import { runAuthRepairFlow } from '../utils/auth-recovery';
import {
  toPromptValue,
  isInteractiveTTY,
  toOptionalString,
  normalizeRegion,
  maskAccessKeyId
} from '../utils/cli-shared';

export function registerAuthCommands(cli: CAC) {
  cli.command('login', '配置阿里云凭证')
    .option('--account-id <id>', '阿里云 Account ID（CI 场景）')
    .option('--ak <accessKeyId>', '阿里云 AccessKey ID（CI 场景）')
    .option('--sk <accessKeySecret>', '阿里云 AccessKey Secret（CI 场景）')
    .option('--region <region>', `默认地域，默认 ${DEFAULT_ALI_REGION}`)
    .option('--bootstrap-ram', '使用高权限 AK/SK 自动创建 licell 专用 RAM 用户与最小权限 AK/SK（仅保存新 key）')
    .option('--bootstrap-user <name>', 'bootstrap 模式下 RAM 用户名，默认 licell-operator')
    .option('--bootstrap-policy <name>', 'bootstrap 模式下自定义策略名，默认 LicellOperatorPolicy')
    .action(async (options: { accountId?: unknown; ak?: unknown; sk?: unknown; region?: unknown; bootstrapRam?: unknown; bootstrapUser?: unknown; bootstrapPolicy?: unknown }) => {
    intro(pc.bgBlue(pc.white(' ▲ Licell CLI (AliCloud) ')));
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
      outro(pc.green('✅ 凭证已安全保存至 ~/.licell-cli/auth.json'));
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
    outro(pc.green(`✅ bootstrap 完成，已保存 licell 专用凭证到 ~/.licell-cli/auth.json (${actionSummary})`));
  });

  cli.command('auth repair', '修复凭证权限（推荐：用超级 AK/SK 自动补齐 licell 最小权限并继续使用）')
    .option('--account-id <id>', '阿里云 Account ID（CI 场景）')
    .option('--ak <accessKeyId>', '超级 AccessKey ID（仅用于本次修复，不会保存）')
    .option('--sk <accessKeySecret>', '超级 AccessKey Secret（仅用于本次修复，不会保存）')
    .option('--region <region>', `默认地域，默认 ${DEFAULT_ALI_REGION}`)
    .option('--bootstrap-user <name>', '修复目标 RAM 用户名（默认自动识别当前 key 所属用户）')
    .option('--bootstrap-policy <name>', '修复使用的自定义策略名（默认 LicellOperatorPolicy）')
    .action(async (options: {
      accountId?: unknown;
      ak?: unknown;
      sk?: unknown;
      region?: unknown;
      bootstrapUser?: unknown;
      bootstrapPolicy?: unknown;
    }) => {
      intro(pc.bgBlue(pc.white(' ▲ Licell Auth Repair ')));
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
        commandLabel: 'licell auth repair',
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
      outro(pc.green(`✅ 授权修复完成，已更新 ~/.licell-cli/auth.json (${mode}, user=${result.userName}, policy=${result.policyName})`));
    });

  cli.command('logout', '清除本地凭证')
    .action(() => {
      const existing = Config.getAuth();
      if (!existing) {
        outro(pc.yellow('当前没有可清理的登录凭证'));
        return;
      }
      Config.clearAuth();
      outro(pc.green('✅ 已清除 ~/.licell-cli/auth.json'));
    });

  cli.command('whoami', '查看当前登录身份')
    .action(() => {
      const auth = Config.getAuth();
      if (!auth) {
        outro(pc.red('未登录，请先执行 `licell login`'));
        process.exitCode = 1;
        return;
      }
      const maskedAk = maskAccessKeyId(auth.ak);
      console.log(`\naccountId: ${pc.cyan(auth.accountId)}`);
      console.log(`region:    ${pc.cyan(auth.region)}`);
      console.log(`ak:        ${pc.cyan(maskedAk)}\n`);
      outro('Done.');
    });

  cli.command('switch', '切换默认 region')
    .option('--region <region>', '目标 region（如 cn-hangzhou）')
    .action(async (options: { region?: unknown }) => {
      const auth = Config.getAuth();
      if (!auth) {
        outro(pc.red('未登录，请先执行 `licell login`'));
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
        outro(pc.yellow(`region 未变化，仍为 ${region}`));
        return;
      }
      Config.setAuth({ ...auth, region });
      outro(pc.green(`✅ 默认 region 已切换为 ${region}`));
    });
}
