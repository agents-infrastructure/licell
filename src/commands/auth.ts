import type { CAC } from 'cac';
import { intro, outro, text, password, isCancel } from '@clack/prompts';
import pc from 'picocolors';
import { Config, DEFAULT_ALI_REGION } from '../utils/config';
import { readEnvWithFallback } from '../utils/env';
import {
  toPromptValue,
  ensureAuthOrExit,
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
    .action(async (options: { accountId?: unknown; ak?: unknown; sk?: unknown; region?: unknown }) => {
    intro(pc.bgBlue(pc.white(' ▲ Licell CLI (AliCloud) ')));
    const interactiveTTY = isInteractiveTTY();
    const accountIdOpt = toOptionalString(options.accountId) || readEnvWithFallback(process.env, 'LICELL_ACCOUNT_ID', 'ALI_ACCOUNT_ID');
    const akOpt = toOptionalString(options.ak) || readEnvWithFallback(process.env, 'LICELL_ACCESS_KEY_ID', 'ALI_ACCESS_KEY_ID');
    const skOpt = toOptionalString(options.sk) || readEnvWithFallback(process.env, 'LICELL_ACCESS_KEY_SECRET', 'ALI_ACCESS_KEY_SECRET');
    const regionOpt = toOptionalString(options.region) || readEnvWithFallback(process.env, 'LICELL_REGION', 'ALI_REGION');

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

    if (!interactiveTTY && !regionOpt) {
      Config.setAuth({ accountId, ak, sk, region: DEFAULT_ALI_REGION });
      outro(pc.green(`✅ 凭证已安全保存至 ~/.licell-cli/auth.json (region=${DEFAULT_ALI_REGION})`));
      return;
    }

    const region = regionOpt
      ? toPromptValue(regionOpt, 'Region').toLowerCase()
      : toPromptValue(
        await text({ message: `默认 Region (回车使用 ${DEFAULT_ALI_REGION}):`, initialValue: DEFAULT_ALI_REGION }),
        'Region'
      ).toLowerCase();

    Config.setAuth({ accountId, ak, sk, region });
    outro(pc.green('✅ 凭证已安全保存至 ~/.licell-cli/auth.json'));
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
