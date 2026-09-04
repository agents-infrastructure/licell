# 阿里云 OpenAPI 协议快照

本目录保存从 `aliyun-openapi-meta` 复制的仓库内协议快照。Licell 在运行时只读
取本地快照，不连接上游仓库。

- 修改 `scope.json` 可调整纳入快照的产品。
- 运行 `bun run protocol:update --source /path/to/aliyun-cli` 人工升级快照。
- 运行 `bun run protocol:check` 校验文件哈希和 metadata 结构。
- 不要手工修改 `metadatas/` 或 `manifest.json`。
- `capabilities.json` 和 `src/generated/alicloud-capability-index.ts` 由升级命令确定性生成，分别用于审查和 CLI 内嵌读取。

复制的 metadata 继续遵循本目录内的 Apache-2.0 许可证。
