import type { CAC } from 'cac';
import pc from 'picocolors';
import { inspectKubernetesWorkloads, listKubernetesClusters } from '../providers/k8s';
import { ensureAuthOrExit, toOptionalString, toPromptValue } from '../utils/cli-shared';
import { formatErrorMessage } from '../utils/errors';
import { emitCliError, emitCommandResult, isJsonOutput } from '../utils/output';
import { defineCliCommand, defineCommandModule, registerCliCommand } from './module';
import { INFRA_SECTION } from './sections';

const k8sClustersCommand = defineCliCommand({
  rawName: 'k8s clusters',
  description: '列出当前地域的 ACK / ACS Kubernetes 集群',
  region: { scope: 'auth' },
  options: [{ rawName: '--name <name>', description: '按集群名称过滤' }],
  descriptor: {
    title: 'List ACK and ACS clusters',
    summary: '通过容器服务 CS 只读 API 列出当前地域的 ACK / ACS Kubernetes 集群。',
    examples: [
      'licell k8s clusters --region cn-hangzhou --output json',
      'licell k8s clusters --name feishu-connector-test-acs --output json'
    ],
    related: ['k8s workloads', 'capability search', 'api invoke'],
    agentTips: [
      '容器集群盘点优先使用本命令，不要把 ECS 实例或 FC custom-container 当成 ACK / ACS 集群。',
      '读取 `clusters[].profile` 可区分 ACS 等集群子类型；继续查询集群内部资源时使用 `k8s workloads`。'
    ],
    automation: { preferredOutput: 'json', explicitInputs: ['--region', '--name'] },
    safety: { level: 'safe', reason: '只调用 CS DescribeClusters 读取集群列表。', confirmFlags: [] },
    recommendedFlow: [
      { title: '列出集群', command: 'licell k8s clusters --output json', reason: '获取集群 ID、名称、region 和 profile。' },
      { title: '查看工作负载', command: 'licell k8s workloads <cluster> --output json', reason: '使用集群 ID 或名称读取部署、DaemonSet、StatefulSet 和 Service。' }
    ],
    result: {
      summary: '返回当前地域的 Kubernetes 集群摘要。',
      outcomeKey: 'clusters',
      fields: [
        { name: 'regionId', description: '实际查询地域。', required: true },
        { name: 'count', description: '匹配的集群数量。', required: true },
        { name: 'clusters[]', description: '集群 ID、名称、状态、类型、profile 和版本摘要。', required: true }
      ]
    }
  }
});

const k8sWorkloadsCommand = defineCliCommand({
  rawName: 'k8s workloads <cluster>',
  description: '只读查询 ACK / ACS 集群内已部署的工作负载和 Service',
  region: { scope: 'auth' },
  options: [
    { rawName: '--private', description: '使用集群 API Server 内网地址' },
    { rawName: '--request-timeout <duration>', description: 'kubectl 请求超时，默认 30s' }
  ],
  descriptor: {
    title: 'Inspect Kubernetes workloads',
    summary: '签发 15 分钟临时 KubeConfig，并通过本机 kubectl 只读查询集群内的工作负载和 Service。',
    examples: [
      'licell k8s workloads feishu-connector-test-acs --region cn-hangzhou --output json',
      'licell k8s workloads <clusterId> --private --output json'
    ],
    argumentHints: { cluster: '完整集群 ID 或唯一集群名称。' },
    related: ['k8s clusters', 'capability describe'],
    agentTips: [
      'KubeConfig 仅写入权限为 0600 的临时文件，kubectl 结束后立即删除，且不会进入 CLI JSON 输出。',
      '本命令只执行 Kubernetes get；不会创建、修改或删除集群资源。',
      '机器需已安装 kubectl；若集群只开放私网 API Server，请追加 `--private` 并确保当前网络可达。'
    ],
    automation: { preferredOutput: 'json', explicitInputs: ['cluster', '--region', '--private', '--request-timeout'] },
    safety: { level: 'safe', reason: '使用短期凭据执行 kubectl get，并在 finally 中清理本地凭据文件。', confirmFlags: [] },
    recommendedFlow: [
      { title: '定位集群', command: 'licell k8s clusters --output json', reason: '先确认唯一的集群名称或 ID。' },
      { title: '读取工作负载清单', command: 'licell k8s workloads <cluster> --output json', reason: '读取四类 Kubernetes 资源摘要。' }
    ],
    result: {
      summary: '返回集群摘要、各资源计数和经过裁剪的工作负载信息；不返回 Secret 或 KubeConfig。',
      outcomeKey: 'workloads',
      fields: [
        { name: 'cluster', description: '实际查询的集群摘要。', required: true },
        { name: 'kubeconfigExpiration', description: '本次临时 KubeConfig 的过期时间。', required: true },
        { name: 'counts', description: 'Deployment、StatefulSet、DaemonSet 和 Service 数量。', required: true },
        { name: 'workloads', description: '经过白名单裁剪的工作负载和 Service 摘要。', required: true }
      ]
    }
  }
});

