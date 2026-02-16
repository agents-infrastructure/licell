import type { CAC } from 'cac';
import { intro, outro, spinner, select, text, isCancel } from '@clack/prompts';
import pc from 'picocolors';
import { Config } from '../utils/config';
import { formatErrorMessage } from '../utils/errors';
import { normalizeReleaseTarget } from '../utils/cli-helpers';
import { buildDeployProjectPatch } from '../utils/deploy-config';
import {
  DEFAULT_FC_RUNTIME,
  deployFC,
  normalizeFcRuntime,
  publishFunctionVersion,
  promoteFunctionAlias
} from '../providers/fc';
import { deployOSS } from '../providers/oss';
import { bindCustomDomain } from '../providers/domain';
import { issueAndBindSSL } from '../providers/ssl';
import { readLicellEnv } from '../utils/env';
import {
  toPromptValue,
  ensureAuthOrExit,
  isInteractiveTTY,
  toOptionalString,
  normalizeDeployType,
  normalizeDomainSuffix,
  tryNormalizeDomainSuffix,
  tryNormalizeFcRuntime
} from '../utils/cli-shared';

export function registerDeployCommand(cli: CAC) {
  cli.command('deploy', '一键极速打包部署')
    .option('--type <type>', '部署类型：api 或 static（适配 CI 非交互场景）')
    .option('--entry <entry>', 'API 入口文件（Node 默认 src/index.ts；Python 默认 src/main.py）')
    .option('--dist <dist>', '静态站点目录（默认 dist）')
    .option('--runtime <runtime>', 'API Runtime（nodejs20、nodejs22=custom.debian12、python3.12，或 python3.13=custom.debian12；默认 nodejs20）')
    .option('--target <target>', 'API 部署后自动发布并切流到该 alias（如 prod/preview）')
    .option('--domain-suffix <suffix>', '自动绑定固定子域名后缀（如 your-domain.xyz）')
    .option('--ssl', '配合固定域名自动签发/续签并绑定 HTTPS（需配置 domainSuffix）')
    .option('--ssl-force-renew', '启用 HTTPS 时强制续签证书（忽略到期阈值）')
    .action(async (options: { target?: string; domainSuffix?: string; ssl?: boolean; sslForceRenew?: boolean; type?: string; entry?: string; dist?: string; runtime?: string }) => {
    intro(pc.bgBlue(pc.white(' ▲ Deploying to Aliyun ')));
    const auth = ensureAuthOrExit();
    const interactiveTTY = isInteractiveTTY();

    let project = Config.getProject();
    if (!project.appName) {
      if (!interactiveTTY) {
        throw new Error('缺少应用名，请先配置 .licell/project.json 的 appName，或在交互终端执行 deploy 初始化');
      }
      const appName = toPromptValue(await text({
        message: '为你的应用起个名字 (小写英文):',
        placeholder: 'my-awesome-app'
      }), '应用名');
      if (!/^[a-z0-9-]+$/.test(appName)) throw new Error('应用名仅允许小写字母、数字和短横线');
      Config.setProject({ appName });
      project = Config.getProject();
    }

    const cliDomainSuffix = options.domainSuffix ? normalizeDomainSuffix(options.domainSuffix) : undefined;
    const projectDomainSuffix = tryNormalizeDomainSuffix(project.domainSuffix);
    const envDomainSuffix = tryNormalizeDomainSuffix(readLicellEnv(process.env, 'DOMAIN_SUFFIX'));
    const domainSuffix = cliDomainSuffix || projectDomainSuffix || envDomainSuffix;
    const cliRuntime = options.runtime ? normalizeFcRuntime(options.runtime) : undefined;
    const projectRuntime = tryNormalizeFcRuntime(project.runtime);
    const envRuntime = tryNormalizeFcRuntime(readLicellEnv(process.env, 'FC_RUNTIME'));
    const runtime = cliRuntime || projectRuntime || envRuntime || DEFAULT_FC_RUNTIME;
    const defaultApiEntry = runtime.startsWith('python') ? 'src/main.py' : 'src/index.ts';

    let type: 'api' | 'static';
    if (options.type) {
      type = normalizeDeployType(options.type) as 'api' | 'static';
    } else if (interactiveTTY) {
      const selectedType = await select({ message: '选择部署环境:', options: [
        { value: 'api', label: '🚀 Node/Bun 服务端 API (直推 FC 3.0 Serverless)' },
        { value: 'static', label: '📦 前端静态网站 (直推 OSS 托管)' }
      ]});
      if (isCancel(selectedType)) process.exit(0);
      if (selectedType !== 'api' && selectedType !== 'static') throw new Error('未知部署类型');
      type = selectedType;
    } else {
      type = 'api';
    }
    const releaseTarget = options.target ? normalizeReleaseTarget(options.target) : undefined;
    const enableSSL = Boolean(options.ssl);
    const forceSslRenew = Boolean(options.sslForceRenew);
    if (releaseTarget && type !== 'api') throw new Error('--target 仅适用于 API 部署');
    if (options.runtime && type !== 'api') throw new Error('--runtime 仅适用于 API 部署');
    if (enableSSL && type !== 'api') throw new Error('--ssl 仅适用于 API 部署');
    if (forceSslRenew && !enableSSL) throw new Error('--ssl-force-renew 需要与 --ssl 一起使用');
    if (enableSSL && !domainSuffix) {
      throw new Error('--ssl 需要固定域名，请提供 --domain-suffix，或在 .licell/project.json 配置 domainSuffix');
    }

    const s = spinner();
    try {
      let url = '';
      let promotedVersion: string | undefined;
      let fixedDomain: string | undefined;
      if (type === 'api') {
        const entry = options.entry
          ? toPromptValue(options.entry, '入口文件路径')
          : interactiveTTY
            ? toPromptValue(await text({
              message: runtime.startsWith('python')
                ? '入口文件路径 (Python 需包含 handler 函数):'
                : '入口文件路径 (需导出 handler):',
              initialValue: defaultApiEntry
            }), '入口文件路径')
            : defaultApiEntry;
        s.start(
          runtime.startsWith('python')
            ? '🐍 正在打包 Python 源码并推送至云端...'
            : '🔨 正在使用 Bun 极速剥离依赖打包，并推送至云端...'
        );
        url = await deployFC(project.appName!, entry, runtime);
        if (releaseTarget) {
          s.message(`函数部署完成，正在发布版本并切流到 ${releaseTarget}...`);
          promotedVersion = await publishFunctionVersion(
            project.appName!,
            `deploy ${releaseTarget} at ${new Date().toISOString()}`
          );
          await promoteFunctionAlias(
            project.appName!,
            releaseTarget,
            promotedVersion,
            `deployed by licell at ${new Date().toISOString()}`
          );
        }
        if (domainSuffix) {
          fixedDomain = `${project.appName!}.${domainSuffix}`;
          s.message(`函数部署完成，正在按固定规则绑定域名 ${fixedDomain}...`);
          await bindCustomDomain(
            fixedDomain,
            `${auth.accountId}.${auth.region}.fc.aliyuncs.com`,
            releaseTarget
          );
          if (enableSSL) {
            s.message(`固定域名绑定完成，正在签发并挂载 HTTPS 证书 (${fixedDomain})...`);
            await issueAndBindSSL(fixedDomain, s, { forceRenew: forceSslRenew });
          }
        }
      } else {
        const dist = options.dist
          ? toPromptValue(options.dist, '构建产物目录')
          : interactiveTTY
            ? toPromptValue(await text({ message: '前端构建产物目录:', initialValue: 'dist' }), '构建产物目录')
            : 'dist';
        s.start('☁️ 正在递归上传静态资源到 OSS 边缘节点...');
        url = await deployOSS(project.appName!, dist);
      }
      s.stop(pc.green('✅ 部署成功!'));
      console.log(`\n🎉 Production URL: ${pc.cyan(pc.underline(url))}\n`);
      if (fixedDomain) {
        const fixedDomainUrl = `${enableSSL ? 'https' : 'http'}://${fixedDomain}`;
        console.log(`🌐 Fixed Domain: ${pc.cyan(pc.underline(fixedDomainUrl))}\n`);
      }
      if (releaseTarget && promotedVersion) {
        console.log(`🏷️  alias=${pc.cyan(releaseTarget)} -> version=${pc.cyan(promotedVersion)}\n`);
      }
      const projectPatch = buildDeployProjectPatch({
        deploySucceeded: true,
        cliDomainSuffix,
        projectDomainSuffix,
        cliRuntime,
        projectRuntime
      });
      if (Object.keys(projectPatch).length > 0) {
        Config.setProject(projectPatch);
      }
      outro('Done!');
    } catch (err: unknown) {
      s.stop(pc.red('❌ 部署失败'));
      console.error(formatErrorMessage(err));
      process.exitCode = 1;
    }
  });
}
