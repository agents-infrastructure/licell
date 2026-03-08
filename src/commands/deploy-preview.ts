import { confirm, isCancel } from '@clack/prompts';

export async function confirmPreviewWildcardDns(domainSuffix: string, appName: string) {
  const result = await confirm({
    message: `检测到尚未配置通配符 DNS (*.${domainSuffix})。\n`
      + `创建后，所有 preview 子域名将自动解析到 FC 网关。\n`
      + `已有的精确 DNS 记录（如 ${appName}.${domainSuffix}）不受影响。\n`
      + '是否创建？'
  });
  if (isCancel(result)) return false;
  return result;
}
