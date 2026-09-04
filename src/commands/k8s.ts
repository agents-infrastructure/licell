import type { CAC } from 'cac';
import pc from 'picocolors';
import { inspectKubernetesLogs, inspectKubernetesWorkloads, listKubernetesClusters } from '../providers/k8s';
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

const k8sLogsCommand = defineCliCommand({
  rawName: 'k8s logs <cluster> <target>',
  description: '只读读取 ACK / ACS 集群内工作负载日志',
  region: { scope: 'auth' },
  options: [
    { rawName: '--namespace <namespace>', description: 'Kubernetes 命名空间' },
    { rawName: '--container <container>', description: '容器名称；Pod 有多个容器时使用' },
    { rawName: '--tail <lines>', description: '读取最近行数，默认 100，最大 10000' },
    { rawName: '--since <duration>', description: '只读取指定时间范围内的日志，如 1h 或 30m' },
    { rawName: '--previous', description: '读取容器上一次实例的日志' },
    { rawName: '--timestamps', description: '在日志行前输出时间戳' },
    { rawName: '--private', description: '使用集群 API Server 内网地址' },
    { rawName: '--request-timeout <duration>', description: 'kubectl 请求超时，默认 30s' }
  ],
  descriptor: {
    title: 'Read Kubernetes workload logs',
    summary: '签发 15 分钟临时 KubeConfig，并通过本机 kubectl 只读读取工作负载日志；凭据不会进入输出。',
    examples: [
      'licell k8s logs feishu-connector-test-acs deployment/feishu-connector --namespace feishu-connector-prod --tail 100 --output json',
      'licell k8s logs <cluster> <pod> --namespace <namespace> --since 1h --timestamps --output json'
    ],
    argumentHints: {
      cluster: '完整集群 ID 或唯一集群名称。',
      target: 'deployment/name、statefulset/name、daemonset/name、pod/name，或简写 Deployment 名称。'
    },
    related: ['k8s clusters', 'k8s workloads'],
    agentTips: [
      'target 简写会按 deployment/name 处理；跨命名空间同名工作负载时必须显式传 --namespace。',
      'KubeConfig 仅写入权限为 0600 的临时文件，kubectl 结束后立即删除，且不会进入 CLI JSON 输出。',
      '日志内容可能包含业务敏感信息；Licell 只额外屏蔽当前 AK/SK，不替代应用侧日志脱敏。'
    ],
    automation: {
      preferredOutput: 'json',
      explicitInputs: ['cluster', 'target', '--namespace', '--container', '--tail', '--since', '--previous', '--timestamps', '--region', '--private', '--request-timeout']
    },
    safety: { level: 'safe', reason: '只执行 kubectl logs 读取日志，并在 finally 中清理本地凭据文件。', confirmFlags: [] },
    recommendedFlow: [
      { title: '定位集群', command: 'licell k8s clusters --output json', reason: '先确认唯一的集群名称或 ID。' },
      { title: '查看工作负载', command: 'licell k8s workloads <cluster> --output json', reason: '确认命名空间和 Deployment/Service。' },
      { title: '读取日志', command: 'licell k8s logs <cluster> deployment/<name> --namespace <namespace> --tail 100 --output json', reason: '使用安全的内部 KubeConfig 读取最近日志。' }
    ],
    result: {
      summary: '返回集群摘要、日志目标、行数和日志内容；不返回 KubeConfig。',
      outcomeKey: 'logs',
      fields: [
        { name: 'cluster', description: '实际查询的集群摘要。', required: true },
        { name: 'target', description: '实际传给 kubectl logs 的资源目标。', required: true },
        { name: 'namespace', description: '命名空间；未指定时为 null。', required: true },
        { name: 'lineCount', description: '返回的非空日志行数。', required: true },
        { name: 'logs', description: '日志文本；AK/SK 会被替换为 `[REDACTED]`。', required: true }
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

  registerCliCommand(cli, k8sLogsCommand).action(async (
    cluster: string,
    target: string,
    options: {
      region?: unknown;
      namespace?: unknown;
      container?: unknown;
      tail?: unknown;
      since?: unknown;
      previous?: unknown;
      timestamps?: unknown;
      private?: unknown;
      requestTimeout?: unknown;
    }
  ) => {
    try {
      ensureAuthOrExit();
      const tailInput = typeof options.tail === 'number' ? String(options.tail) : toOptionalString(options.tail);
      const tail = tailInput === undefined ? undefined : Number(tailInput);
      if (tailInput !== undefined && !Number.isInteger(tail)) throw new Error('--tail 必须是整数');
      const result = await inspectKubernetesLogs(toPromptValue(cluster, 'cluster'), toPromptValue(target, 'target'), {
        regionId: toOptionalString(options.region),
        namespace: toOptionalString(options.namespace),
        container: toOptionalString(options.container),
        tail,
        since: toOptionalString(options.since),
        previous: booleanOption(options.previous),
        timestamps: booleanOption(options.timestamps),
        privateIpAddress: booleanOption(options.private),
        requestTimeout: toOptionalString(options.requestTimeout)
      });
      if (isJsonOutput()) emitCommandResult(result);
      else process.stdout.write(result.logs);
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
      examples: [
        'licell k8s clusters --output json',
        'licell k8s workloads <cluster> --output json',
        'licell k8s logs <cluster> deployment/<name> --namespace <namespace> --output json'
      ],
      agentTips: [
        '先用 clusters 定位集群，再用 workloads 查询 Kubernetes 数据面资源。',
        '使用 logs 读取工作负载日志；不要通过 raw API 获取或传递 KubeConfig。',
        '其他未封装的 CS 能力继续通过 capability search/describe 进入 raw API fallback。'
      ]
    }
  },
  commands: [k8sClustersCommand, k8sWorkloadsCommand, k8sLogsCommand]
});
