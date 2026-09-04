import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { Config, type AuthConfig } from '../utils/config';
import {
  executeAlicloudApi,
  type OpenApiRunnerContext,
  type OpenApiRunnerResult
} from './openapi/runner';
import { findExecutableOnPath } from './openapi/runner-manager';

type ExecuteApi = (
  ref: string,
  input: Record<string, unknown>,
  context: OpenApiRunnerContext
) => Promise<Pick<OpenApiRunnerResult, 'ok' | 'exitCode' | 'stderr' | 'response'>>;

type SpawnKubectl = (
  command: string,
  args: string[]
) => Promise<{ exitCode: number; signal: string | null; stdout: string; stderr: string }>;

export interface KubernetesProviderDependencies {
  executeApi?: ExecuteApi;
  findExecutable?: typeof findExecutableOnPath;
  spawnKubectl?: SpawnKubectl;
  tempRoot?: string;
}

export interface KubernetesQueryOptions {
  regionId?: string;
  name?: string;
  auth?: AuthConfig;
}

export interface KubernetesLogsOptions extends KubernetesQueryOptions {
  privateIpAddress?: boolean;
  requestTimeout?: string;
  namespace?: string;
  container?: string;
  tail?: number;
  since?: string;
  previous?: boolean;
  timestamps?: boolean;
}

export interface KubernetesClusterSummary {
  clusterId: string;
  name: string;
  regionId?: string;
  state?: string;
  clusterType?: string;
  profile?: string;
  kubernetesVersion?: string;
  createdAt?: string;
}

export class KubernetesRbacForbiddenError extends Error {
  readonly code = 'K8S_RBAC_FORBIDDEN';
  readonly details: { clusterId: string; userId?: string };

  constructor(cluster: KubernetesClusterSummary, stderr: string) {
    const userId = stderr.match(/User "([^"]+)"/)?.[1];
    super(
      `Kubernetes 集群内 RBAC 不足，无法读取 ${cluster.name} 的工作负载；` +
      `请为当前 RAM 身份${userId ? ` ${userId}` : ''} 配置该集群的只读 RBAC。` +
      'licell auth repair 仅修复云 API RAM 权限，不能补集群内 RBAC。'
    );
    this.name = 'KubernetesRbacForbiddenError';
    this.details = { clusterId: cluster.clusterId, ...(userId ? { userId } : {}) };
  }
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function stringField(value: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const item = value[key];
    if (typeof item === 'string' && item.trim()) return item.trim();
  }
  return undefined;
}

function clusterRecords(response: unknown): Record<string, unknown>[] {
  if (Array.isArray(response)) return response.map(record).filter(Boolean) as Record<string, unknown>[];
  const root = record(response);
  if (!root) return [];
  for (const key of ['clusters', 'Clusters', 'items', 'Items']) {
    if (Array.isArray(root[key])) return (root[key] as unknown[]).map(record).filter(Boolean) as Record<string, unknown>[];
  }
  return [];
}

function normalizeCluster(value: Record<string, unknown>): KubernetesClusterSummary | undefined {
  const clusterId = stringField(value, 'cluster_id', 'clusterId', 'ClusterId', 'id');
  const name = stringField(value, 'name', 'Name', 'cluster_name', 'clusterName');
  if (!clusterId || !name) return undefined;
  return {
    clusterId,
    name,
    regionId: stringField(value, 'region_id', 'regionId', 'RegionId'),
    state: stringField(value, 'state', 'State', 'status', 'Status'),
    clusterType: stringField(value, 'cluster_type', 'clusterType', 'ClusterType'),
    profile: stringField(value, 'profile', 'Profile'),
    kubernetesVersion: stringField(value, 'current_version', 'kubernetes_version', 'kubernetesVersion'),
    createdAt: stringField(value, 'created', 'created_at', 'createdAt')
  };
}

