import { text, type spinner } from '@clack/prompts';
import { deployOSS } from '../providers/oss';
import { detectStaticDistDir } from '../utils/static-dist';
import { toPromptValue, withSpinner } from '../utils/cli-shared';
import type { DeployContext } from './deploy-context';

export interface StaticDeployResult {
  url: string;
}

export async function executeStaticDeploy(
  ctx: DeployContext,
  s: ReturnType<typeof spinner>
): Promise<StaticDeployResult | undefined> {
  const detectedDist = detectStaticDistDir();
  const dist = ctx.cliDist
    ? toPromptValue(ctx.cliDist, '构建产物目录')
    : ctx.interactiveTTY
      ? toPromptValue(await text({ message: '前端构建产物目录:', initialValue: detectedDist }), '构建产物目录')
      : detectedDist;
  const staticDeployResult = await withSpinner(
    s,
    '☁️ 正在递归上传静态资源到 OSS 边缘节点...',
    '❌ 部署失败',
    async () => ({ url: await deployOSS(ctx.appName, dist) })
  );
  if (!staticDeployResult) return undefined;
  return staticDeployResult;
}