function booleanOption(value: unknown) {
  return value === true || (typeof value === 'string' && ['1', 'true', 'yes'].includes(value.toLowerCase()));
}

export function registerK8sCommands(cli: CAC) {
  registerCliCommand(cli, k8sClustersCommand).action(async (options: { region?: unknown; name?: unknown }) => {
    try {
      ensureAuthOrExit();
      const result = await listKubernetesClusters({
        regionId: toOptionalString(options.region),
        name: toOptionalString(options.name)
      });
      if (isJsonOutput()) emitCommandResult(result);
      else {
        console.log(pc.bold(`Kubernetes clusters (${result.count})`));
        for (const cluster of result.clusters) {
          console.log(`- ${pc.cyan(cluster.name)}  ${cluster.clusterId}  ${cluster.profile || cluster.clusterType || '-'}  ${cluster.state || '-'}`);
        }
      }
    } catch (error) {
      if (isJsonOutput()) emitCliError(error, { stage: 'k8s' });
      else console.error(formatErrorMessage(error));
      process.exitCode = 1;
    }
  });

  registerCliCommand(cli, k8sWorkloadsCommand).action(async (
    cluster: string,
    options: { region?: unknown; private?: unknown; requestTimeout?: unknown }
  ) => {
    try {
      ensureAuthOrExit();
      const result = await inspectKubernetesWorkloads(toPromptValue(cluster, 'cluster'), {
        regionId: toOptionalString(options.region),
        privateIpAddress: booleanOption(options.private),
        requestTimeout: toOptionalString(options.requestTimeout)
      });
      if (isJsonOutput()) emitCommandResult(result);
      else {
        console.log(pc.bold(`${result.cluster.name} workloads`));
        console.log(`deployments: ${result.counts.deployments}`);
        console.log(`statefulSets: ${result.counts.statefulSets}`);
        console.log(`daemonSets: ${result.counts.daemonSets}`);
        console.log(`services: ${result.counts.services}`);
      }
    } catch (error) {
      if (isJsonOutput()) emitCliError(error, { stage: 'k8s' });
      else console.error(formatErrorMessage(error));
      process.exitCode = 1;
    }
  });
}

export const k8sCommandModule = defineCommandModule({
  section: INFRA_SECTION,
  register: registerK8sCommands,
  namespaces: {
    k8s: {
      title: 'ACK and ACS Kubernetes',
      summary: '发现 ACK / ACS 集群，并安全地只读查询集群内已部署的工作负载。',
      examples: ['licell k8s clusters --output json', 'licell k8s workloads <cluster> --output json'],
      agentTips: [
        '先用 clusters 定位集群，再用 workloads 查询 Kubernetes 数据面资源。',
        '其他未封装的 CS 能力继续通过 capability search/describe 进入 raw API fallback。'
      ]
    }
  },
  commands: [k8sClustersCommand, k8sWorkloadsCommand]
});
