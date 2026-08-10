# Attention

本文件记录每次 CodeStable 会话必读且跨任务有效的项目事实，最多保留 25 条。

- CodeStable 落盘产出的正文使用中文；YAML、JSON、frontmatter 等机器字段保持原格式。
- `src/utils/output.ts` 会先按完整 message 匹配 input token，再匹配 not-found。测试 not-found 文案时应使用不含 `invalid`、`无效`、`不支持` 等 token 的干净 ID。
