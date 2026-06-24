import { spawnSync } from 'child_process';

const DOCKER_RETRY_ATTEMPTS = 3;
const DOCKER_RETRY_BASE_DELAY_MS = 1000;

function sleepSync(ms: number) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

let sleepSyncForRetry = sleepSync;

export function setDockerRetrySleepForTest(fn: ((ms: number) => void) | null) {
  sleepSyncForRetry = fn || sleepSync;
}

export function checkDockerAvailable() {
  const result = spawnSync('docker', ['info'], { stdio: 'pipe', timeout: 10_000 });
  if (result.status !== 0) {
    throw new Error(
      '未检测到 Docker 环境。请安装 Docker Desktop 或 Docker Engine 后重试。\n' +
      '  macOS: https://docs.docker.com/desktop/install/mac-install/\n' +
      '  Linux: https://docs.docker.com/engine/install/'
    );
  }
}

export function dockerBuild(imageTag: string, contextDir: string, dockerfilePath?: string) {
  const args = ['build', '--platform', 'linux/amd64'];
  if (dockerfilePath) args.push('-f', dockerfilePath);
  args.push('-t', imageTag, contextDir);

  const result = spawnSync('docker', args, {
    stdio: 'inherit',
    timeout: 600_000
  });
  if (result.status !== 0) {
    throw new Error(`Docker 构建失败 (exit=${result.status})，请检查 Dockerfile 和构建日志`);
  }
}

export function dockerLogin(endpoint: string, userName: string, password: string) {
  let lastStderr = '';
  for (let attempt = 1; attempt <= DOCKER_RETRY_ATTEMPTS; attempt += 1) {
    const result = spawnSync('docker', ['login', '--username', userName, '--password-stdin', endpoint], {
      input: password,
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 30_000
    });
    if (result.status === 0) return;
    lastStderr = result.stderr?.toString().trim() || '';
    if (attempt < DOCKER_RETRY_ATTEMPTS) {
      sleepSyncForRetry(DOCKER_RETRY_BASE_DELAY_MS * attempt);
    }
  }
  throw new Error(`Docker 登录 ACR 失败: ${lastStderr || '未知错误'}`);
}

export function dockerPush(imageTag: string) {
  let lastStatus: number | null = null;
  for (let attempt = 1; attempt <= DOCKER_RETRY_ATTEMPTS; attempt += 1) {
    const result = spawnSync('docker', ['push', imageTag], {
      stdio: 'inherit',
      timeout: 600_000
    });
    if (result.status === 0) return;
    lastStatus = result.status;
    if (attempt < DOCKER_RETRY_ATTEMPTS) {
      sleepSyncForRetry(DOCKER_RETRY_BASE_DELAY_MS * attempt);
    }
  }
  throw new Error(`Docker 推送失败 (exit=${lastStatus})，请检查网络连接和镜像仓库权限`);
}
