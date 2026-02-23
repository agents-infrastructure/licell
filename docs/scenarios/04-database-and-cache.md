# [数据] 告别工单：一键创建 Serverless 数据库与缓存

> **目标**：一个完整的业务应用不仅仅有
> API，更需要数据的落盘。无论是大公司提交审批工单，或是个人开发者去阿里云控制台点点点购买
> RDS 实例，都不是什么好体验。通过
> Licell，我们甚至在终端内引入了管理数据库的命令。今天我们将看看如何秒级开通数据池。

## 1. 我们的需求：一个 Postgres 与 一个 Redis

在传统的控制台，你可能会面对几百个规格参数：“标准版、高可用版、SSD盘、ESSD盘、IOPS、网络白名单配置...”
如果是本地玩玩，你可以用 docker。但这里我们是云上应用系统。 Licell 的 `db` 和
`cache` 指令群组就是专门为了抹平这个门槛而诞生的——**基于 Serverless
理念的弹性计费数据库与缓存节点，支持一键创建**。

## 2. 拉起 Serverless Postgres (RDS)

在有 Licell `.licell/project.json`
的业务项目根目录下（这样它会和你接下来要部署的 API 函数共享网络）。直接敲击：

```bash
licell db add --type postgres
```

是的，如果你什么参数都不传，Licell
不会粗暴报错。它会进入智能选项向导（或基于默认最佳实践快速拉起）。

**后台发生了这些复杂的事：**

- 检查你之前用 `licell deploy` 的网络是否配置了 VPC 和
  VSwitch。如果没有，帮你建立一个专属项目的云上局域网。
- 调用 RDS 接口开启一台 **Serverless 原生版 PostgreSQL 18** 实例（按 `RCU`
  并发量伸缩性能，没有请求时还可以自动暂停扣费）。
- 设置超级管理员账号和安全的高强度随机密码。
- 添加入口允许的内网网段白名单。
- **最重要的一步**：成功拉起之后，直接将数据库内网连接串存入当前项目的
  `.licell/project.json` 作为环境变量 `DATABASE_URL`。

未来在 `deploy` 更新时，由于同一份 `project.json`
配置被复用，您的应用甚至不需要关心连哪个库，环境会自动挂载好所需的地址！

## 3. 拉起 Serverless 缓存网关 (Tair/Redis)

如同加一个库般简单：

```bash
licell cache add --type redis
```

由于你的业务规模很小，Licell 会默认拉起最新架构的 **256M Serverless 通用型 Tair
实例（100% 兼容 Redis 交互体系）**。当你的 QPS
徒增时，它的弹性伸缩特性会自动扩容到对应并发处理带宽，你依然也不需要去手动升降配实例。

完成后，您可以通过指令获取所有参数：

```bash
licell cache list
```

你不仅能在输出看到 Redis
的运行状态和资源消耗计费情况，你还能获取直接可以带进程序库中的环境注入对。同样地，包括
`REDIS_URL`, `REDIS_PASSWORD` 等已经悄悄进入了你的本地项目中，随时等待着
`deploy` 时挂载。

## 4. 获取连接信息与调试

我们深知运维者偶尔需要快速排查数据。 无需去控制台翻找复杂的实例详情菜单：

```bash
licell db connect
```

或对于刚刚创建的 Cache 实例：

```bash
licell cache connect
```

Licell 会自动解析当前你的上下文项目，或者你指定的云端实例
ID，在终端直接输出完整的连接凭证信息，包括
**Host、端口、只读/读写账号名、以及完整拼装好的能够通过白名单的 ConnectionString
链接串**。您可以直接将此链接串粘贴进 Navicat / DataGrip 或 Redis Desktop Manager
等常见可视化客户端进行调试查表！

## 5. 高阶参数

如果默认规则不符合需求，它支持极致精确的细微控制。比如手动开一台高配置：

```bash
licell db add \
  --type postgres \
  --engine-version 18.0 \
  --category serverless_basic \
  --storage 20 \
  --storage-type cloud_essd \
  --min-rcu 0.5 \
  --max-rcu 8 \
  --auto-pause on
```

当然，请记住：如果你使用了 Cursor 并且装好了 AI
Skills，你无需记住这串长长的命令。你可以对 AI 这样说：

> “我要新建一个 PG18 的数据库实例，存储大小给它搞成 20G，最大并发资源放到 8 个
> RCU 点，其他按默认的来，能自动暂停扣费最好。”

你的 Agent 会迅速生成这段命令并在终端中执行！

---

**⏭️ 下一步指引：**
现在你手握着强大的网络服务和数据资源。那么在团队协作中，你该如何优雅地控制版本？最后阅读
[《环境与隔离：像 Vercel 一样管理 Preview 与 Prod》](./05-environments-and-releases.md)。
