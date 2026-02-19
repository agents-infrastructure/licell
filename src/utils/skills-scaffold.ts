import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join, isAbsolute } from 'path';
import { homedir } from 'os';

export type AgentType = 'claude' | 'codex';

export interface SkillFile {
  path: string;
  content: string;
}

const AGENTS_MD_LICELL_ENTRY =
  '- licell: Deploy and manage Alibaba Cloud Serverless applications using the licell CLI. Covers deploy, release, functions, env vars, domains, DNS, logs, OSS, database, cache, and MCP. (file: .claude/skills/licell/SKILL.md)';

/* ------------------------------------------------------------------ */
/*  SKILL content                                                      */
/* ------------------------------------------------------------------ */

function getSkillContent(): string {
  return `---
name: licell
description: >-
  Deploy and manage Alibaba Cloud Serverless applications using the licell CLI.
  Covers deploy, release, functions, env vars, domains, DNS, logs, OSS, database, cache, and MCP.
metadata:
  author: licell
  version: "1.0"
---

# licell CLI Skill

Deploy and manage Alibaba Cloud Serverless (FC 3.0) applications from the command line.

## Prerequisites

- \`licell\` CLI installed and on PATH
- Authenticated via \`licell login\` (credentials stored in \`~/.licell-cli/auth.json\`)
- Project initialized via \`licell init\` (config in \`.licell/project.json\`)

## Quick Start Workflow

\`\`\`bash
licell login                                          # 配置阿里云凭证
licell init                                           # 初始化项目（脚手架 + 配置）
licell deploy --type api --target preview             # 部署到 preview
licell release promote --target prod                  # 发布到生产
\`\`\`

<!-- PLACEHOLDER_COMMAND_REFERENCE -->
`;
}

/* ------------------------------------------------------------------ */
/*  Command reference (split for chunked writing)                      */
/* ------------------------------------------------------------------ */

