import { spawnSync } from 'child_process';

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
  const result = spawnSync('docker', ['login', '--username', userName, '--password-stdin', endpoint], {
    input: password,
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 30_000
  });
  if (result.status !== 0) {
    const stderr = result.stderr?.toString().trim() || '';
    throw new Error(`Docker 登录 ACR 失败: ${stderr || '未知错误'}`);
  }
}

export function dockerPush(imageTag: string) {
  const result = spawnSync('docker', ['push', imageTag], {
    stdio: 'inherit',
    timeout: 600_000
  });
  if (result.status !== 0) {
    throw new Error(`Docker 推送失败 (exit=${result.status})，请检查网络连接和镜像仓库权限`);
  }
}
