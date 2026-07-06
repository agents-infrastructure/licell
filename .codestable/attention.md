# Attention

本文件是 CodeStable 技能启动必读的项目注意事项入口。所有 CodeStable 子技能开始工作前必须读取它。

## 报告语言

CodeStable 所有落盘产出的正文用**中文**：plan / design、plan review / design-review、code review、QA、验收、issue（report / analysis / fix-note）、refactor、roadmap、goal、沉淀（compound）等所有人读报告都用中文表达。机器状态（YAML / JSON / `state.yaml` / frontmatter 字段）保持机读格式不翻译。如需改默认语言，改这一节。

## 项目碎片知识

<!-- cs-note managed: 用 cs-note 维护，新条目按下面分节追加 -->

### 编译与构建

### 运行与本地起服务

### 测试

### 命令与脚本陷阱

- `src/utils/output.ts` 的错误分类会先按整条 message 匹配 input token（如 `invalid`、`无效`、`不支持`），再匹配 not-found。provider/command 的 not-found 文案如果插入用户输入，测试应使用 `i-xxx` 这类干净 ID；若用户输入本身包含 input token，可能被归为 `input` 而不是 `not_found`。

### 路径与目录约定

### 环境变量与凭证

### 其他
