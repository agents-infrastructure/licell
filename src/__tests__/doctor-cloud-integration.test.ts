import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { tmpdir } from 'os';
import { doctorRemediationCommand } from '../utils/doctor-guidance';

const { runDoctorCloudDiagnosticsMock } = vi.hoisted(() => ({
  runDoctorCloudDiagnosticsMock: vi.fn()
}));

vi.mock('../providers/doctor-cloud', () => ({
  runDoctorCloudDiagnostics: runDoctorCloudDiagnosticsMock
}));

function createTempDir(prefix: string) {
  return mkdtempSync(join(tmpdir(), prefix));
}

function writeJson(filePath: string, data: unknown) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function writeText(filePath: string, content: string) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, 'utf8');
}

describe('runLicellDoctor cloud integration', () => {
  beforeEach(() => {
    runDoctorCloudDiagnosticsMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('merges cloud diagnostics into checks and health status', async () => {
    const { runLicellDoctor } = await import('../utils/doctor');
    const home = createTempDir('licell-doctor-home-');
    const root = createTempDir('licell-doctor-project-');
    vi.stubEnv('HOME', home);
    runDoctorCloudDiagnosticsMock.mockResolvedValue({
      identity: { status: 'ok', summary: 'identity ok', details: [], remediation: [] },
      ramProfile: { status: 'warn', summary: 'ram warn', details: [], remediation: [doctorRemediationCommand('licell auth repair')] },
      domainConsistency: { status: 'warn', summary: 'domain warn', details: ['dns pending'], remediation: [doctorRemediationCommand('licell domain app bind api.example.com')] },
      deployTarget: { status: 'warn', summary: 'target warn', details: ['alias missing'], remediation: [doctorRemediationCommand('licell release promote --target prod')] },
      capabilities: {
        status: 'error',
        summary: 'capabilities blocked',
        details: ['fc blocked'],
        remediation: [doctorRemediationCommand('licell auth repair')],
        data: {
          required: ['fc'],
          optional: ['dns'],
          probes: []
        }
      }
    });

    try {
      writeJson(join(home, '.licell-cli', 'auth.json'), {
        accountId: '1494910986361453',
        ak: 'demo-ak',
        sk: 'demo-sk',
        region: 'cn-hangzhou'
      });
      writeJson(join(root, '.licell', 'project.json'), {
        appName: 'doctor-demo',
        runtime: 'nodejs22',
        envs: {}
      });
      writeText(join(root, 'src', 'index.ts'), 'export default async function app() { return { statusCode: 200, body: "ok" }; }\n');

      const report = await runLicellDoctor({ cwd: root });

      expect(runDoctorCloudDiagnosticsMock).toHaveBeenCalledTimes(1);
      expect(report.healthy).toBe(false);
      expect(report.checks.find((check) => check.id === 'cloud.identity')?.status).toBe('ok');
      expect(report.checks.find((check) => check.id === 'cloud.ram')?.status).toBe('warn');
      expect(report.checks.find((check) => check.id === 'domain.consistency')?.status).toBe('warn');
      expect(report.checks.find((check) => check.id === 'deploy.target')?.status).toBe('warn');
      expect(report.checks.find((check) => check.id === 'cloud.capabilities')?.status).toBe('error');
      expect(report.checks.find((check) => check.id === 'domain.consistency')?.remediation).toEqual([
        expect.objectContaining({
          type: 'command',
          text: 'licell domain app bind api.example.com',
          commandTemplate: 'licell domain app bind api.example.com',
          commandKey: 'domain app bind',
          intent: 'bind'
        })
      ]);
      expect(report.checks.find((check) => check.id === 'cloud.capabilities')?.nextCommands).toEqual([
        expect.objectContaining({
          commandTemplate: 'licell auth repair',
          commandKey: 'auth repair',
          intent: 'repair',
          priority: 'primary'
        }),
        expect.objectContaining({
          commandTemplate: 'licell switch --region <region>',
          commandKey: 'switch',
          intent: 'configure',
          priority: 'secondary'
        })
      ]);
    } finally {
      rmSync(home, { recursive: true, force: true });
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('skips cloud diagnostics when offline mode is enabled', async () => {
    const { runLicellDoctor } = await import('../utils/doctor');
    const home = createTempDir('licell-doctor-home-');
    const root = createTempDir('licell-doctor-project-');
    vi.stubEnv('HOME', home);

    try {
      writeJson(join(home, '.licell-cli', 'auth.json'), {
        accountId: '1494910986361453',
        ak: 'demo-ak',
        sk: 'demo-sk',
        region: 'cn-hangzhou'
      });
      writeJson(join(root, '.licell', 'project.json'), {
        appName: 'doctor-demo',
        runtime: 'nodejs22',
        envs: {}
      });
      writeText(join(root, 'src', 'index.ts'), 'export default async function app() { return { statusCode: 200, body: "ok" }; }\n');

      const report = await runLicellDoctor({ cwd: root, offline: true });

      expect(runDoctorCloudDiagnosticsMock).not.toHaveBeenCalled();
      expect(report.checks.find((check) => check.id === 'domain.consistency')?.status).toBe('skip');
      expect(report.checks.find((check) => check.id === 'deploy.target')?.status).toBe('skip');
      expect(report.checks.find((check) => check.id === 'cloud.offline')?.status).toBe('skip');
    } finally {
      rmSync(home, { recursive: true, force: true });
      rmSync(root, { recursive: true, force: true });
    }
  });
});
