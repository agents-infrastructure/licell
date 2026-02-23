import { confirm, isCancel } from '@clack/prompts';
import pc from 'picocolors';
import { Config } from './config';
import { runInteractiveLogin } from '../commands/auth';
import { runInteractiveSetup } from '../commands/setup';
import { formatErrorMessage } from './errors';

export async function runWelcomeSetupFlow() {
  console.log(pc.cyan('\n👋 欢迎使用 Licell CLI！'));
  console.log(pc.gray('检测到您尚未配置登录信息。本向导将协助您完成初始设置。\n'));

  // 1. Ask for Auth
  const wantLogin = await confirm({
    message: '是否现在配置阿里云登录凭证？(支持全自动高权限转最小权限)',
    initialValue: true
  });

  if (isCancel(wantLogin)) {
    console.log(pc.gray('已取消初始化向导。稍后可通过 `licell login` 重新配置。'));
    return;
  }

  if (wantLogin) {
    try {
      await runInteractiveLogin();
    } catch (err) {
      console.error(pc.red(`\n❌ 登录配置失败: ${formatErrorMessage(err)}`));
      console.log(pc.gray('您可以稍后通过 `licell login` 重试登录。'));
    }
  } else {
    console.log(pc.gray('跳过登录配置。您可以通过 `licell login` 随时进行配置。'));
  }

  // 2. Ask for Setup (AI Skills)
  console.log();
  const wantSetup = await confirm({
    message: '是否配置 AI Agent Skills 和 MCP（推荐，让 AI 更好地使用 licell）？',
    initialValue: true
  });

  if (isCancel(wantSetup)) {
    console.log(pc.gray('已完成向导。稍后可通过 `licell setup` 重新配置 AI 助手。'));
    return;
  }

  if (wantSetup) {
    await runInteractiveSetup();
  } else {
    console.log(pc.gray('跳过 AI 助手配置。您可以通过 `licell setup` 随时配置。'));
  }
}
