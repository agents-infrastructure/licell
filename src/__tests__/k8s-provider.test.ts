import { access, mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  inspectKubernetesLogs,
  inspectKubernetesWorkloads,
  KubernetesRbacForbiddenError,
  listKubernetesClusters
} from '../providers/k8s';

const auth = {
  accountId: 'account',
  ak: 'test-ak',
  sk: 'test-sk',
  region: 'cn-hangzhou'
};

describe('Kubernetes provider', () => {
  it('normalizes the CS cluster list and filters the requested region', async () => {
    const executeApi = vi.fn(async () => ({
      ok: true,
      exitCode: 0,
      signal: null,
      stdout: '',
      stderr: '',
      response: [
        { cluster_id: 'c-hz', name: 'feishu-connector-test-acs', region_id: 'cn-hangzhou', profile: 'Acs', state: 'running' },
        { cluster_id: 'c-bj', name: 'other', region_id: 'cn-beijing', profile: 'Default', state: 'running' }
      ],
      plan: {},
      maturity: 'raw' as const
    }));

    const result = await listKubernetesClusters({ regionId: 'cn-hangzhou', auth }, { executeApi });

    expect(result.count).toBe(1);
    expect(result.clusters[0]).toMatchObject({
      clusterId: 'c-hz',
      name: 'feishu-connector-test-acs',
      regionId: 'cn-hangzhou',
      profile: 'Acs'
    });
  });

  it('uses a 0600 temporary kubeconfig, summarizes workloads, and removes the credential', async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), 'licell-k8s-test-'));
    let kubeconfigPath = '';
    const executeApi = vi.fn(async (ref: string) => ({
      ok: true,
      exitCode: 0,
      signal: null,
      stdout: '',
      stderr: '',
      response: ref.endsWith('DescribeClusters')
        ? [{ cluster_id: 'c-hz', name: 'feishu-connector-test-acs', region_id: 'cn-hangzhou', profile: 'Acs', state: 'running' }]
        : { config: 'apiVersion: v1\nclusters: []\n', expiration: '2026-09-04T03:00:00Z' },
      plan: {},
      maturity: 'raw' as const
    }));
    const spawnKubectl = vi.fn(async (_command: string, args: string[]) => {
      kubeconfigPath = args[args.indexOf('--kubeconfig') + 1]!;
      const fileStat = await stat(kubeconfigPath);
      expect(fileStat.mode & 0o777).toBe(0o600);
      return {
        exitCode: 0,
        signal: null,
        stderr: '',
        stdout: JSON.stringify({
          items: [
            {
              kind: 'Deployment',
              metadata: { namespace: 'default', name: 'connector' },
              spec: { replicas: 2, template: { spec: { containers: [{ image: 'registry/connector:v1' }] } } },
              status: { readyReplicas: 2, availableReplicas: 2 }
            },
            {
              kind: 'Service',
              metadata: { namespace: 'default', name: 'connector' },
              spec: { type: 'ClusterIP', clusterIP: '10.0.0.1', ports: [{ port: 80, targetPort: 3000 }] }
            }
          ]
        })
      };
    });

    try {
      const result = await inspectKubernetesWorkloads('feishu-connector-test-acs', {
        regionId: 'cn-hangzhou',
        auth
      }, {
        executeApi,
        findExecutable: async () => '/usr/local/bin/kubectl',
        spawnKubectl,
        tempRoot
      });

      expect(result.cluster).toMatchObject({ clusterId: 'c-hz', name: 'feishu-connector-test-acs' });
      expect(result.counts).toEqual({ deployments: 1, statefulSets: 0, daemonSets: 0, services: 1 });
      expect(result.workloads.deployments[0]).toMatchObject({ name: 'connector', ready: 2, desired: 2 });
      expect(result.workloads.services[0]).toMatchObject({ name: 'connector', type: 'ClusterIP' });
      expect(executeApi).toHaveBeenLastCalledWith(
        'cs.DescribeClusterUserKubeconfig',
        { ClusterId: 'c-hz', PrivateIpAddress: false, TemporaryDurationMinutes: 15 },
        expect.objectContaining({ exposeSensitiveResponse: true })
      );
      await expect(access(kubeconfigPath)).rejects.toThrow();
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });

  it('distinguishes Kubernetes RBAC from Alibaba Cloud RAM permission failures', async () => {
    const executeApi = vi.fn(async (ref: string) => ({
      ok: true,
      exitCode: 0,
      stderr: '',
      response: ref.endsWith('DescribeClusters')
        ? [{ cluster_id: 'c-hz', name: 'acs-demo', region_id: 'cn-hangzhou' }]
        : { config: 'apiVersion: v1\n', expiration: '2026-09-04T03:00:00Z' }
    }));

    const request = inspectKubernetesWorkloads('acs-demo', { auth }, {
      executeApi,
      findExecutable: async () => '/usr/local/bin/kubectl',
      spawnKubectl: async () => ({
        exitCode: 1,
        signal: null,
        stdout: '',
        stderr: 'Error from server (Forbidden): User "204357771378946585" cannot list resource "services"'
      })
    });
    await expect(request).rejects.toBeInstanceOf(KubernetesRbacForbiddenError);
    await expect(request).rejects.toMatchObject({
      code: 'K8S_RBAC_FORBIDDEN',
      details: { clusterId: 'c-hz', userId: '204357771378946585' }
    });
  });

  it('reads bounded workload logs through a temporary kubeconfig and redacts credentials', async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), 'licell-k8s-logs-test-'));
    let kubeconfigPath = '';
    const executeApi = vi.fn(async (ref: string) => ({
      ok: true,
      exitCode: 0,
      signal: null,
      stdout: '',
      stderr: '',
      response: ref.endsWith('DescribeClusters')
        ? [{ cluster_id: 'c-hz', name: 'acs-demo', region_id: 'cn-hangzhou' }]
        : { config: 'apiVersion: v1\n', expiration: '2026-09-04T03:00:00Z' },
      plan: {},
      maturity: 'raw' as const
    }));
    const spawnKubectl = vi.fn(async (_command: string, args: string[]) => {
      kubeconfigPath = args[args.indexOf('--kubeconfig') + 1]!;
      expect(args).toEqual([
        '--kubeconfig', kubeconfigPath,
        '--request-timeout=10s',
        'logs', 'deployment/connector',
        '--tail', '25',
        '--namespace', 'default',
        '--container', 'app',
        '--since', '1h',
        '--timestamps'
      ]);
      return {
        exitCode: 0,
        signal: null,
        stderr: '',
        stdout: `2026-09-04T03:00:00Z ready ${auth.ak}\nsecond line\n`
      };
    });

    try {
      const result = await inspectKubernetesLogs('acs-demo', 'connector', {
        regionId: 'cn-hangzhou',
        auth,
        namespace: 'default',
        container: 'app',
        tail: 25,
        since: '1h',
        timestamps: true,
        requestTimeout: '10s'
      }, {
        executeApi,
        findExecutable: async () => '/usr/local/bin/kubectl',
        spawnKubectl,
        tempRoot
      });

      expect(result).toMatchObject({
        target: 'deployment/connector',
        namespace: 'default',
        tail: 25,
        lineCount: 2,
        logs: expect.stringContaining('[REDACTED]')
      });
      expect(String(result.logs)).not.toContain(auth.ak);
      await expect(access(kubeconfigPath)).rejects.toThrow();
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });
});
