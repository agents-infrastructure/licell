# goal 执行的两个坑：机器产物命名 + surface feature 的全量回归

## 背景

跑 `.codestable/roadmap/ecs-lifecycle-operations` 的 `/goal` 执行包（4 个 ECS lifecycle feature，每个走 impl → review → QA → accept + 最终 roadmap 审计）时踩到的两个流程坑，都是到 gate/审计阶段才暴露、返工补齐的。记下来避免下次重蹈。

## 结论

**1. goal 一致性 gate 对每个 feature 要求 5 类机器产物，且文件名固定为 `{slug}-` 前缀。** acceptance 阶段（或至少最终审计前）必须按这套命名生成，否则 `codestable-goal-consistency-gate.py` 直接 blocking。5 个是：

- `{slug}-evidence-pack.md`
- `{slug}-evidence-pack-results.json`
- `{slug}-gate-results.json`
- `{slug}-dod-results.json`
- `{slug}-dod-contract-results.json`

坑点：`codestable-evidence-pack.py` 默认可以输出成别的名字（我一开始写成 `{slug}-evidence.md` + `dod-results.json`），gate 认死 `{slug}-` 前缀，对不上就报 `missing evidence_pack` / `missing dod_results`。另外 `dod-contract-gate` 校验的是 **design 里的 DoD Contract 结构**，必须有 `## DoD Contract` 段 + `Validation Commands`（含 `CMD-` id / `core` / `failure_handling` 关键字）+ 一行 `Required Artifacts: <非空内容>`（ASCII 冒号、同行有值，全角「：」或把内容换行放列表都会判 `non-empty Required Artifacts` 失败）。

**2. 非功能性 / surface 类 feature 的 DoD 命令集必须包含全量回归（`bun run test:ci`），不能只跑自己声明的那几个测试文件。** 否则跨模块的 guard 测试会漏到最终审计的聚合命令阶段才炸。

坑点：surface-harden feature 的 checklist DoD 只列了 help/completion/agent-surface/readme/skill + ecs-lifecycle-command 几个文件，跑全绿就 accept 了。最终审计跑 `bun run test:ci` 时才发现 `command-reference.test.ts` / `command-registry.test.ts` / `command-surface-metadata.test.ts` 这 3 个文件里还有「ECS 只暴露 list/info」的旧 guard 断言没更新，5 个用例挂掉，被迫在审计 repair 阶段补。命令 surface 一改，断言散落在多个未被 feature 显式列出的 guard 文件里，只有全量回归能兜住。

## 证据

- 一致性 gate 产物命名来源：`.codestable/tools/codestable-goal-consistency-gate.py:131-135`
  ```python
  "evidence_pack": feature_dir / f"{feature_slug}-evidence-pack.md",
  "evidence_pack_results": feature_dir / f"{feature_slug}-evidence-pack-results.json",
  "gate_results": feature_dir / f"{feature_slug}-gate-results.json",
  "dod_results": feature_dir / f"{feature_slug}-dod-results.json",
  "dod_contract_results": feature_dir / f"{feature_slug}-dod-contract-results.json",
  ```
- DoD Contract 结构校验：`.codestable/tools/codestable-dod-contract-gate.py:19-21`（`CMD-` / `core`|`核心性` / `failure_handling`|`失败处理`）与 `:57-63`（`Required Artifacts:` 同行 ASCII 冒号后必须有值）。
- 生成 5 类产物的命令模板（本 goal 每 feature 收尾实际用的）：
  ```bash
  F=.codestable/features/2026-07-03-<slug>; S=<slug>
  python3 .codestable/tools/codestable-scope-gate.py --feature-dir $F --allow src/ --allow .codestable/ --json-out $F/$S-gate-results.json --stage acceptance.before_done
  python3 .codestable/tools/codestable-dod-runner.py --checklist $F/$S-checklist.yaml --json-out $F/$S-dod-results.json --stage acceptance.before_done
  python3 .codestable/tools/codestable-dod-contract-gate.py --design $F/$S-design.md --json-out $F/$S-dod-contract-results.json --stage acceptance.before_done
  python3 .codestable/tools/codestable-evidence-pack.py --feature 2026-07-03-$S --design $F/$S-design.md --checklist $F/$S-checklist.yaml --dod-results $F/$S-dod-results.json --gate-results $F/$S-gate-results.json --out $F/$S-evidence-pack.md --json-out $F/$S-evidence-pack-results.json --with-archguard auto --with-meta-cc auto --stage acceptance.before_done
  ```
- 全量回归漏网的 3 个 guard 文件与修复 commit：`cd3fb1e test: update ecs command surface guards for full lifecycle set`（`src/__tests__/command-reference.test.ts` / `command-registry.test.ts` / `command-surface-metadata.test.ts`）。`bun run test:ci` = `vitest run --no-file-parallelism`（package.json），首轮 5 failed / 977 passed，修完 982 passed。
- 审计报告：`.codestable/roadmap/ecs-lifecycle-operations/goal-audit.md` 第 3 节记录了 test:ci 首轮暴露 + repair 全绿的经过。
