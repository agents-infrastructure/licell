import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { tmpdir } from 'os';
import { runLicellDoctor } from '../utils/doctor';

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

function getCheck(report: Awaited<ReturnType<typeof runLicellDoctor>>, id: string) {
  const check = report.checks.find((item) => item.id === id);
  if (!check) throw new Error(`missing check: ${id}`);
  return check;
}

describe('runLicellDoctor', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reports healthy auth + project + fc precheck flow', async () => {
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

      expect(report.healthy).toBe(true);
      expect(getCheck(report, 'auth.credentials').status).toBe('ok');
      expect(getCheck(report, 'project.config').status).toBe('ok');
      expect(getCheck(report, 'project.app').status).toBe('ok');
      expect(getCheck(report, 'deploy.runtime').status).toBe('ok');
      expect(getCheck(report, 'deploy.precheck').status).toBe('ok');
      expect(getCheck(report, 'domain.consistency').status).toBe('skip');
      expect(getCheck(report, 'deploy.target').status).toBe('skip');
      expect(report.errorCount).toBe(0);
    } finally {
      rmSync(home, { recursive: true, force: true });
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('flags missing auth as blocking', async () => {
    const home = createTempDir('licell-doctor-home-');
    const root = createTempDir('licell-doctor-project-');
    vi.stubEnv('HOME', home);

    try {
      writeJson(join(root, '.licell', 'project.json'), {
        appName: 'doctor-demo',
        runtime: 'nodejs22',
        envs: {}
      });
      writeText(join(root, 'src', 'index.ts'), 'export default async function app() { return { statusCode: 200, body: "ok" }; }\n');

      const report = await runLicellDoctor({ cwd: root, offline: true });

      expect(report.healthy).toBe(false);
      const authCheck = getCheck(report, 'auth.credentials');
      expect(authCheck.status).toBe('error');
      expect(authCheck.remediation[0]).toMatchObject({
        type: 'note',
        text: '先执行 login，或通过团队分发的 restore token 执行 auth restore。'
      });
      expect(authCheck.nextCommands).toEqual([
        expect.objectContaining({
          commandTemplate: 'licell login',
          commandKey: 'login',
          intent: 'login',
          priority: 'primary'
        }),
        expect.objectContaining({
          commandTemplate: 'licell auth restore <token> [passkey]',
          commandKey: 'auth restore',
          intent: 'restore',
          priority: 'secondary'
        })
      ]);
      expect(getCheck(report, 'domain.consistency').status).toBe('skip');
      expect(getCheck(report, 'deploy.target').status).toBe('skip');
      expect(report.errorCount).toBeGreaterThan(0);
    } finally {
      rmSync(home, { recursive: true, force: true });
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('skips fc precheck for static runtime projects', async () => {
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
        appName: 'doctor-static',
        runtime: 'static',
        envs: {}
      });

      const report = await runLicellDoctor({ cwd: root, offline: true });

      expect(report.healthy).toBe(true);
      expect(getCheck(report, 'deploy.runtime').status).toBe('skip');
      expect(getCheck(report, 'deploy.precheck').status).toBe('skip');
      expect(getCheck(report, 'domain.consistency').status).toBe('skip');
      expect(getCheck(report, 'deploy.target').status).toBe('skip');
      expect(getCheck(report, 'cloud.offline').status).toBe('skip');
    } finally {
      rmSync(home, { recursive: true, force: true });
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('normalizes deploy precheck guidance into structured remediation and next commands', async () => {
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

      const report = await runLicellDoctor({ cwd: root, offline: true });
      const precheck = getCheck(report, 'deploy.precheck');

      expect(precheck.status).toBe('error');
      expect(precheck.remediation.some((item) => item.type === 'note')).toBe(true);
      expect(precheck.nextCommands).toEqual([
        expect.objectContaining({
          commandTemplate: 'licell deploy spec nodejs22',
          commandKey: 'deploy spec',
          intent: 'inspect',
          priority: 'primary'
        }),
        expect.objectContaining({
          commandTemplate: 'licell deploy check --runtime nodejs22 --entry src/index.ts',
          commandKey: 'deploy check',
          intent: 'verify',
          priority: 'secondary'
        })
      ]);
    } finally {
      rmSync(home, { recursive: true, force: true });
      rmSync(root, { recursive: true, force: true });
    }
  });
});