function getCommandReference(): string {
  return `## Command Reference

### Deploy (\`licell deploy\`)

一键打包部署到阿里云函数计算。

| 选项 | 说明 |
|------|------|
| \`--type <type>\` | 部署类型：\`api\` 或 \`static\` |
| \`--entry <entry>\` | API 入口文件（Node 默认 src/index.ts；Python 默认 src/main.py） |
| \`--dist <dist>\` | 静态站点目录（默认 dist） |
| \`--runtime <runtime>\` | 运行时：nodejs20/nodejs22/python3.12/python3.13/docker/static |
| \`--target <target>\` | 部署后自动发布到指定 alias（如 prod/preview） |
| \`--domain <domain>\` | 绑定完整自定义域名（如 api.example.com） |
| \`--domain-suffix <suffix>\` | 自动绑定子域名后缀（如 example.com） |
| \`--enable-cdn\` | 接入 CDN 并将 DNS CNAME 切到 CDN |
| \`--ssl\` | 启用 HTTPS（Let's Encrypt 自动证书） |
| \`--enable-vpc\` / \`--disable-vpc\` | 启用/禁用 VPC 接入 |
| \`--memory <mb>\` | 函数内存（MB，默认 512） |
| \`--vcpu <n>\` | vCPU 核数（默认 0.5） |
| \`--instance-concurrency <n>\` | 单实例并发数 |
| \`--timeout <seconds>\` | 函数超时（秒，默认 30） |
| \`--acr-namespace <ns>\` | Docker 部署的 ACR 命名空间（默认 licell） |

### FC API Spec & Precheck（Agent 推荐）

| 命令 | 说明 |
|------|------|
| \`licell deploy spec [runtime]\` | 查看 FC API runtime 规格（entry/handler/资源约束） |
| \`licell deploy spec --all\` | 查看全部 runtime 规格 |
| \`licell deploy check --runtime <runtime> --entry <entry>\` | 部署前本地预检（缺少 handler/入口错误会提前报出） |
| \`licell deploy check --runtime docker --docker-daemon\` | Docker 预检并检测本机 Docker daemon |

**Agent 最佳实践：**

\`\`\`bash
# 1) 先读规格（知道该 runtime 的硬性要求）
licell deploy spec nodejs22

# 2) 再做预检（拿到可执行修复建议）
licell deploy check --runtime nodejs22 --entry src/index.ts

# 3) 预检通过后再部署
licell deploy --type api --runtime nodejs22 --entry src/index.ts --target preview
\`\`\`

\`deploy spec --output json\` 包含 \`handlerContract\`、\`eventSchema\`、\`responseSchema\`、\`examples\`、\`validationRules\`，可直接供 Agent 规划与校验。

**常见用法：**

\`\`\`bash
# API 部署到 preview
licell deploy --type api --target preview

# 静态站点部署
licell deploy --type static --dist dist --domain-suffix example.com

# Docker 部署
licell deploy --type api --runtime docker --target preview
\`\`\`

### Release Management (\`licell release\`)

| 命令 | 说明 |
|------|------|
| \`licell release list [--limit <n>]\` | 查看函数版本列表 |
| \`licell release promote [versionId] --target <alias>\` | 发布并切流到目标别名（默认 prod） |
| \`licell release prune --keep <n> [--apply]\` | 清理历史版本（不传 --apply 仅预览） |

### Function Management (\`licell fn\`)

| 命令 | 说明 |
|------|------|
| \`licell fn list [--limit <n>] [--prefix <p>]\` | 查看函数列表 |
| \`licell fn info [name] [--target <alias>]\` | 查看函数详情 |
| \`licell fn invoke [name] [--target <alias>] [--payload <json>]\` | 调用云端函数 |
| \`licell fn rm <name> [--force] [--yes]\` | 删除函数（--force 级联删除触发器/alias/版本） |

### Environment Variables (\`licell env\`)

| 命令 | 说明 |
|------|------|
| \`licell env list [--target <alias>] [--show-values]\` | 查看云端环境变量 |
| \`licell env set <key> <value>\` | 设置环境变量（同步本地配置） |
| \`licell env rm <key> [--yes]\` | 删除环境变量 |
| \`licell env pull [--target <alias>]\` | 拉取云端环境变量到本地 |

### Domain (\`licell domain\`)

| 命令 | 说明 |
|------|------|
| \`licell domain add <domain> [--ssl] [--target <alias>]\` | 绑定自定义域名 |
| \`licell domain rm <domain> [--yes]\` | 解绑域名并清理 DNS |

### DNS Records (\`licell dns\`)

| 命令 | 说明 |
|------|------|
| \`licell dns records list [domain] [--limit <n>]\` | 查看解析记录 |
| \`licell dns records add <domain> --rr <rr> --type <type> --value <val>\` | 添加解析记录 |
| \`licell dns records rm <recordId> [--yes]\` | 删除解析记录 |

### Logs (\`licell logs\`)

| 选项 | 说明 |
|------|------|
| \`--once\` | 仅拉取一次最近日志并退出 |
| \`--window <seconds>\` | 一次拉取的时间窗（默认 120 秒） |
| \`--lines <n>\` | 每次最大日志条数（默认 1000） |

### OSS (\`licell oss\`)

| 命令 | 说明 |
|------|------|
| \`licell oss list [--limit <n>]\` | 查看 Bucket 列表 |
| \`licell oss info <bucket>\` | 查看 Bucket 详情 |
| \`licell oss objects [bucket] [--prefix <p>] [--limit <n>]\` | 查看对象列表 |
| \`licell oss upload [bucket] --source-dir <dir> [--target-dir <dir>]\` | 上传目录到 OSS |

### Database (\`licell db\`)

| 命令 | 说明 |
|------|------|
| \`licell db add --type <postgres\\|mysql>\` | 分配 Serverless 数据库 |
| \`licell db list [--limit <n>]\` | 查看数据库实例列表 |
| \`licell db info [instanceId]\` | 查看实例详情 |
| \`licell db connect [instanceId]\` | 输出连接信息 |

\`db add\` 高级选项：\`--engine-version\`、\`--class\`、\`--storage\`、\`--min-rcu\`、\`--max-rcu\`、\`--auto-pause\`、\`--zone\`、\`--vpc\`、\`--vsw\`、\`--security-ip-list\`

### Cache (\`licell cache\`)

| 命令 | 说明 |
|------|------|
| \`licell cache add --type redis\` | 分配 Redis/Tair 缓存 |
| \`licell cache list [--limit <n>]\` | 查看实例列表 |
| \`licell cache info [instanceId]\` | 查看实例详情 |
| \`licell cache connect [instanceId]\` | 输出连接信息 |
| \`licell cache rotate-password [--instance <id>]\` | 轮换 Redis 密码 |

\`cache add\` 高级选项：\`--instance\`、\`--password\`、\`--class\`、\`--zone\`、\`--vpc\`、\`--vsw\`、\`--security-ip-list\`

### MCP Server (\`licell mcp\`)

| 命令 | 说明 |
|------|------|
| \`licell mcp\` | 初始化 .mcp.json 并启动 stdio server |
| \`licell mcp init\` | 仅写入 .mcp.json 配置 |
| \`licell mcp serve\` | 启动 MCP stdio server |

### Auth (\`licell login\` / \`licell whoami\` / \`licell switch\`)

| 命令 | 说明 |
|------|------|
| \`licell login\` | 配置阿里云凭证（交互式或 --ak/--sk/--account-id） |
| \`licell login --bootstrap-ram\` | 自动创建最小权限 RAM 用户 |
| \`licell whoami\` | 查看当前登录信息 |
| \`licell switch --region <region>\` | 切换默认 region |

## Common Patterns

### 典型部署流程

\`\`\`bash
# 1. 部署到 preview 环境
licell deploy --type api --target preview

# 2. 验证 preview 环境
licell fn invoke --target preview --payload '{"path":"/health"}'

# 3. 发布到生产
licell release promote --target prod

# 4. 如有问题，回滚
licell release rollback --target prod
\`\`\`

### 环境变量管理

\`\`\`bash
licell env set DATABASE_URL "postgresql://..."
licell env set REDIS_URL "redis://..."
licell deploy --type api --target preview    # 重新部署使变量生效
\`\`\`

### 自定义域名 + HTTPS + CDN

\`\`\`bash
licell deploy --type api --target prod --domain api.example.com --ssl --enable-cdn
\`\`\`

### 数据库 + 缓存 + VPC 全栈部署

\`\`\`bash
licell db add --type postgres
licell cache add --type redis
licell deploy --type api --target preview --enable-vpc
\`\`\`

## Error Handling

- 认证失败：运行 \`licell login\` 重新配置凭证
- 部署失败：检查 \`licell logs --once\` 查看错误日志
- 域名冲突：使用 \`licell domain rm <domain>\` 清理后重试
- 版本清理：\`licell release prune --keep 5 --apply\` 清理旧版本
- 破坏性操作（rm/prune）需要 \`--yes\` 跳过确认，或在交互模式下手动确认
`;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export function getGlobalSkillsDir(agent: AgentType): string {
  const home = homedir();
  if (agent === 'claude') return join(home, '.claude', 'skills', 'licell');
  return join(home, '.agents', 'skills', 'licell');
}

export function getSkillFiles(agent: AgentType): SkillFile[] {
  const body = getSkillContent().replace('<!-- PLACEHOLDER_COMMAND_REFERENCE -->\n', '') + getCommandReference();

  if (agent === 'claude') {
    return [{ path: '.claude/skills/licell/SKILL.md', content: body }];
  }

  // codex: standalone instruction file at project root
  return [{ path: 'codex.md', content: body }];
}

export function getGlobalSkillFiles(agent: AgentType): SkillFile[] {
  const body = getSkillContent().replace('<!-- PLACEHOLDER_COMMAND_REFERENCE -->\n', '') + getCommandReference();
  const dir = getGlobalSkillsDir(agent);
  return [{ path: join(dir, 'SKILL.md'), content: body }];
}

export function ensureAgentsMdEntry(projectRoot: string): { filePath: string; updated: boolean } {
  const filePath = join(projectRoot, 'AGENTS.md');

  if (!existsSync(filePath)) {
    const content = `# AGENTS.md\n\n## Available Skills\n\n${AGENTS_MD_LICELL_ENTRY}\n`;
    writeFileSync(filePath, content, 'utf8');
    return { filePath, updated: true };
  }

  const existing = readFileSync(filePath, 'utf8');
  if (existing.includes('.claude/skills/licell/SKILL.md')) {
    return { filePath, updated: false };
  }

  // Insert after "### Available skills" or "## Available Skills" header
  const headerPattern = /^(#{2,3}\s+Available\s+[Ss]kills\s*)$/m;
  const match = headerPattern.exec(existing);
  if (match && match.index !== undefined) {
    const insertPos = match.index + match[0].length;
    const updated = `${existing.slice(0, insertPos)}\n${AGENTS_MD_LICELL_ENTRY}${existing.slice(insertPos)}`;
    writeFileSync(filePath, updated, 'utf8');
    return { filePath, updated: true };
  }

  // Fallback: append to end
  const updated = `${existing.trimEnd()}\n\n## Available Skills\n\n${AGENTS_MD_LICELL_ENTRY}\n`;
  writeFileSync(filePath, updated, 'utf8');
  return { filePath, updated: true };
}

export function writeSkillFiles(
  projectRoot: string,
  files: SkillFile[],
  force = false
): { written: string[]; skipped: string[] } {
  const written: string[] = [];
  const skipped: string[] = [];

  for (const file of files) {
    const fullPath = isAbsolute(file.path) ? file.path : join(projectRoot, file.path);
    const dir = dirname(fullPath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    if (existsSync(fullPath)) {
      const current = readFileSync(fullPath, 'utf8');
      if (current === file.content) {
        skipped.push(file.path);
        continue;
      }
      if (!force) {
        throw new Error(`文件已存在且内容不同: ${file.path}（使用 --force 覆盖）`);
      }
    }

    writeFileSync(fullPath, file.content, 'utf8');
    written.push(file.path);
  }

  return { written, skipped };
}
