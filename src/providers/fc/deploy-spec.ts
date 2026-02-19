import { existsSync, readFileSync, statSync } from 'fs';
import { isAbsolute, relative, resolve, join } from 'path';
import { getRuntime, getSupportedRuntimeNames } from './runtime-handler';
import { validateRuntimeEntrypoint } from './runtime-utils';
import { detectProjectType } from '../../utils/dockerfile';
import { checkDockerAvailable } from '../../utils/docker';

export const FC_DEFAULT_MEMORY_MB = 512;
export const FC_DEFAULT_VCPU = 0.5;
export const FC_DEFAULT_TIMEOUT_SECONDS = 30;
export const FC_DEFAULT_INSTANCE_CONCURRENCY = 10;
export const FC_MEMORY_VCPU_RATIO_MIN = 1;
export const FC_MEMORY_VCPU_RATIO_MAX = 4;

export interface FcApiRuntimeDeploySpec {
  runtime: string;
  mode: 'vendor' | 'custom-runtime' | 'custom-container';
  defaultEntry: string | null;
  entryRule: string;
  handlerRule: string;
  handlerContract: {
    kind: 'function' | 'container-http';
    entryFileExtensions: string[];
    requiredExports?: string[];
    oneOfExports?: string[][];
    signature?: string;
    asyncAllowed?: boolean;
    containerPortEnv?: string[];
  };
  eventSchema: {
    requiredFields: string[];
    optionalFields: string[];
    notes: string[];
  };
  responseSchema: {
    acceptedForms: string[];
    notes: string[];
  };
  examples: {
    minimalPassExample: string;
    commonFailExample: string;
    fixHint: string[];
  };
  validationRules: Array<{
    id: string;
    level: 'error' | 'warning';
    summary: string;
  }>;
  notes: string[];
}

export interface FcApiDeployResourceSpec {
  defaults: {
    memoryMb: number;
    vcpu: number;
    timeoutSeconds: number;
    instanceConcurrency: number;
  };
  constraints: {
    memoryToVcpuRatio: {
      min: number;
      max: number;
      expression: 'memoryGb / vcpu in [1, 4]';
    };
  };
}

export interface FcApiDeploySpecDocument {
  runtimes: FcApiRuntimeDeploySpec[];
  resources: FcApiDeployResourceSpec;
}

export interface FcApiDeployPrecheckIssue {
  id: string;
  level: 'error' | 'warning';
  message: string;
  remediation?: string[];
}

export interface FcApiDeployPrecheckResult {
  ok: boolean;
  runtime: string;
  entry: string;
  projectRoot: string;
  issues: FcApiDeployPrecheckIssue[];
}

export interface FcApiDeployPrecheckErrorDetails {
  runtime: string;
  entry: string;
  projectRoot: string;
  issues: FcApiDeployPrecheckIssue[];
}

const DEFAULT_ENTRY_BY_RUNTIME: Record<string, string> = {
  nodejs20: 'src/index.ts',
  nodejs22: 'src/index.ts',
  'python3.12': 'src/main.py',
  'python3.13': 'src/main.py'
};

function getDefaultEntry(runtime: string) {
  const byHandler = (() => {
    try {
      const runtimeHandler = getRuntime(runtime);
      return runtimeHandler.defaultEntry || '';
    } catch {
      return '';
    }
  })();
  if (byHandler) return byHandler;
  return DEFAULT_ENTRY_BY_RUNTIME[runtime] || '';
}

function toPosixPath(input: string) {
  return input.replace(/\\/g, '/');
}