function assertApiSuccess(ref: string, result: Pick<OpenApiRunnerResult, 'ok' | 'exitCode' | 'stderr'>) {
  if (!result.ok) throw new Error(`${ref} 调用失败: ${result.stderr.trim() || `aliyun-cli exited with code ${result.exitCode}`}`);
}

interface KubernetesCredentialsContext {
  kubectl: string;
  cluster: KubernetesClusterSummary;
  regionId: string;
  kubeconfigExpiration: string | null;
  kubeconfigPath: string;
}

async function withTemporaryKubeconfig<T>(
  identity: string,
  options: KubernetesQueryOptions & { privateIpAddress?: boolean } = {},
  dependencies: KubernetesProviderDependencies,
  callback: (context: KubernetesCredentialsContext) => Promise<T>
) {
  const findExecutable = dependencies.findExecutable || findExecutableOnPath;
  const kubectl = await findExecutable(process.platform === 'win32' ? 'kubectl.exe' : 'kubectl');
  if (!kubectl) throw new Error('未找到 kubectl；请先安装 kubectl 并确保它在 PATH 中');

  const auth = options.auth || Config.requireAuth();
  const regionId = options.regionId || auth.region;
  const clusterList = await listKubernetesClusters({ regionId, auth }, dependencies);
  const cluster = resolveCluster(clusterList.clusters, identity);
  const executeApi = dependencies.executeApi || executeAlicloudApi;
  const kubeconfigResult = await executeApi('cs.DescribeClusterUserKubeconfig', {
    ClusterId: cluster.clusterId,
    PrivateIpAddress: options.privateIpAddress ?? false,
    TemporaryDurationMinutes: 15
  }, {
    auth,
    region: cluster.regionId || regionId,
    exposeSensitiveResponse: true
  });
  assertApiSuccess('cs.DescribeClusterUserKubeconfig', kubeconfigResult);
  const kubeconfigResponse = record(kubeconfigResult.response);
  const config = kubeconfigResponse && stringField(kubeconfigResponse, 'config');
  if (!config) throw new Error('DescribeClusterUserKubeconfig 未返回可用的 KubeConfig');

  const tempDirectory = await mkdtemp(join(dependencies.tempRoot || tmpdir(), 'licell-k8s-'));
  const kubeconfigPath = join(tempDirectory, 'config');
  try {
    await writeFile(kubeconfigPath, config, { mode: 0o600 });
    return await callback({
      kubectl,
      cluster,
      regionId,
      kubeconfigExpiration: stringField(kubeconfigResponse, 'expiration') || null,
      kubeconfigPath
    });
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
}

export async function listKubernetesClusters(
  options: KubernetesQueryOptions = {},
  dependencies: KubernetesProviderDependencies = {}
) {
  const auth = options.auth || Config.requireAuth();
  const regionId = options.regionId || auth.region;
  const executeApi = dependencies.executeApi || executeAlicloudApi;
  const result = await executeApi(
    'cs.DescribeClusters',
    options.name ? { name: options.name } : {},
    { auth, region: regionId }
  );
  assertApiSuccess('cs.DescribeClusters', result);
  const normalizedName = options.name?.trim().toLowerCase();
  const clusters = clusterRecords(result.response)
    .map(normalizeCluster)
    .filter((cluster): cluster is KubernetesClusterSummary => Boolean(cluster))
    .filter((cluster) => !cluster.regionId || cluster.regionId === regionId)
    .filter((cluster) => !normalizedName || cluster.name.toLowerCase().includes(normalizedName))
    .sort((left, right) => left.name.localeCompare(right.name));
  return {
    source: 'alicloud:cs.DescribeClusters',
    regionId,
    count: clusters.length,
    clusters
  };
}

function defaultSpawnKubectl(command: string, args: string[]) {
  return new Promise<Awaited<ReturnType<SpawnKubectl>>>((resolvePromise, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk: Buffer | string) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk: Buffer | string) => { stderr += chunk.toString(); });
    child.on('error', reject);
    child.on('close', (exitCode, signal) => resolvePromise({ exitCode: exitCode ?? 1, signal, stdout, stderr }));
  });
}

