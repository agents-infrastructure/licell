# [核心] 让 AI 为你打工：结合 Cursor / Claude 实现全自动运维

> **目标**：在上一篇教程中，我们展示了使用命令行一键部署的顺畅体验。本篇我们将进一步颠覆传统开发和运维流程，向你展示
> Licell 核心竞争力：结合 **AI Coding Agent** (Cursor、Claude Code 或 CLI Tools)
> 实现全自动应用上云与管理。

## 1. 为什么将 AI 引入部署？

在现代 Web
开发中，写代码可能只是最轻松的一环；繁琐的是**配置环境、调试网络平面、分配 CPU
和数据库内存等**。 Licell 的初衷就是打造一个“懂 AI 的部署
CLI”。我们内置了业界领先的 **MCP (Model Context Protocol)** 支持与 **AI Skills
生成系统**，让 AI 能实时读取阿里云环境，并代你行使复杂的云端能力。 你可以简单对
Cursor/Claude 说：“帮我把当前这个项目发布到生产环境（prod），记得申请 SSL
证书。” AI 会自动调用 Licell 为你把一切事情安排妥当！

## 2. 一键让 Agent 认识 Licell（Skills 与 MCP）

当你完成了首次登录之后，Licell
的欢迎向导应该询问了你是否要进行第二阶段的配置：**AI 技能与 MCP
配置**。如果当时跳过了，你随时可以运行：

```bash
licell setup
```

向导将带你分别配置以下两个核心能力：

### 2.1 注入 AI Skills (让 AI 理解命令)

向导会自动在全局生成一个高度浓缩且系统化的结构化文件（例如给 Claude 的
`.claude/skills/licell/SKILL.md`，或给 Cursor 的一份文档）。 当你在 Agent
中与之对话时，由于系统提示词被注入了这些 **"Skills"**，AI
不会瞎编乱造或者去爬取旧的网络数据，它会精准地知道
`"licell deploy --target preview"` 以及各种 API 参数的功能和可用性！

### 2.2 配置 MCP (让 AI 执行命令)

配置完成后，在项目或全局配置里将生成一段 MCP Server 连接协议。例如（Claude Code
中的 `~/.claude/settings.local.json`）。

```json
{
    "mcpServers": {
        "licell": {
            "command": "licell",
            "args": ["mcp", "serve"]
        }
    }
}
```

此时你的 Claude Code/Cursor 端点被唤醒后，AI
就**具备了读取和调用阿里云底层函数的能力**。

## 3. 面向 AI 的工程预检机制

作为资深的工程师，我们知道 AI
很容易写错一个小配置导致部署崩溃，调试云上环境费时费力。Licell 提供了一个面向 AI
的极其友好的命令对峙环境：

如果 AI 不确定当前代码能否运行，它能主动调用我们提供的 MCP Tool：

<!-- BEGIN GENERATED:SCENARIO_AI_PRECHECK_WORKFLOW -->
1. `licell_fc_deploy_spec`：读取 FC API runtime 的 entry / handler / 资源约束，帮助 Agent 先理解限制与签名模板。
2. `licell_fc_deploy_check`：只读预检当前项目，提前发现 handler、入口文件或 Docker 环境问题，并给出可执行修复建议。
<!-- END GENERATED:SCENARIO_AI_PRECHECK_WORKFLOW -->

## 4. 典型场景体验对话

配置完这一切，打开您的 IDE / Claude Code：

**你：**

> “帮我检查一下当前目录是否满足 Node.js 22
> 的函数计算规则要求，如果少什么文件请补充完整。”

**AI 的动作：** 执行内部调用
`licell deploy check --runtime nodejs22 --entry index.js` -> 发现报错 ->
分析输出日志 -> 对项目补齐或重构 -> 修复报错。

**你：**

> “然后帮我一键部署上去，生成预览地址给我。同时为我增加 1G 的函数并发内存。”

**AI 的动作：** 执行 `licell deploy --type api --target preview --memory 1024`
-> 推送镜像/代码包 -> 反馈 HTTPS 链接给你。

---

**⏭️ 下一步指引：** 在
[《告别繁琐控制台：一行命令搞定自定义域名与 HTTPS》](./03-domain-and-https.md)
中，我们将探索如何用 Licell 管理你的生产级别网络入口。
