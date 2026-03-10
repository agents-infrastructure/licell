# [网络] 告别繁琐控制台：一行命令搞定自定义域名与 HTTPS

> **目标**：你已经成功将代码部署到了云端，但目前使用的是一长串难记的阿里云临时域名。本文将引导你如何用一行命令为你的
> Serverless 应用绑定专属域名，甚至连复杂的 HTTPS 证书发签发与 DNS 校验也全部由
> Licell 代劳。

## 1. 痛点：传统的 Web 网络平面配置

回顾传统方式配置一个网站域名与 HTTPS 证书的过程：

1. 登录域名管理控制台，添加 CNAME 记录。
2. 登录 SSL 证书购买页，申请一年期证书（往往需要验证文件或添加 TXT 记录）。
3. 下载包含密钥的 `.pem` 和 `.key` 证书文件。
4. 登录 CDN 或是 Serverless 路由管理页面，把文本内容贴进去。
5. 每年快到期时人工重复这个动作，一旦忘记就会出现红色报警“您的链接不安全”。

而现在在 Licell 中，我们只需要一条简单的 `--ssl` 标志，即可自动化完成接管。

## 2. 基于企业后缀的自动分配（强烈推荐）

如果你手头有一个企业泛域名（例如 `my-startup.com`），Licell 可以结合你项目中的
`appName` 变量自动为你组合配置二级域名，特别适合于有频繁发包需求或多团队的项目：

```bash
licell deploy \
  --type api \
  --entry src/index.ts \
  --runtime nodejs22 \
  --target preview \
  --domain-suffix my-startup.com \
  --ssl
```

1. 自动计算最终域名，例如应用名叫做 `payment-service`，此时域名为
   `payment-service.my-startup.com`。
2. 自动检查阿里云 DNS，增加 CNAME 指向当前你部署的函数。
3. 发现有 `--ssl` 被传递，**优先接管 Let's Encrypt ACME 会话，全自动使用 DNS API
   添加隐藏的 TXT 记录供 ACME
   证明你持有了此域名；如果 Let's Encrypt 命中限额，则自动 fallback 到 ZeroSSL ACME 继续签发，证书下发后再存入阿里云服务器中**。
4. 把所有的清理操作完成，反馈给你一个拥有锁头标志的安全 HTTPS 地址。

如果想要全局生效这个公司后缀配置：您可以设置
`licell config domain my-startup.com` 或者在环境变量中携带
`LICELL_DOMAIN_SUFFIX=my-startup.com`，这样甚至以后连 `--domain-suffix`
这个参数都可以不用手敲！

<!-- BEGIN GENERATED:SCENARIO_DOMAIN_APP_BIND_WORKFLOW -->
> 如果你是通过 Agent / MCP 执行这一步，推荐直接调用下面这条共享 workflow 入口：

1. `licell_domain_app_bind`：为当前应用绑定自定义域名，编排 DNS、FC custom domain 与可选 HTTPS。
<!-- END GENERATED:SCENARIO_DOMAIN_APP_BIND_WORKFLOW -->

## 3. 直接绑定完整独立域名

针对面向核心终端用户的重点应用系统（例如你的主站和博客），你通常不想使用前缀：

```bash
# 直接部署你的静态前端站到 OSS 并绑定根域名
licell deploy \
  --type static \
  --domain www.your-website.com
```

Licell 监测到你是 static (静态站部署) 并且传递了 `--domain` 参数，它默认会
**自动开启 CDN 部署，并将你的 OSS 挂载为 CDN 源站，同时全自动生成 HTTPS 证书** 并下发到 CDN 节点中；默认优先走 Let's Encrypt，命中限额时自动切换到 ZeroSSL ACME。

<!-- BEGIN GENERATED:SCENARIO_DOMAIN_STATIC_BIND_WORKFLOW -->
> 如果你是通过 Agent / MCP 执行这一步，推荐直接调用下面这条共享 workflow 入口：

1. `licell_domain_static_bind`：为静态站点绑定自定义域名，编排 CDN、DNS 与可选 HTTPS。
<!-- END GENERATED:SCENARIO_DOMAIN_STATIC_BIND_WORKFLOW -->

## 4. 强大的域名解绑与纯净模式

想撤下域名不再占用？只需要：

```bash
licell domain app unbind api.my-startup.com
# 或者
licell domain static unbind www.your-website.com
```

只要是 Licell 管辖的域名映射资源，它不仅会解除对 Serverless
实例或静态站点入口的绑定，**还会智能检查并自动在阿里云“云解析 DNS”中清理无用的这条 CNAME
脏数据**。真正把洁癖工程师关心的东西做到闭环。

<!-- BEGIN GENERATED:SCENARIO_DOMAIN_APP_UNBIND_WORKFLOW -->
> 需要下线 API 域名时，推荐走这条 cleanup workflow：

1. `licell_domain_app_unbind`：解绑当前应用域名，并清理 FC custom domain / DNS CNAME。
<!-- END GENERATED:SCENARIO_DOMAIN_APP_UNBIND_WORKFLOW -->

<!-- BEGIN GENERATED:SCENARIO_DOMAIN_STATIC_UNBIND_WORKFLOW -->
> 需要下线静态站点域名时，推荐走这条 cleanup workflow：

1. `licell_domain_static_unbind`：解绑静态站点域名，并清理 CDN domain / DNS CNAME。
<!-- END GENERATED:SCENARIO_DOMAIN_STATIC_UNBIND_WORKFLOW -->

---

**⏭️ 下一步指引：**
在这三篇教程中，我们攻克了计算代码与网络层的挑战。但绝大部分后端都离不开数据库，对吧？继续阅读
[《告别工单：一键创建 Serverless 数据库与缓存》](./04-database-and-cache.md)，看看我们是如何优雅处理基础设施管理的！
