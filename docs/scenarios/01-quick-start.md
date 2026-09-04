# [入门] 5 分钟极速上线：从零部署你的第一个应用

> **目标**：本文将带你体验 Licell
> 的极简部署流。从安装、一键授权，到拥有一个可以通过公网访问的业务
> API，全程只需约 5 分钟。

## 1. 安装 Licell

Licell 提供了一款开箱即用的命令行工具。对于全新的 Mac 或 Linux
机器，可以通过以下一行命令进行极致简单的安装（自动下载由 GitHub Actions
编译的单文件脱水版）：

```bash
npm install -g licell
```

_(不希望依赖 Node.js 时，可改用 GitHub Release 安装脚本；两种全局安装方式不要并存。)_

安装完毕后，在终端中敲入 `licell` 测试是否安装成功。

## 2. 交互式欢迎向导（第一次见面）

当您在没有任何配置的情况下，仅仅敲下 `licell`
敲击回车，您会看到一个友好的中文向导。

```bash
$ licell

👋 欢迎使用 Licell CLI！
检测到您尚未配置登录信息。本向导将协助您完成初始设置。

◇  是否现在配置阿里云登录凭证？(支持全自动高权限转最小权限)
│  Yes
```

我们极度推荐您在这里选择 `Yes`，并使用我们的 **Bootstrap（提权）模式**。

**为什么要用 Bootstrap 模式？** 传统工具通常要求你手动去阿里云控制台进行繁琐的
RAM 操作：建用户、建权限策略、绑定策略、生成 AccessKey，这对新手极度不友好。
而在 Licell 当中，你只需要去阿里云控制台复制一下你最高权限的 AK/SK
提供给向导，Licell 会 **在内存中自动帮你创建一个名为 `licell-operator`
的子用户，赋予刚刚好可以部署 Serverless
应用的最小安全权限，最后将新生成的最小权限凭证保存在本地**。

> 您输入的超级 AK/SK 绝对不会被保存在任何文件中，确保了极致的安全体验。

## 3. 生成你的第一个项目

环境准备就绪，我们来建一个真正的 Node.js 项目（也可以是 Python 或 Docker！）。

```bash
# 创建一个测试目录
mkdir my-first-app && cd my-first-app

# 使用内置的 nodejs22 模板初始化
licell init --runtime nodejs22
```

执行后，当前目录下会生成一个自带 `package.json` 和 `src/index.ts` 的完整 Web
项目骨架（采用 Express 框架）。在这个瞬间，其实代码已经具备响应 HTTP
请求的能力了。

## 4. 一键部署到云端

激动人心的时候到了，我们要把这段代码推送到阿里云 Function Compute 上。

```bash
licell deploy --type api --target preview
```

**发生了什么？**

1. Licell 会自动下载打包你所需的 Node.js 22 运行时。
2. 分析你的源码，帮你创建云端的函数实例（还会自动拉起基础的弹性网络 VPC
   如果你需要的话）。
3. 生成一个类似 `https://preview.my-first-app.xxx.fcapp.run` 的公网测试域名。

几秒钟后，终端中会打印出绿色的成功提示与链接。点击链接，你就能在浏览器中看到你的首个
Serverless 应用成功运行了！

---

**⏭️ 下一步指引：** 在这 5 分钟里，你只使用了你的一双手！在下一篇文章
[《让 AI 为你打工：结合 Cursor / Claude 实现全自动运维》](./02-ai-driven-deployment.md)
中，我们将带你解放双手，让 AI Coding Agent 替代你输入这些命令。
