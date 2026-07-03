import { beforeEach, describe, expect, it, vi } from 'vitest';

const { listEcsInstancesMock } = vi.hoisted(() => ({
  listEcsInstancesMock: vi.fn()
}));

vi.mock('../providers/ecs', () => ({
  listEcsInstances: listEcsInstancesMock
}));

import {
  runCapabilityProbe,
  resolveDoctorCapabilityPlan,
  resolveDoctorDeployTargetPlan,
  summarizeDoctorCapabilityProbes,
  type DoctorCloudCapabilityProbe
} from '../providers/doctor-cloud';

const auth = {
  accountId: '1494910986361453',
  ak: 'demo-ak',
  sk: 'demo-sk',
  region: 'cn-hangzhou'
};

beforeEach(() => {
  listEcsInstancesMock.mockReset();
});

describe('resolveDoctorCapabilityPlan', () => {
  it('marks fc/cr/vpc as required for docker api projects with network config', () => {
    const plan = resolveDoctorCapabilityPlan({
      project: {
        appName: 'demo',
        runtime: 'docker',
        envs: {},
        network: {
          vpcId: 'vpc-123',
          vswId: 'vsw-123'
        }
      },
      deployTypeHint: 'api',
      runtime: 'docker'
    });

    expect(plan.required).toEqual(expect.arrayContaining(['fc', 'cr', 'vpc']));
    expect(plan.optional).not.toEqual(expect.arrayContaining(['fc', 'cr', 'vpc']));
  });

  it('marks oss as required for static projects', () => {
    const plan = resolveDoctorCapabilityPlan({
      project: {
        appName: 'demo-static',
        runtime: 'static',
        envs: {}
      },
      deployTypeHint: 'static',
      runtime: null
    });

    expect(plan.required).toEqual(['oss']);
  });

  it('keeps ecs optional for current doctor plan branches', () => {
    const cases: Parameters<typeof resolveDoctorCapabilityPlan>[0][] = [
      {
        project: {
          appName: 'demo',
          runtime: 'docker',
          envs: {},
          network: {
            vpcId: 'vpc-123',
            vswId: 'vsw-123'
          }
        },
        deployTypeHint: 'api',
        runtime: 'docker'
      },
      {
        project: {
          appName: 'demo-static',
          runtime: 'static',
          envs: {}
        },
        deployTypeHint: 'static',
        runtime: null
      },
      {
        project: {
          appName: 'demo-task',
          runtime: 'nodejs22',
          envs: {}
        },
        deployTypeHint: 'task',
        runtime: 'nodejs22'
      },
      {
        project: null,
        deployTypeHint: undefined,
        runtime: null
      }
    ];

    for (const input of cases) {
      const plan = resolveDoctorCapabilityPlan(input);
      expect(plan.optional).toContain('ecs');
      expect(plan.required).not.toContain('ecs');
    }
  });
});

describe('runCapabilityProbe', () => {
  it('probes ECS through the read-only provider', async () => {
    listEcsInstancesMock.mockResolvedValue({ instances: [], truncated: false });

    const probe = await runCapabilityProbe(auth, 'ecs', false);

    expect(listEcsInstancesMock).toHaveBeenCalledWith({ limit: 1 });
    expect(probe).toMatchObject({
      capability: 'ecs',
      label: 'ECS',
      required: false,
      status: 'ok',
      summary: 'ECS 读权限与 region endpoint 可用。'
    });
  });

  it('classifies optional ECS AccessDenied as warn with auth repair guidance', async () => {
    const err = new Error('forbidden');
    (err as unknown as { code: string }).code = 'AccessDenied';
    listEcsInstancesMock.mockRejectedValue(err);

    const probe = await runCapabilityProbe(auth, 'ecs', false);
    const summary = summarizeDoctorCapabilityProbes([probe], {
      required: [],
      optional: ['ecs']
    });

    expect(probe.status).toBe('warn');
    expect(probe.summary).toBe('ECS 读权限不足。');
    expect(summary.status).toBe('warn');
    expect(summary.data.required).not.toContain('ecs');
    expect(summary.nextActions?.[0]).toMatchObject({
      commandTemplate: 'licell auth repair',
      commandKey: 'auth repair',
      phase: 'mutate',
      priority: 'primary',
      source: 'doctor-next-command'
    });
  });
});

describe('summarizeDoctorCapabilityProbes', () => {
  it('returns error when required capabilities fail', () => {
    const probes: DoctorCloudCapabilityProbe[] = [
      {
        capability: 'fc',
        label: '函数计算',
        required: true,
        status: 'error',
        summary: 'FC 读权限不足。',
        details: []
      },
      {
        capability: 'dns',
        label: '云解析 DNS',
        required: false,
        status: 'warn',
        summary: 'DNS 在当前 region 未开通。',
        details: []
      }
    ];

    const summary = summarizeDoctorCapabilityProbes(probes, {
      required: ['fc'],
      optional: ['dns']
    });

    expect(summary.status).toBe('error');
    expect(summary.summary).toContain('直接相关');
    expect(summary.nextActions).toEqual([
      expect.objectContaining({
        commandTemplate: 'licell auth repair',
        commandKey: 'auth repair',
        phase: 'mutate',
        priority: 'primary',
        source: 'doctor-next-command'
      }),
      expect.objectContaining({
        commandTemplate: 'licell switch --region <region>',
        commandKey: 'switch',
        phase: 'mutate',
        priority: 'secondary',
        source: 'doctor-next-command'
      })
    ]);
  });

  it('returns warn when only optional capabilities have issues', () => {
    const probes: DoctorCloudCapabilityProbe[] = [
      {
        capability: 'fc',
        label: '函数计算',
        required: true,
        status: 'ok',
        summary: 'FC ok',
        details: []
      },
      {
        capability: 'dns',
        label: '云解析 DNS',
        required: false,
        status: 'warn',
        summary: 'DNS warn',
        details: []
      }
    ];

    const summary = summarizeDoctorCapabilityProbes(probes, {
      required: ['fc'],
      optional: ['dns']
    });

    expect(summary.status).toBe('warn');
    expect(summary.summary).toContain('optional issue');
    expect(summary.nextActions?.[0]).toMatchObject({
      commandTemplate: 'licell auth repair',
      commandKey: 'auth repair',
      phase: 'mutate',
      priority: 'primary',
      source: 'doctor-next-command'
    });
  });
});

describe('resolveDoctorDeployTargetPlan', () => {
  it('returns api mode when runtime implies api deploy', () => {
    const plan = resolveDoctorDeployTargetPlan({
      project: {
        appName: 'demo-api',
        runtime: 'nodejs22',
        envs: {}
      },
      deployTypeHint: 'api',
      runtime: 'nodejs22'
    });

    expect(plan).toEqual({ mode: 'api', reason: 'api' });
  });

  it('returns static mode when runtime implies static deploy', () => {
    const plan = resolveDoctorDeployTargetPlan({
      project: {
        appName: 'demo-static',
        runtime: 'static',
        envs: {}
      },
      deployTypeHint: 'static',
      runtime: null
    });

    expect(plan).toEqual({ mode: 'static', reason: 'static' });
  });

  it('skips when deploy type cannot be inferred', () => {
    const plan = resolveDoctorDeployTargetPlan({
      project: {
        appName: 'demo',
        envs: {}
      },
      deployTypeHint: undefined,
      runtime: null
    });

    expect(plan).toEqual({ mode: 'skip', reason: 'unknown_deploy_type' });
  });
});