function isPathInside(root: string, absPath: string) {
  const rel = relative(root, absPath);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

function readPackageScripts(projectRoot: string): Record<string, unknown> {
  const pkgPath = join(projectRoot, 'package.json');
  if (!existsSync(pkgPath)) return {};
  try {
    const raw = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { scripts?: Record<string, unknown> };
    return raw.scripts || {};
  } catch {
    return {};
  }
}

function checkNonDockerEntry(
  projectRoot: string,
  runtime: string,
  entry: string,
  issues: FcApiDeployPrecheckIssue[]
) {
  const absEntry = resolve(projectRoot, entry);
  if (!isPathInside(projectRoot, absEntry)) {
    issues.push({
      id: 'entry.outside_project',
      level: 'error',
      message: `入口文件必须在项目目录内: ${entry}`,
      remediation: ['将 --entry 指向当前项目目录内的文件，例如 src/index.ts 或 src/main.py']
    });
    return;
  }

  if (!existsSync(absEntry)) {
    issues.push({
      id: 'entry.not_found',
      level: 'error',
      message: `入口文件不存在: ${entry}`,
      remediation: ['确认路径正确，或创建对应入口文件后重试']
    });
    return;
  }

  if (!statSync(absEntry).isFile()) {
    issues.push({
      id: 'entry.not_file',
      level: 'error',
      message: `入口路径不是有效文件: ${entry}`,
      remediation: ['请将 --entry 指向具体文件']
    });
    return;
  }

  try {
    validateRuntimeEntrypoint(absEntry, runtime);
  } catch (err: unknown) {
    issues.push({
      id: 'entry.runtime_contract',
      level: 'error',
      message: err instanceof Error ? err.message : String(err),
      remediation: [
        '参考 `licell deploy spec <runtime>` 查看该 runtime 的入口与 handler 规则',
        '修复入口文件后再执行 `licell deploy`'
      ]
    });
  }

  if (runtime.startsWith('python')) {
    const hasDepsManifest = [
      'requirements.txt',
      'pyproject.toml',
      'poetry.lock',
      'pipfile',
      'pipfile.lock'
    ].some((file) => existsSync(join(projectRoot, file)));
    if (!hasDepsManifest) {
      issues.push({
        id: 'python.dependencies_manifest_missing',
        level: 'warning',
        message: '未检测到 Python 依赖清单（requirements.txt/pyproject.toml），部署时将无法自动安装第三方依赖。',
        remediation: ['建议添加 requirements.txt 或 pyproject.toml 并声明依赖']
      });
    }
  }
}

function checkDockerEntry(
  projectRoot: string,
  entry: string,
  checkDockerDaemon: boolean,
  issues: FcApiDeployPrecheckIssue[]
) {
  const dockerfilePath = join(projectRoot, 'Dockerfile');
  const hasDockerfile = existsSync(dockerfilePath);
  const detector = hasDockerfile ? null : detectProjectType(projectRoot);

  if (!hasDockerfile && !detector) {
    issues.push({
      id: 'docker.project_type_undetected',
      level: 'error',
      message: '未找到 Dockerfile，且无法自动探测项目类型。',
      remediation: [
        '在项目根目录创建 Dockerfile，或补充 package.json / requirements.txt',
        '然后重新执行部署'
      ]
    });
  }

  if (!hasDockerfile && detector?.name === 'nodejs') {
    const hasTsConfig = existsSync(join(projectRoot, 'tsconfig.json'));
    const scripts = readPackageScripts(projectRoot);
    const hasBuildScript = typeof scripts.build === 'string' && scripts.build.trim().length > 0;
    if (hasTsConfig && !entry && !hasBuildScript) {
      issues.push({
        id: 'docker.node_ts_no_build_script',
        level: 'error',
        message: '检测到 TypeScript 项目，但 package.json 缺少 build 脚本，无法自动推断容器入口。',
        remediation: [
          '补充 package.json scripts.build（例如 tsc）',
          '或使用 --entry 显式指定容器运行入口（例如 dist/index.js）',
          '或手动维护 Dockerfile'
        ]
      });
    }
  }

  if (entry) {
    const absEntry = resolve(projectRoot, entry);
    if (!isPathInside(projectRoot, absEntry)) {
      issues.push({
        id: 'docker.entry.outside_project',
        level: 'error',
        message: `Docker 入口必须在项目目录内: ${entry}`,
        remediation: ['将 --entry 指向当前项目目录内的路径']
      });
    } else if (!existsSync(absEntry)) {
      issues.push({
        id: 'docker.entry.not_found',
        level: 'error',
        message: `Docker 入口不存在: ${entry}`,
        remediation: ['确认 --entry 对应文件存在，或移除 --entry 使用自动推断']
      });
    }
  }

  if (checkDockerDaemon) {
    try {
      checkDockerAvailable();
    } catch (err: unknown) {
      issues.push({
        id: 'docker.daemon_unavailable',
        level: 'error',
        message: err instanceof Error ? err.message : String(err),
        remediation: ['启动本机 Docker 环境（Docker Desktop / Docker Engine）后重试']
      });
    }
  }
}

const RUNTIME_SPECS: FcApiRuntimeDeploySpec[] = [
  {
    runtime: 'nodejs20',
    mode: 'vendor',
    defaultEntry: 'src/index.ts',
    entryRule: '入口文件需位于项目目录内，通常为 .ts/.js 文件。',
    handlerRule: '必须导出 handler(event, context) 函数。',
    handlerContract: {
      kind: 'function',
      entryFileExtensions: ['.ts', '.js', '.mjs', '.cjs'],
      requiredExports: ['handler'],
      signature: 'handler(event, context)',
      asyncAllowed: true
    },
    eventSchema: {
      requiredFields: [
        'path',
        'rawPath',
        'rawQueryString',
        'httpMethod',
        'headers',
        'queryParameters',
        'body',
        'isBase64Encoded',
        'requestContext.http.method',
        'requestContext.http.path',
        'requestContext.http.sourceIp'
      ],
      optionalFields: [],
      notes: ['event 为 HTTP 请求归一化对象，body 默认是 UTF-8 字符串。']
    },
    responseSchema: {
      acceptedForms: [
        '{ statusCode, headers?, body? }',
        'string',
        'Buffer/Uint8Array',
        'plain object (自动 JSON 序列化)',
        'undefined/null (204)'
      ],
      notes: ['建议显式返回 statusCode 与 headers，便于跨 runtime 一致。']
    },
    examples: {
      minimalPassExample: "export async function handler(event, context) { return { statusCode: 200, body: 'ok' }; }",
      commonFailExample: "export default async function app(event) { return { statusCode: 200, body: 'ok' }; }",
      fixHint: ['nodejs20 仅接受 handler 导出；把 default 导出改为 named export handler。']
    },
    validationRules: [
      { id: 'entry.outside_project', level: 'error', summary: '入口文件必须在项目目录内。' },
      { id: 'entry.not_found', level: 'error', summary: '入口文件不存在。' },
      { id: 'entry.not_file', level: 'error', summary: '入口路径必须是文件。' },
      { id: 'entry.runtime_contract', level: 'error', summary: '必须导出 handler(event, context)。' }
    ],
    notes: [
      '部署前会校验 handler 导出。',
      '代码会由 bun build 打包后上传。'
    ]
  },
  {
    runtime: 'nodejs22',
    mode: 'custom-runtime',
    defaultEntry: 'src/index.ts',
    entryRule: '入口文件需位于项目目录内，通常为 .ts/.js 文件。',
    handlerRule: '需导出 handler 或 default 函数。',
    handlerContract: {
      kind: 'function',
      entryFileExtensions: ['.ts', '.js', '.mjs', '.cjs'],
      oneOfExports: [['handler'], ['default']],
      signature: 'handler(event, context) 或 default(event, context)',
      asyncAllowed: true
    },
    eventSchema: {
      requiredFields: [
        'path',
        'rawPath',
        'rawQueryString',
        'httpMethod',
        'headers',
        'queryParameters',
        'body',
        'isBase64Encoded',
        'requestContext.http.method',
        'requestContext.http.path',
        'requestContext.http.sourceIp'
      ],
      optionalFields: [],
      notes: ['通过内置 node22 bootstrap 适配为 HTTP handler。']
    },
    responseSchema: {
      acceptedForms: [
        '{ statusCode, headers?, body? }',
        'string',
        'Buffer/Uint8Array',
        'plain object (自动 JSON 序列化)',
        'undefined/null (204)'
      ],
      notes: ['如果返回 plain object，默认 content-type=application/json。']
    },
    examples: {
      minimalPassExample: "export default async function app(event, context) { return { statusCode: 200, body: 'ok' }; }",
      commonFailExample: "export const main = async () => ({ statusCode: 200, body: 'ok' });",
      fixHint: ['nodejs22 需要导出 handler 或 default 函数。']
    },
    validationRules: [
      { id: 'entry.outside_project', level: 'error', summary: '入口文件必须在项目目录内。' },
      { id: 'entry.not_found', level: 'error', summary: '入口文件不存在。' },
      { id: 'entry.not_file', level: 'error', summary: '入口路径必须是文件。' },
      { id: 'entry.runtime_contract', level: 'error', summary: '必须导出 handler 或 default 函数。' }
    ],
    notes: [
      '部署前会校验导出函数。',
      '运行在 custom.debian12 + 内置 node22。'
    ]
  },
  {
    runtime: 'python3.12',
    mode: 'vendor',
    defaultEntry: 'src/main.py',
    entryRule: '入口文件必须是 .py，且位于项目目录内。',
    handlerRule: '必须定义可调用函数 handler(event, context)。',
    handlerContract: {
      kind: 'function',
      entryFileExtensions: ['.py'],
      requiredExports: ['handler'],
      signature: 'handler(event, context)',
      asyncAllowed: true
    },
    eventSchema: {
      requiredFields: [
        'path',
        'rawPath',
        'rawQueryString',
        'httpMethod',
        'headers',
        'queryParameters',
        'body',
        'isBase64Encoded',
        'requestContext.http.method',
        'requestContext.http.path',
        'requestContext.http.sourceIp'
      ],
      optionalFields: [],
      notes: ['body 是字符串；需要自行 JSON 反序列化。']
    },
    responseSchema: {
      acceptedForms: [
        '{ statusCode, headers?, body? }',
        'string',
        'bytes/bytearray',
        'dict/list (自动 JSON 序列化)',
        'None (204)'
      ],
      notes: ['推荐统一返回 statusCode/body 结构。']
    },
    examples: {
      minimalPassExample: "def handler(event, context):\n  return {'statusCode': 200, 'body': 'ok'}",
      commonFailExample: "def main(event, context):\n  return {'statusCode': 200, 'body': 'ok'}",
      fixHint: ['python runtime 必须存在可调用 handler(event, context) 函数。']
    },
    validationRules: [
      { id: 'entry.outside_project', level: 'error', summary: '入口文件必须在项目目录内。' },
      { id: 'entry.not_found', level: 'error', summary: '入口文件不存在。' },
      { id: 'entry.not_file', level: 'error', summary: '入口路径必须是文件。' },
      { id: 'entry.runtime_contract', level: 'error', summary: '入口必须包含 handler(event, context)。' },
      { id: 'python.dependencies_manifest_missing', level: 'warning', summary: '缺少 requirements/pyproject，第三方依赖可能不会被安装。' }
    ],
    notes: [
      '部署前会校验 handler 函数签名。',
      '会自动打包 Python 源码与依赖。'
    ]
  },
  {
    runtime: 'python3.13',
    mode: 'custom-runtime',
    defaultEntry: 'src/main.py',
    entryRule: '入口文件必须是 .py，且位于项目目录内。',
    handlerRule: '必须定义可调用函数 handler(event, context)。',
    handlerContract: {
      kind: 'function',
      entryFileExtensions: ['.py'],
      requiredExports: ['handler'],
      signature: 'handler(event, context)',
      asyncAllowed: true
    },
    eventSchema: {
      requiredFields: [
        'path',
        'rawPath',
        'rawQueryString',
        'httpMethod',
        'headers',
        'queryParameters',
        'body',
        'isBase64Encoded',
        'requestContext.http.method',
        'requestContext.http.path',
        'requestContext.http.sourceIp'
      ],
      optionalFields: [],
      notes: ['通过内置 python3.13 bootstrap 适配 HTTP 请求事件。']
    },
    responseSchema: {
      acceptedForms: [
        '{ statusCode, headers?, body? }',
        'string',
        'bytes/bytearray',
        'dict/list (自动 JSON 序列化)',
        'None (204)'
      ],
      notes: ['返回 dict/list 时会自动 JSON 编码并设置 content-type。']
    },
    examples: {
      minimalPassExample: "def handler(event, context):\n  return {'statusCode': 200, 'body': 'ok'}",
      commonFailExample: "def app(event, context):\n  return {'statusCode': 200, 'body': 'ok'}",
      fixHint: ['python3.13 也要求 handler(event, context)；函数名不匹配会在预检阶段失败。']
    },
    validationRules: [
      { id: 'entry.outside_project', level: 'error', summary: '入口文件必须在项目目录内。' },
      { id: 'entry.not_found', level: 'error', summary: '入口文件不存在。' },
      { id: 'entry.not_file', level: 'error', summary: '入口路径必须是文件。' },
      { id: 'entry.runtime_contract', level: 'error', summary: '入口必须包含 handler(event, context)。' },
      { id: 'python.dependencies_manifest_missing', level: 'warning', summary: '缺少 requirements/pyproject，第三方依赖可能不会被安装。' }
    ],
    notes: [
      '部署前会校验 handler 函数签名。',
      '运行在 custom.debian12 + 内置 python3.13。'
    ]
  },
  {
    runtime: 'docker',
    mode: 'custom-container',
    defaultEntry: null,
    entryRule: '优先使用 Dockerfile；若缺失则尝试自动生成（Node/Python 项目）。',
    handlerRule: '容器内需监听 FC_SERVER_PORT/PORT（默认 9000），并响应 HTTP 请求。',
    handlerContract: {
      kind: 'container-http',
      entryFileExtensions: [],
      containerPortEnv: ['FC_SERVER_PORT', 'PORT'],
      signature: 'HTTP server listening on 0.0.0.0:${FC_SERVER_PORT|PORT|9000}'
    },
    eventSchema: {
      requiredFields: ['HTTP request at container port 9000'],
      optionalFields: [],
      notes: ['如果使用 licell 自动生成 Dockerfile，会附带 node/python bootstrap 事件模型。']
    },
    responseSchema: {
      acceptedForms: ['standard HTTP response from your container app'],
      notes: ['容器模式下由应用自行处理 HTTP 协议，不要求固定 handler 函数导出。']
    },
    examples: {
      minimalPassExample: "const port = Number(process.env.FC_SERVER_PORT || process.env.PORT || 9000); app.listen(port, '0.0.0.0');",
      commonFailExample: "app.listen(3000, '127.0.0.1')",
      fixHint: [
        '必须监听 FC_SERVER_PORT 或 PORT（默认 9000）。',
        '绑定地址需为 0.0.0.0，不能只监听 127.0.0.1。'
      ]
    },
    validationRules: [
      { id: 'docker.project_type_undetected', level: 'error', summary: '无 Dockerfile 且无法识别项目类型。' },
      { id: 'docker.node_ts_no_build_script', level: 'error', summary: 'TS 项目缺少 build 脚本且未指定 --entry。' },
      { id: 'docker.entry.outside_project', level: 'error', summary: 'Docker 入口必须在项目目录内。' },
      { id: 'docker.entry.not_found', level: 'error', summary: 'Docker 入口不存在。' },
      { id: 'docker.daemon_unavailable', level: 'error', summary: '本机 Docker daemon 不可用。' }
    ],
    notes: [
      '部署依赖本机 Docker daemon。',
      '镜像将推送到 ACR，再由 FC custom-container 拉取。'
    ]
  }
];

const RESOURCE_SPEC: FcApiDeployResourceSpec = {
  defaults: {
    memoryMb: FC_DEFAULT_MEMORY_MB,
    vcpu: FC_DEFAULT_VCPU,
    timeoutSeconds: FC_DEFAULT_TIMEOUT_SECONDS,
    instanceConcurrency: FC_DEFAULT_INSTANCE_CONCURRENCY
  },
  constraints: {
    memoryToVcpuRatio: {
      min: FC_MEMORY_VCPU_RATIO_MIN,
      max: FC_MEMORY_VCPU_RATIO_MAX,
      expression: 'memoryGb / vcpu in [1, 4]'
    }
  }
};

export function listFcApiRuntimeDeploySpecs(): FcApiRuntimeDeploySpec[] {
  const supported = new Set(getSupportedRuntimeNames());
  return RUNTIME_SPECS
    .filter((item) => supported.has(item.runtime))
    .map((item) => ({
      ...item,
      handlerContract: {
        ...item.handlerContract,
        entryFileExtensions: [...item.handlerContract.entryFileExtensions],
        ...(item.handlerContract.requiredExports ? { requiredExports: [...item.handlerContract.requiredExports] } : {}),
        ...(item.handlerContract.oneOfExports
          ? { oneOfExports: item.handlerContract.oneOfExports.map((row) => [...row]) }
          : {}),
        ...(item.handlerContract.containerPortEnv ? { containerPortEnv: [...item.handlerContract.containerPortEnv] } : {})
      },
      eventSchema: {
        requiredFields: [...item.eventSchema.requiredFields],
        optionalFields: [...item.eventSchema.optionalFields],
        notes: [...item.eventSchema.notes]
      },
      responseSchema: {
        acceptedForms: [...item.responseSchema.acceptedForms],
        notes: [...item.responseSchema.notes]
      },
      examples: {
        minimalPassExample: item.examples.minimalPassExample,
        commonFailExample: item.examples.commonFailExample,
        fixHint: [...item.examples.fixHint]
      },
      validationRules: item.validationRules.map((rule) => ({ ...rule })),
      notes: [...item.notes]
    }));
}

export function getFcApiRuntimeDeploySpec(runtime: string): FcApiRuntimeDeploySpec {
  const normalized = runtime.trim().toLowerCase();
  const matched = listFcApiRuntimeDeploySpecs().find((item) => item.runtime === normalized);
  if (!matched) {
    const supported = listFcApiRuntimeDeploySpecs().map((item) => item.runtime).join(', ');
    throw new Error(`不支持的 runtime: ${runtime}（支持: ${supported}）`);
  }
  return matched;
}

export function getFcApiDeploySpecDocument(): FcApiDeploySpecDocument {
  return {
    runtimes: listFcApiRuntimeDeploySpecs(),
    resources: {
      defaults: { ...RESOURCE_SPEC.defaults },
      constraints: {
        memoryToVcpuRatio: { ...RESOURCE_SPEC.constraints.memoryToVcpuRatio }
      }
    }
  };
}

export function runFcApiDeployPrecheck(options: {
  runtime: string;
  entry?: string;
  projectRoot?: string;
  checkDockerDaemon?: boolean;
}): FcApiDeployPrecheckResult {
  const runtime = options.runtime.trim().toLowerCase();
  const projectRoot = resolve(options.projectRoot || process.cwd());
  const issues: FcApiDeployPrecheckIssue[] = [];

  const supportedRuntimes = new Set(getSupportedRuntimeNames());
  if (!supportedRuntimes.has(runtime)) {
    issues.push({
      id: 'runtime.unsupported',
      level: 'error',
      message: `不支持的 runtime: ${runtime}`,
      remediation: [`请改用支持的 runtime: ${[...supportedRuntimes].join(', ')}`]
    });
    return {
      ok: false,
      runtime,
      entry: options.entry ? toPosixPath(options.entry.trim()) : '',
      projectRoot,
      issues
    };
  }

  const rawEntry = options.entry?.trim() || getDefaultEntry(runtime);
  const entry = toPosixPath(rawEntry);

  if (!entry && runtime !== 'docker') {
    issues.push({
      id: 'entry.required',
      level: 'error',
      message: `runtime=${runtime} 需要入口文件，请通过 --entry 指定。`,
      remediation: ['例如: --entry src/index.ts 或 --entry src/main.py']
    });
  }

  if (runtime === 'docker') {
    checkDockerEntry(projectRoot, entry, Boolean(options.checkDockerDaemon), issues);
  } else if (entry) {
    checkNonDockerEntry(projectRoot, runtime, entry, issues);
  }

  return {
    ok: !issues.some((item) => item.level === 'error'),
    runtime,
    entry,
    projectRoot,
    issues
  };
}

export function createFcApiDeployPrecheckError(result: FcApiDeployPrecheckResult) {
  const details: FcApiDeployPrecheckErrorDetails = {
    runtime: result.runtime,
    entry: result.entry,
    projectRoot: result.projectRoot,
    issues: result.issues.map((item) => ({
      id: item.id,
      level: item.level,
      message: item.message,
      ...(item.remediation ? { remediation: [...item.remediation] } : {})
    }))
  };
  const err = new Error('部署前预检失败（入口/运行时不满足 FC 要求）') as Error & {
    code?: string;
    details?: FcApiDeployPrecheckErrorDetails;
  };
  err.code = 'DEPLOY_PRECHECK_FAILED';
  err.details = details;
  return err;
}
