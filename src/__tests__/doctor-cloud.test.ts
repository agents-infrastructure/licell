import { describe, expect, it } from 'vitest';
import {
  resolveDoctorCapabilityPlan,
  resolveDoctorDeployTargetPlan,
  summarizeDoctorCapabilityProbes,
  type DoctorCloudCapabilityProbe
} from '../providers/doctor-cloud';

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
