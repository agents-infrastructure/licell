# Preview Deployments 设计方案

## 背景

当前 `licell deploy` 直接更新 FC 的 `$LATEST`。v0.9.27 已将 `domain add` 默认绑定到 `prod` 别名，实现了 deploy 与生产的隔离。下一步需要支持 preview 部署：每次 deploy 生成独立的预览域名，方便验证后再 promote 到生产。

## 用户旅程

```bash
# 1. 首次部署 + 绑定生产域名
licell deploy --domain-suffix example.com --target prod
# → 部署函数 + 绑定 myapp.example.com → prod 别名

# 2. 日常开发 — 带 preview
licell deploy --preview
# → 更新 $LATEST
# → publish version 5
# → 创建 FC 自定义域名: myapp-preview-v5.example.com → version 5
# → 签发 SSL 证书
# → 输出: Preview URL: https://myapp-preview-v5.example.com
# → 生产 myapp.example.com 不受影响

# 3. 跳过 SSL 的快速 preview
licell deploy --preview --no-ssl
# → 同上但不签发证书，输出 HTTP URL

# 4. 验证后发布到生产
licell release promote 5
# → prod 别名 → version 5

# 5. 清理旧 preview
licell release prune --preview --keep 3
# → 删除旧的 preview 域名绑定，保留最近 3 个
```

## 核心流程

```
licell deploy --preview
  │
  ├─ 1. deployFC()                    更新 $LATEST
  ├─ 2. publishFunctionVersion()      快照为 version N
  ├─ 3. 生成预览域名                   {appName}-preview-v{N}.{domainSuffix}
  ├─ 4. ensureWildcardCname()         确保 *.{domainSuffix} CNAME 存在（首次需确认）
  ├─ 5. bindCustomDomain()            FC 自定义域名绑定，qualifier=N
  ├─ 6. [可选] issueAndBindSSL()      仅 --ssl 时签发证书
  └─ 7. 输出 Preview URL + 健康检查
```

## 通配符 DNS

### 方案

用通配符 CNAME（`*.example.com` → `{accountId}.{region}.fc.aliyuncs.com`）避免每次 preview 都创建 DNS 记录。后续 preview 只需调 FC API 创建自定义域名绑定，秒级生效。

### 首次确认

首次使用 `--preview` 时，如果通配符 DNS 不存在，弹交互确认：

```
检测到尚未配置通配符 DNS (*.example.com)。
创建后，所有 preview 子域名将自动解析到 FC 网关。
已有的精确 DNS 记录（如 myapp.example.com）不受影响。
是否创建？(Y/n)
```

通过 Alidns API 自动创建，用户无需手动操作。非交互模式（CI）下需要 `--yes` 跳过确认。

### 安全性

- 通配符 CNAME 不会覆盖已有的精确 DNS 记录
- 未在 FC 注册自定义域名的子域名会返回 404
- 不会暴露任何已有服务

## 域名命名规则

```
{appName}-preview-v{versionId}.{domainSuffix}
```

示例：`myapi-preview-v5.example.com`、`myapi-preview-v12.example.com`

## SSL 处理

- `--preview` 默认签发 SSL 证书（与生产域名行为一致）
- `--preview --no-ssl` 可跳过 SSL 签发（加速场景）
- 复用现有 `issueAndBindSSL()` 逻辑，无需改动 SSL 模块
- 不使用通配符证书（当前 ACME 实现不支持，且逐域名签发更简单）

## 前置条件

- 必须配置过 `--domain-suffix`（项目配置中有 domainSuffix）
- 未配置时 `--preview` 报错：`请先执行 licell deploy --domain-suffix your-domain.com`

## 清理机制

扩展 `release prune` 支持 `--preview`：

```bash
licell release prune --preview --keep 3
```

1. 列出所有 FC 自定义域名，匹配 `{appName}-preview-v*` 模式
2. 按版本号排序，保留最近 N 个
3. 删除旧的 FC 自定义域名绑定
4. DNS 通配符记录不需要清理

## 需要新增/修改的文件

| 文件 | 改动 |
|------|------|
| `src/commands/deploy-context.ts` | 新增 `preview` 选项解析 |
| `src/commands/deploy-api.ts` | `--preview` 时自动 publish + 绑定预览域名 |
| `src/commands/deploy.ts` | 新增 `--preview` CLI 选项 |
| `src/providers/domain.ts` | 新增 `ensureWildcardCname()` 函数 |
| `src/commands/release.ts` | `prune --preview` 清理旧预览域名 |
| `src/__tests__/` | 对应测试 |

## 与现有流程的关系

```
licell deploy                    → 更新 $LATEST（预览用 FC 原生 URL）
licell deploy --preview          → 更新 $LATEST + 发版 + 预览域名 + SSL
licell deploy --preview --no-ssl → 同上但跳过 SSL（快速）
licell deploy --target prod      → 更新 $LATEST + 发版 + 切 prod（快捷方式）
licell release promote [version] → 切 prod 别名到指定版本
licell release prune --preview   → 清理旧预览域名
```

## Static 部署的 Preview（Phase 2）

### 现状

Static deploy 的架构与 API 完全不同：
- 文件上传到 OSS bucket（`licell-{appName}-{accountId前4位}`）
- 域名通过 CDN 回源 OSS
- 没有版本/别名概念，每次 deploy 直接覆盖 bucket 根路径的文件

### 挑战

- OSS 没有原生的版本快照机制（不像 FC 的 publishVersion）
- CDN 回源路径切换不像 FC 别名那样秒级生效，有缓存刷新延迟
- 每个 preview 需要独立的 CDN 域名 + 回源路径配置

### 方案：路径前缀隔离

```
OSS bucket 结构:
├── /                           ← 生产文件（CDN 域名回源这里）
├── _preview/1708000000000/     ← preview 快照 1
├── _preview/1708003600000/     ← preview 快照 2
└── _preview/1708007200000/     ← preview 快照 3
```

`licell deploy --preview`（static 类型）：
1. 上传构建产物到 `_preview/{timestamp}/` 路径前缀
2. 创建 CDN 域名 `{appName}-preview-{ts}.{domainSuffix}`，回源到该前缀路径
3. 签发 SSL 证书
4. 输出 Preview URL

`licell release promote`（static 类型）：
1. 将 preview 路径下的文件复制到 bucket 根路径
2. 刷新 CDN 缓存

### Phase 1 策略

Phase 1 中 `--preview` 仅支持 API 类型。Static 类型使用 `--preview` 时报错提示：

```
--preview 暂不支持 static 部署类型。
Static 部署后可直接通过 OSS URL 预览。
```

### Phase 2 实现要点

| 改动 | 说明 |
|------|------|
| `src/providers/oss.ts` | 支持上传到指定路径前缀 |
| `src/commands/deploy-static.ts` | `--preview` 时上传到 `_preview/{ts}/` |
| `src/providers/cdn.ts` | 支持创建回源到指定路径的 CDN 域名 |
| `src/commands/release.ts` | static promote: 复制文件到根路径 + 刷新 CDN |
