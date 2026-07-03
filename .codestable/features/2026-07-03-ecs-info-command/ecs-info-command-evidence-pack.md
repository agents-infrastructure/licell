---
doc_type: feature-evidence-pack
feature: ecs-info-command
status: generated
---

# ecs-info-command evidence pack

## 1. Scope

- Design: `.codestable/features/2026-07-03-ecs-info-command/ecs-info-command-design.md`
- Checklist: `.codestable/features/2026-07-03-ecs-info-command/ecs-info-command-checklist.yaml`

## 2. DoD Results

```json
{
  "gate_id": "dod-runner",
  "stage": "implementation.before_review",
  "status": "passed",
  "blocking": [],
  "warnings": [],
  "evidence": [
    {
      "command": "bun run typecheck",
      "exit_code": 0,
      "stdout": "",
      "stderr": "$ bun x tsc --noEmit\nResolving dependencies\nResolved, downloaded and extracted [2]\nSaved lockfile\n",
      "id": "CMD-001",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "bun x vitest run src/__tests__/ecs-command.test.ts",
      "exit_code": 0,
      "stdout": "\n RUN  v4.0.18 /Users/wyattfang/.paseo/worktrees/0tcb78qo/licell-feat-ecs-support\n\n ✓ src/__tests__/ecs-command.test.ts (10 tests) 440ms\n     ✓ maps ecs list filters to provider options and emits JSON result  426ms\n\n Test Files  1 passed (1)\n      Tests  10 passed (10)\n   Start at  15:35:22\n   Duration  597ms (transform 228ms, setup 0ms, import 63ms, tests 440ms, environment 0ms)\n\n",
      "stderr": "",
      "id": "CMD-002",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "bun x vitest run src/__tests__/command-registry.test.ts src/__tests__/command-manifest.test.ts src/__tests__/command-surface-metadata.test.ts",
      "exit_code": 0,
      "stdout": "\n RUN  v4.0.18 /Users/wyattfang/.paseo/worktrees/0tcb78qo/licell-feat-ecs-support\n\n ✓ src/__tests__/command-manifest.test.ts (4 tests) 6ms\n ✓ src/__tests__/command-registry.test.ts (6 tests) 17ms\n ✓ src/__tests__/command-surface-metadata.test.ts (7 tests) 16ms\n\n Test Files  3 passed (3)\n      Tests  17 passed (17)\n   Start at  15:35:23\n   Duration  1.92s (transform 2.23s, setup 0ms, import 5.38s, tests 38ms, environment 0ms)\n\n",
      "stderr": "",
      "id": "CMD-003",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "bun x vitest run src/__tests__/cli-help-json-contract.test.ts",
      "exit_code": 0,
      "stdout": "\n RUN  v4.0.18 /Users/wyattfang/.paseo/worktrees/0tcb78qo/licell-feat-ecs-support\n\n ✓ src/__tests__/cli-help-json-contract.test.ts (4 tests) 5582ms\n     ✓ locks deploy help json contract for task-aware result schema  1351ms\n     ✓ locks task list help json contract for task tracking schema  1204ms\n     ✓ locks ecs list help json contract for agent discovery  1689ms\n     ✓ locks ecs info help json contract for agent discovery  1235ms\n\n Test Files  1 passed (1)\n      Tests  4 passed (4)\n   Start at  15:35:25\n   Duration  5.73s (transform 48ms, setup 0ms, import 57ms, tests 5.58s, environment 0ms)\n\n",
      "stderr": "",
      "id": "CMD-004",
      "core": false,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "python3 .codestable/tools/validate-yaml.py --file .codestable/features/2026-07-03-ecs-info-command/ecs-info-command-checklist.yaml --yaml-only",
      "exit_code": 0,
      "stdout": "Validated 1 file(s): 1 passed, 0 failed.\n\n  ✓ .codestable/features/2026-07-03-ecs-info-command/ecs-info-command-checklist.yaml\n\nAll files valid.\n",
      "stderr": "",
      "id": "CMD-005",
      "core": false,
      "failure_handling": "fix-or-block"
    }
  ],
  "providers": {}
}
```

## 3. Validation Commands

Extracted from checklist `dod.commands`; see DoD Results for command status.

## 4. Scope And Cleanliness

Design bytes: 14581
Checklist bytes: 4364

## 5. Residual Risks

- none

## 6. Provider Signals

```json
{
  "archguard": {
    "status": "skipped",
    "reason": "archguard collection disabled",
    "warnings": []
  },
  "meta_cc": {
    "status": "skipped",
    "reason": "meta-cc collection disabled",
    "warnings": []
  }
}
```

## 7. Gate Results

```json
{
  "gate_id": "scope-gate",
  "stage": "implementation.before_review",
  "status": "passed",
  "blocking": [],
  "warnings": [],
  "evidence": [
    {
      "changed_files": [
        ".codestable/features/2026-07-03-ecs-info-command/ecs-info-command-checklist.yaml",
        "src/__tests__/cli-help-json-contract.test.ts",
        "src/__tests__/command-manifest.test.ts",
        "src/__tests__/command-registry.test.ts",
        "src/__tests__/command-surface-metadata.test.ts",
        "src/__tests__/ecs-command.test.ts",
        "src/commands/ecs.ts",
        ".codestable/features/2026-07-03-ecs-info-command/ecs-info-command-evidence-pack.md"
      ],
      "ignored_machine_artifacts": [
        ".codestable/features/2026-07-03-ecs-info-command/ecs-info-command-dod-results.json",
        ".codestable/features/2026-07-03-ecs-info-command/ecs-info-command-evidence-pack-results.json",
        ".codestable/features/2026-07-03-ecs-info-command/ecs-info-command-gate-results.json"
      ],
      "allowed_prefixes": [
        ".codestable/features/2026-07-03-ecs-info-command",
        ".codestable/features/2026-07-03-ecs-info-command",
        "src/commands/ecs.ts",
        "src/__tests__/ecs-command.test.ts",
        "src/__tests__/command-registry.test.ts",
        "src/__tests__/command-manifest.test.ts",
        "src/__tests__/command-surface-metadata.test.ts",
        "src/__tests__/cli-help-json-contract.test.ts"
      ]
    }
  ],
  "providers": {}
}
```
