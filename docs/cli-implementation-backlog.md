# Licell CLI Command Backlog

本文件记录 `licell` CLI 的命令实现进度与推荐优先级。  
目标：先覆盖生产部署闭环，再补齐运维与资源管理能力。

## 已实现（可用）

- `login`
- `logout`
- `whoami`
- `switch`
- `deploy`（`api/static`、`--runtime`、`--target`、`--domain-suffix`、`--ssl`）
- `db add`
- `db list`
- `db info`
- `db connect`
- `cache add`
- `cache list`
- `cache info`
- `cache connect`
- `cache rotate-password`
- `fn list`
- `fn info`
- `fn invoke`
- `fn rm`
- `release list`
- `release promote`
- `release rollback`
- `release prune`
- `domain add`
- `domain rm`
- `dns records list`
- `dns records add`
- `dns records rm`
- `oss list`
- `oss info`
- `oss ls`
- `logs`
- `env list`
- `env set`
- `env rm`
- `env pull`

## P0（优先实现，直接提升生产可用性）

### 1) 认证与项目基础

- 已完成：`logout`、`whoami`、`switch --region`

### 2) FC 环境变量闭环

- 已完成：`env list`、`env set`、`env rm`（当前 `set/rm` 作用于函数最新配置）

### 3) 核心资源查询能力（便于排障）

- 已完成：`db list`、`db info`、`db connect`
- 已完成：`cache list`、`cache info`、`cache connect`

### 4) 域名回收能力

- 已完成：`domain rm <domain>`

## P1（高价值运维能力）

- 已完成：`fn list`、`fn info`、`fn rm`、`fn invoke`
- 已完成：`dns records list`、`dns records add`、`dns records rm`
- 已完成：`oss list`、`oss info`、`oss ls`

## P2（完善型能力）

- `db whitelist list/set`
- `db backup list/create`
- `redis whitelist list/set`
- `redis account list/create`
- `oss cp`
- `oss acl/cors/website/lifecycle/policy`
- `status`（聚合 FC/RDS/Redis/Domain）
- `link`（绑定已有资源向导）
- `up`（声明式一键编排）

## 暂缓（建议最后做）

- `dev`（本地 FC 运行时模拟，投入高）
- 多 profile 完整体系
- YAML 声明式配置（`aly.yaml`）全链路

## 建议实施顺序（短周期）

1. 补齐 `db/redis` 白名单与备份运维子命令
2. 补 `oss cp` 与 ACL/CORS/Website/Lifecycle/Policy 管理
3. 补 `status/link/up` 组合工作流
