import { confirm, text, isCancel, type spinner } from '@clack/prompts';
import pc from 'picocolors';
import { existsSync } from 'fs';
import { Config } from '../utils/config';
import { getRuntime } from '../providers/fc/runtime-handler';
import { ensureDefaultNetwork } from '../providers/vpc';
import {
  DEFAULT_FC_RUNTIME,
  createFcApiDeployPrecheckError,
  deployFC,
  publishFunctionVersion,
  promoteFunctionAlias,
  runFcApiDeployPrecheck,
  waitForFunctionDeploymentMarker,
  upsertAsyncInvokeConfig
} from '../providers/fc';
import { formatErrorMessage } from '../utils/errors';
import { toPromptValue, withSpinner } from '../utils/cli-shared';
import type { DeployContext } from './deploy-context';

export interface TaskDeployResult {
  functionName: string;
  runtime: string;
  asyncTask: boolean;
  configuredQualifiers: string[];
  invokeCommand: string;
  promotedVersion?: string;
  healthCheckLogs: string[];
}

function formatPrecheckIssueLines(issues: Array<{ id: string; level: 'error' | 'warning'; message: string; remediation?: string[] }>) {
  const lines: string[] = [];
  for (const issue of issues) {
    const prefix = issue.level === 'error' ? 'ERROR' : 'WARN';
    lines.push(`[${prefix}] ${issue.id}`);
    lines.push(issue.message);
    if (issue.remediation && issue.remediation.length > 0) {
      for (const tip of issue.remediation) {
        lines.push(`- ${tip}`);
      }
    }
  }
  return lines;
}

export async function executeTaskDeploy(
  ctx: DeployContext,
  s: ReturnType<typeof spinner>
): Promise<TaskDeployResult | undefined> {
  let runtime = ctx.cliRuntime || ctx.projectRuntime || ctx.envRuntime || DEFAULT_FC_RUNTIME;
  if (runtime !== 'docker' && !ctx.cliRuntime && existsSync('Dockerfile') && ctx.interactiveTTY) {
    const useDocker = await confirm({ message: '检测到 Dockerfile，是否使用 Docker 容器部署任务函数？' });
    if (isCancel(useDocker)) {
      process.exit(0);
    }
    if (useDocker) runtime = 'docker';
  }
  if (ctx.cliAcrNamespace && runtime !== 'docker') {
    throw new Error('--acr-namespace 仅适用于 --runtime docker');
  }
  if (runtime === 'docker' && ctx.cliAcrNamespace) {
    Config.setProject({ acrNamespace: ctx.cliAcrNamespace });
  }

  const defaultEntry = getRuntime(runtime).defaultEntry;
  let entry: string;
  if (runtime === 'docker') {
    entry = ctx.cliEntry || '';
  } else if (ctx.cliEntry) {
    entry = toPromptValue(ctx.cliEntry, '入口文件路径');
  } else if (ctx.interactiveTTY) {
    entry = toPromptValue(await text({
      message: runtime.startsWith('python')
        ? '任务入口文件路径 (Python 需包含 handler(event, context)):'
        : '任务入口文件路径 (需导出 handler 或 default):',
      initialValue: defaultEntry
    }), '入口文件路径');
  } else {
    entry = defaultEntry;
  }

  const precheck = runFcApiDeployPrecheck({
    runtime,
    entry,
    checkDockerDaemon: runtime === 'docker'
  });
  const precheckWarnings = precheck.issues.filter((item) => item.level === 'warning');
  if (!precheck.ok) {
    const lines = formatPrecheckIssueLines(precheck.issues);
    const err = createFcApiDeployPrecheckError(precheck) as Error & { message?: string };
    err.message = `${err.message}\n${lines.join('\n')}`;
    throw err;
  }
  if (precheckWarnings.length > 0) {
    const warnings = formatPrecheckIssueLines(precheckWarnings);
    s.message(`⚠️ 任务部署预检通过（含 warning）:\n${warnings.join('\n')}`);
  }

  let spinnerMsg = '🧩 正在打包任务函数并推送至云端...';
  if (runtime === 'docker') {
    spinnerMsg = '🐳 正在构建任务函数 Docker 镜像并推送至 ACR...';
  } else if (runtime.startsWith('python')) {
    spinnerMsg = '🐍 正在打包 Python 任务函数并推送至云端...';
  }

  const taskDeployResult = await withSpinner(
    s,
    spinnerMsg,
    '❌ 任务部署失败',
    async () => {
      if (ctx.useVpc && !ctx.project.network) {
        s.message('🌐 正在自动准备 VPC 网络...');
        try {
          const defaultNetwork = await ensureDefaultNetwork();
          Config.setProject({ network: defaultNetwork });
          ctx.project = Config.getProject();
          s.message(`✅ VPC 已就绪: ${defaultNetwork.vpcId} / ${defaultNetwork.vswId}`);
        } catch (err: unknown) {
          console.warn(pc.yellow(`⚠️ VPC 自动接入失败，回退公网模式: ${formatErrorMessage(err)}`));
        }
      }

      const deployNetwork = ctx.useVpc ? ctx.project.network : null;
      const deployOptions = {
        ...(ctx.cliResources ? { resources: ctx.cliResources } : {}),
        ...(deployNetwork !== undefined ? { network: deployNetwork } : {}),
        ensureHttpUrl: false
      };
      const deployResult = await deployFC(
        ctx.appName,
        entry,
        runtime,
        deployOptions
      );

      const configuredQualifiers = ['LATEST'];
      s.message('正在启用异步任务调用配置...');
      await upsertAsyncInvokeConfig(ctx.appName, { asyncTask: true });

      let nextPromotedVersion: string | undefined;
      if (ctx.releaseTarget) {
        s.message(`任务函数部署完成，正在发布版本并切流到 ${ctx.releaseTarget}...`);
        nextPromotedVersion = await publishFunctionVersion(
          ctx.appName,
          `task deploy ${ctx.releaseTarget} at ${new Date().toISOString()}`
        );
        await promoteFunctionAlias(
          ctx.appName,
          ctx.releaseTarget,
          nextPromotedVersion,
          `task deployed by licell at ${new Date().toISOString()}`
        );
        if (getRuntime(runtime).supportsInternalDeploymentProbe) {
          s.message(`等待 ${ctx.releaseTarget} 指向新版本并完成调用链收敛...`);
          await waitForFunctionDeploymentMarker(ctx.appName, deployResult.deploymentMarker, {
            qualifier: ctx.releaseTarget,
            timeoutMs: 90_000,
            intervalMs: 2_000
          });
        }
        await upsertAsyncInvokeConfig(ctx.appName, {
          qualifier: ctx.releaseTarget,
          asyncTask: true
        });
        configuredQualifiers.push(ctx.releaseTarget);
      }

      const invokeCommand = ctx.releaseTarget
        ? `licell task invoke ${ctx.appName} --target ${ctx.releaseTarget}`
        : `licell task invoke ${ctx.appName}`;
      const healthCheckLogs = [
        `✅ 异步任务调用已启用 (${configuredQualifiers.join(', ')})`
      ];
      return {
        functionName: ctx.appName,
        runtime,
        asyncTask: true,
        configuredQualifiers,
        invokeCommand,
        promotedVersion: nextPromotedVersion,
        healthCheckLogs
      };
    }
  );

  if (!taskDeployResult) return undefined;
  return taskDeployResult;
}
