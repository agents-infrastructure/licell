import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export interface DockerfileDetector {
  name: string;
  detect(projectRoot: string): boolean;
  generate(projectRoot: string, entryFile?: string): string;
}

const detectors: DockerfileDetector[] = [];

function registerDetector(d: DockerfileDetector) {
  detectors.push(d);
}

export function detectProjectType(projectRoot: string): DockerfileDetector | null {
  for (const d of detectors) {
    if (d.detect(projectRoot)) return d;
  }
  return null;
}

export function generateDockerfile(projectRoot: string, entryFile?: string): string {
  const detector = detectProjectType(projectRoot);
  if (!detector) {
    throw new Error('无法自动探测项目类型，请手动创建 Dockerfile');
  }
  return detector.generate(projectRoot, entryFile);
}

function readJsonFile(filePath: string): Record<string, unknown> | null {
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

registerDetector({
  name: 'nodejs',
  detect(projectRoot) {
    return existsSync(join(projectRoot, 'package.json'));
  },
  generate(projectRoot, entryFile) {
    const hasBunLockBinary = existsSync(join(projectRoot, 'bun.lockb'));
    const hasBunLockText = existsSync(join(projectRoot, 'bun.lock'));
    const hasPnpmLock = existsSync(join(projectRoot, 'pnpm-lock.yaml'));
    const hasYarnLock = existsSync(join(projectRoot, 'yarn.lock'));
    const hasNpmLock = existsSync(join(projectRoot, 'package-lock.json')) || existsSync(join(projectRoot, 'npm-shrinkwrap.json'));
    const pkg = readJsonFile(join(projectRoot, 'package.json'));
    const hasTs = existsSync(join(projectRoot, 'tsconfig.json'));
    const scripts = (pkg?.scripts ?? {}) as Record<string, string>;
    const hasBuildScript = 'build' in scripts;
    const entry = entryFile || (hasTs ? 'dist/index.js' : 'src/index.js');

    if (!entryFile && hasTs && !hasBuildScript) {
      throw new Error(
        '检测到 tsconfig.json 但缺少 build 脚本，无法自动推断容器启动入口。\n' +
        '请在 package.json 中添加 build 脚本，或通过 --entry 指定可运行的 JS 入口，或手动维护 Dockerfile。'
      );
    }

    if (hasBunLockBinary || hasBunLockText) {
      const bunLockFile = hasBunLockBinary ? 'bun.lockb' : 'bun.lock';
      const lines = [
        'FROM oven/bun:1-slim',
        'WORKDIR /app',
        `COPY package.json ${bunLockFile} ./`,
        'RUN bun install --frozen-lockfile',
        'COPY . .',
      ];
      if (hasBuildScript) lines.push('RUN bun run build');
      lines.push(
        'ENV PORT=9000',
        'EXPOSE 9000',
        `CMD ["bun", "run", "${entry}"]`,
        ''
      );
      return lines.join('\n');
    }

    let installCmd = hasNpmLock ? 'npm ci' : 'npm install';
    let copyLock = 'COPY package*.json ./';
    if (hasPnpmLock) {
      installCmd = 'corepack enable && pnpm install --frozen-lockfile';
      copyLock = 'COPY package.json pnpm-lock.yaml ./';
    } else if (hasYarnLock) {
      installCmd = 'corepack enable && yarn install --frozen-lockfile';
      copyLock = 'COPY package.json yarn.lock ./';
    }

    const lines = [
      'FROM node:22-slim',
      'WORKDIR /app',
      copyLock,
      `RUN ${installCmd}`,
      'COPY . .',
    ];
    if (hasBuildScript) lines.push('RUN npm run build');
    lines.push(
      'ENV PORT=9000',
      'EXPOSE 9000',
      `CMD ["node", "${entry}"]`,
      ''
    );
    return lines.join('\n');
  }
});

registerDetector({
  name: 'python',
  detect(projectRoot) {
    return existsSync(join(projectRoot, 'requirements.txt')) || existsSync(join(projectRoot, 'pyproject.toml'));
  },
  generate(projectRoot, entryFile) {
    const entry = entryFile || 'src/main.py';
    const hasRequirements = existsSync(join(projectRoot, 'requirements.txt'));
    const hasPyproject = existsSync(join(projectRoot, 'pyproject.toml'));

    const lines = ['FROM python:3.13-slim', 'WORKDIR /app'];

    if (hasRequirements) {
      lines.push('COPY requirements.txt ./', 'RUN pip install --no-cache-dir -r requirements.txt', 'COPY . .');
    } else if (hasPyproject) {
      lines.push('COPY . .', 'RUN pip install --no-cache-dir .');
    } else {
      lines.push('COPY . .');
    }

    lines.push(
      'ENV PORT=9000',
      'EXPOSE 9000',
      `CMD ["python", "${entry}"]`,
      ''
    );
    return lines.join('\n');
  }
});