function numericField(value: Record<string, unknown> | undefined, key: string, fallback = 0) {
  const item = value?.[key];
  return typeof item === 'number' && Number.isFinite(item) ? item : fallback;
}

function images(value: Record<string, unknown>) {
  const spec = record(value.spec);
  const template = record(spec?.template);
  const podSpec = record(template?.spec);
  const containers = Array.isArray(podSpec?.containers) ? podSpec.containers : [];
  return [...new Set(containers.map(record).filter(Boolean).map((container) => stringField(container!, 'image')).filter(Boolean))];
}

function normalizeWorkloads(stdout: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    throw new Error('kubectl 未返回有效 JSON');
  }
  const items = Array.isArray(record(parsed)?.items) ? record(parsed)!.items as unknown[] : [];
  const workloads = {
    deployments: [] as Record<string, unknown>[],
    statefulSets: [] as Record<string, unknown>[],
    daemonSets: [] as Record<string, unknown>[],
    services: [] as Record<string, unknown>[]
  };
  for (const item of items.map(record).filter(Boolean) as Record<string, unknown>[]) {
    const kind = stringField(item, 'kind')?.toLowerCase();
    const metadata = record(item.metadata);
    const spec = record(item.spec);
    const status = record(item.status);
    const base = {
      namespace: stringField(metadata || {}, 'namespace') || 'default',
      name: stringField(metadata || {}, 'name') || ''
    };
    if (kind === 'deployment') {
      workloads.deployments.push({
        ...base,
        desired: numericField(spec, 'replicas'),
        ready: numericField(status, 'readyReplicas'),
        available: numericField(status, 'availableReplicas'),
        images: images(item)
      });
    } else if (kind === 'statefulset') {
      workloads.statefulSets.push({
        ...base,
        desired: numericField(spec, 'replicas'),
        ready: numericField(status, 'readyReplicas'),
        images: images(item)
      });
    } else if (kind === 'daemonset') {
      workloads.daemonSets.push({
        ...base,
        desired: numericField(status, 'desiredNumberScheduled'),
        ready: numericField(status, 'numberReady'),
        available: numericField(status, 'numberAvailable'),
        images: images(item)
      });
    } else if (kind === 'service') {
      workloads.services.push({
        ...base,
        type: stringField(spec || {}, 'type'),
        clusterIP: stringField(spec || {}, 'clusterIP'),
        externalIPs: Array.isArray(spec?.externalIPs) ? spec.externalIPs : [],
        ports: Array.isArray(spec?.ports) ? spec.ports : []
      });
    }
  }
  return workloads;
}

function resolveCluster(clusters: KubernetesClusterSummary[], identity: string) {
  const normalized = identity.trim().toLowerCase();
  const exact = clusters.filter((cluster) => (
    cluster.clusterId.toLowerCase() === normalized || cluster.name.toLowerCase() === normalized
  ));
  if (exact.length === 1) return exact[0]!;
  const partial = clusters.filter((cluster) => (
    cluster.clusterId.toLowerCase().startsWith(normalized) || cluster.name.toLowerCase().includes(normalized)
  ));
  if (partial.length === 1) return partial[0]!;
  if (exact.length + partial.length === 0) throw new Error(`未找到 Kubernetes 集群: ${identity}`);
  throw new Error(`集群标识不唯一: ${identity}；请改用完整集群 ID`);
}

