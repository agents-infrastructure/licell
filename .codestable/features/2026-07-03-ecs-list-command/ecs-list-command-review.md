---
doc_type: feature-review
feature: 2026-07-03-ecs-list-command
status: passed
reviewer: subagent+ocr
reviewed: 2026-07-03
round: 1
---

# ecs-list-command 代码审查报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-03-ecs-list-command/ecs-list-command-design.md`
- Checklist: `.codestable/features/2026-07-03-ecs-list-command/ecs-list-command-checklist.yaml`
- Evidence pack: `.codestable/features/2026-07-03-ecs-list-command/ecs-list-command-evidence-pack.md`
- Gate results: `.codestable/features/2026-07-03-ecs-list-command/ecs-list-command-gate-results.json`
- DoD results: `.codestable/features/2026-07-03-ecs-list-command/ecs-list-command-dod-results.json`
- Implementation evidence: current working tree diff plus DoD runner evidence.
- Independent review: Paseo subagent `de549f6a-24e9-46c1-8ef3-a1cda1155c16` completed.
- OCR review: completed before this report with 0 comments; subagent findings were then locally verified and fixed where valid.

## 2. Diff Summary

- 新增 `src/commands/ecs.ts`，注册 `ecs list` 命令和 ECS namespace descriptor。
- 新增 `INFRA_SECTION`，并在 command manifest 中把 ECS module 放在 `supa` 后、`doctor` 前。
- 新增 `src/__tests__/ecs-command.test.ts`，覆盖 parser、auth recovery、JSON result、文本输出、空态和 input error。
- 扩展 command registry / manifest / surface metadata / help JSON contract tests。
- 生成并刷新本 feature 的 DoD、scope gate、evidence pack 产物。

## 3. Findings

### blocking

none

### important

none

### fixed-during-review

- `--tag key=` 原实现会静默降级为 key-only 查询。按设计第一版收敛为 input error：`parseTagFilters()` 现在要求 tag value 非空，并增加纯函数与 command action 路径测试。
- 文本输出缺少设计约定的 `zone/publicIp/eip` 列。现在非 JSON 输出包含 `instanceId/name/status/type/zone/privateIp/publicIp/eip`。
- `parseTagFilters()` 尾部恒真判空已简化。
- checklist `checks` 已从 `pending` 同步为 `passed`，避免实现证据和状态文件不一致。

### suggestion

- 未来若明确要开放 ECS key-only tag 查询，应作为单独 contract 变更更新设计、help 文案和测试；本 feature 暂不暴露该语义。

## 4. Test And QA Focus

- QA 必须复核 `ecs list` 只调用 `listEcsInstances(options)`，不修改 provider/auth/RAM/doctor。
- QA 必须复核 registry 中只存在 `ecs list`，不存在 `ecs info` 或 start/stop/reboot/delete/rm/runInstances 半成品命令。
- QA 必须复核 `--tag env=`、`--tag missing-separator` 和 `--name + --name-prefix` 都能稳定走 input error。
- QA 必须复核 help/catalog JSON surface 暴露 preferred JSON、safe safety、result fields 和 optionInsights。

## 5. Residual Risk

- 本 feature 使用 mocked provider 验证 command contract，没有对真实 ECS 环境做 live smoke。真实 SDK filter 映射风险由 provider feature 和后续 `ecs-filter-contract-tests` 承担。
- 生成 README / `docs/reference/agent-surfaces.md` 同步按 roadmap 留给 `ecs-command-surface-docs`，本 feature 没有手改 generated docs。

## 6. Verdict

- Status: passed
- Next: enter QA stage for `ecs-list-command`.
