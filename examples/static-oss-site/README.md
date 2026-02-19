# Static OSS Site Example

这个示例演示如何通过 `licell` 将静态站点一键部署到 OSS 托管（无需 FC）。

## 部署（Licell）

```bash
cd examples/static-oss-site
licell login
licell deploy --type static

# 绑定固定域名（自动 CDN + 默认 HTTPS）
licell deploy --type static --domain-suffix your-domain.xyz

# 或完整域名
licell deploy --type static --domain static.your-domain.xyz
```

说明：

- `--dist` 省略时会自动探测常见目录（本示例为 `dist/`）。
- 如果遇到 OSS Bucket 冲突（bucket 已存在但你无权限），请修改 `.licell/project.json` 的 `appName` 后重试。