export async function inspectKubernetesWorkloads(
  identity: string,
  options: KubernetesQueryOptions & { privateIpAddress?: boolean; requestTimeout?: string } = {},
  dependencies: KubernetesProviderDependencies = {}
) {
  return withTemporaryKubeconfig(identity, options, dependencies, async ({ kubectl, cluster, regionId, kubeconfigExpiration, kubeconfigPath }) => {
    const args = [
      '--kubeconfig', kubeconfigPath,
      `--request-timeout=${options.requestTimeout || '30s'}`,
      'get',
      'deployments.apps,statefulsets.apps,daemonsets.apps,services',
      '--all-namespaces',
      '--output', 'json'
    ];
    const processResult = await (dependencies.spawnKubectl || defaultSpawnKubectl)(kubectl, args);
    if (processResult.exitCode !== 0) {
      if (/\bforbidden\b/i.test(processResult.stderr)) {
        throw new KubernetesRbacForbiddenError(cluster, processResult.stderr);
      }
      throw new Error(`kubectl 查询失败: ${processResult.stderr.trim() || `exited with code ${processResult.exitCode}`}`);
    }
    const workloads = normalizeWorkloads(processResult.stdout);
    return {
      source: 'kubernetes-api',
      regionId,
      cluster,
      kubeconfigExpiration,
      counts: {
        deployments: workloads.deployments.length,
        statefulSets: workloads.statefulSets.length,
        daemonSets: workloads.daemonSets.length,
        services: workloads.services.length
      },
      workloads
    };
  });
}

function normalizeLogsTarget(value: string) {
  const target = value.trim();
  if (!target || target.includes('..') || !/^(?:(?:pod|deployment|statefulset|daemonset)\/)?[a-z0-9][a-z0-9_.-]*$/i.test(target)) {
    throw new Error(`Kubernetes 日志 target 无效: ${value}；请使用 name 或 deployment/name、pod/name`);
  }
  return target.includes('/') ? target : `deployment/${target}`;
}

function redactKubernetesLogs(value: string, auth: AuthConfig) {
  return String([auth.ak, auth.sk].filter(Boolean).reduce((text, secret) => text.split(secret).join('[REDACTED]'), value));
}

export async function inspectKubernetesLogs(
  identity: string,
  targetInput: string,
  options: KubernetesLogsOptions = {},
  dependencies: KubernetesProviderDependencies = {}
) {
  const auth = options.auth || Config.requireAuth();
  const target = normalizeLogsTarget(targetInput);
  const tail = options.tail ?? 100;
  if (!Number.isInteger(tail) || tail < 1 || tail > 10_000) {
    throw new Error('--tail 必须是 1 到 10000 之间的整数');
  }
  const namespace = options.namespace?.trim();
  if (options.namespace !== undefined && !namespace) throw new Error('--namespace 不能为空');

  return withTemporaryKubeconfig(identity, options, dependencies, async ({ kubectl, cluster, regionId, kubeconfigExpiration, kubeconfigPath }) => {
    const args = [
      '--kubeconfig', kubeconfigPath,
      `--request-timeout=${options.requestTimeout || '30s'}`,
      'logs', target,
      '--tail', String(tail)
    ];
    if (namespace) args.push('--namespace', namespace);
    if (options.container?.trim()) args.push('--container', options.container.trim());
    if (options.since?.trim()) args.push('--since', options.since.trim());
    if (options.previous) args.push('--previous');
    if (options.timestamps) args.push('--timestamps');

    const processResult = await (dependencies.spawnKubectl || defaultSpawnKubectl)(kubectl, args);
    if (processResult.exitCode !== 0) {
      if (/\bforbidden\b/i.test(processResult.stderr)) {
        throw new KubernetesRbacForbiddenError(cluster, processResult.stderr);
      }
      throw new Error(`kubectl 日志查询失败: ${processResult.stderr.trim() || `exited with code ${processResult.exitCode}`}`);
    }
    const logs = redactKubernetesLogs(processResult.stdout, auth);
    return {
      source: 'kubernetes-api',
      regionId,
      cluster,
      kubeconfigExpiration,
      target,
      namespace: namespace || null,
      container: options.container?.trim() || null,
      tail,
      lineCount: logs ? logs.split(/\r?\n/).filter(Boolean).length : 0,
      logs
    };
  });
}
