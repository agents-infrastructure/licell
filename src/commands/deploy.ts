import type { CAC } from 'cac';
import { intro, outro, spinner } from '@clack/prompts';
import pc from 'picocolors';
import { Config } from '../utils/config';
import { formatErrorMessage } from '../utils/errors';
import { runHook } from '../utils/hooks';
import { buildDeployProjectPatch } from '../utils/deploy-config';
import { resolveDeployContext, type DeployCliOptions } from './deploy-context';
import { executeApiDeploy } from './deploy-api';
import { executeStaticDeploy } from './deploy-static';

export { resolveDeploySslEnabled } from './deploy-context';

export function registerDeployCommand(cli: CAC) {
  cli.command('deploy', '一键极速打包部署')
    .option('--type <type>', '部署类型：api 或 static（适配 CI 非交互场景）')
    .option('--entry <entry>', 'API 入口文件（Node 默认 src/index.ts；Python 默认 src/main.py）')
    .option('--dist <dist>', '静态站点目录（默认 dist）')
    .option('--runtime <runtime>', '运行时（API: nodejs20/nodejs22/python3.12/python3.13/docker；静态站: static/statis）')
    .option('--target <target>', 'API 部署后自动发布并切流到该 alias（如 prod/preview）')
    .option('--domain <domain>', '绑定完整自定义域名（如 api.your-domain.xyz）')
    .option('--domain-suffix <suffix>', '自动绑定固定子域名后缀（如 your-domain.xyz）')
    .option('--enable-cdn', '域名绑定后自动接入 CDN 并将 DNS CNAME 切到 CDN（仅 API）')
    .option('--ssl', '启用 HTTPS（使用 --domain 或 --enable-cdn 时默认自动开启；使用 --domain-suffix 需显式开启）')
    .option('--ssl-force-renew', '启用 HTTPS 时强制续签证书（忽略到期阈值）')
    .option('--acr-namespace <ns>', 'Docker 部署时使用的 ACR 命名空间（默认 licell）')
    .option('--enable-vpc', 'API 部署时启用 VPC 接入（默认启用）')
    .option('--disable-vpc', 'API 部署时禁用 VPC 接入（使用公网模式）')
    .option('--memory <mb>', '函数内存大小（MB，默认 512）')
    .option('--vcpu <n>', '函数 vCPU 核数（如 0.5 / 1 / 2，默认 0.5）')
    .option('--instance-concurrency <n>', '单实例并发数（默认自动，通常起始 10）')
    .option('--timeout <seconds>', '函数超时时间（秒，默认 30）')
    .action(async (options: DeployCliOptions) => {
      intro(pc.bgBlue(pc.white(' ▲ Deploying to Aliyun ')));

      const ctx = await resolveDeployContext(options);

      const s = spinner();
      try {
        if (ctx.project.hooks?.preDeploy) {
          s.start('执行 preDeploy hook...');
          runHook('preDeploy', ctx.project.hooks.preDeploy);
          s.stop(pc.green('✅ preDeploy hook 完成'));
        }

        let url: string;
        let promotedVersion: string | undefined;
        let fixedDomain: string | undefined;
        let healthCheckLogs: string[] = [];

        if (ctx.type === 'api') {
          const result = await executeApiDeploy(ctx, s);
          if (!result) return;
          ({ url, promotedVersion, fixedDomain, healthCheckLogs } = result);
        } else {
          const result = await executeStaticDeploy(ctx, s);
          if (!result) return;
          ({ url } = result);
        }

        s.stop(pc.green('✅ 部署成功!'));
        console.log(`\n🎉 Production URL: ${pc.cyan(pc.underline(url))}\n`);
        if (fixedDomain) {
          const fixedDomainUrl = `${ctx.enableSSL ? 'https' : 'http'}://${fixedDomain}`;
          console.log(`🌐 Fixed Domain: ${pc.cyan(pc.underline(fixedDomainUrl))}\n`);
        }
        if (ctx.releaseTarget && promotedVersion) {
          console.log(`🏷️  alias=${pc.cyan(ctx.releaseTarget)} -> version=${pc.cyan(promotedVersion)}\n`);
        }
        if (healthCheckLogs.length > 0) {
          console.log(`${healthCheckLogs.join('\n')}\n`);
        }
        const projectPatch = buildDeployProjectPatch({
          deploySucceeded: true,
          cliDomainSuffix: ctx.cliDomainSuffix,
          projectDomainSuffix: ctx.projectDomainSuffix,
          cliRuntime: ctx.cliRuntime,
          projectRuntime: ctx.projectRuntime
        });
        if (Object.keys(projectPatch).length > 0) {
          Config.setProject(projectPatch);
        }
        if (ctx.project.hooks?.postDeploy) {
          try {
            runHook('postDeploy', ctx.project.hooks.postDeploy);
          } catch (err: unknown) {
            console.warn(pc.yellow(`⚠️ postDeploy hook 执行失败，已忽略: ${formatErrorMessage(err)}`));
          }
        }
        outro('Done!');
      } catch (err: unknown) {
        s.stop(pc.red('❌ 部署失败'));
        console.error(formatErrorMessage(err));
        process.exitCode = 1;
      }
    });
}
