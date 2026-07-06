---
doc_type: feature-evidence-pack
feature: ecs-list-command
status: generated
---

# ecs-list-command evidence pack

## 1. Scope

- Design: `.codestable/features/2026-07-03-ecs-list-command/ecs-list-command-design.md`
- Checklist: `.codestable/features/2026-07-03-ecs-list-command/ecs-list-command-checklist.yaml`

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
      "stdout": "\n RUN  v4.0.18 /Users/wyattfang/.paseo/worktrees/0tcb78qo/licell-feat-ecs-support\n\n ✓ src/__tests__/ecs-command.test.ts (6 tests) 459ms\n     ✓ maps ecs list filters to provider options and emits JSON result  453ms\n\n Test Files  1 passed (1)\n      Tests  6 passed (6)\n   Start at  15:20:07\n   Duration  613ms (transform 248ms, setup 0ms, import 61ms, tests 459ms, environment 0ms)\n\n",
      "stderr": "",
      "id": "CMD-002",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "bun x vitest run src/__tests__/command-registry.test.ts src/__tests__/command-manifest.test.ts src/__tests__/command-surface-metadata.test.ts",
      "exit_code": 0,
      "stdout": "\n RUN  v4.0.18 /Users/wyattfang/.paseo/worktrees/0tcb78qo/licell-feat-ecs-support\n\n ✓ src/__tests__/command-manifest.test.ts (4 tests) 6ms\n ✓ src/__tests__/command-registry.test.ts (6 tests) 12ms\n ✓ src/__tests__/command-surface-metadata.test.ts (6 tests) 10ms\n\n Test Files  3 passed (3)\n      Tests  16 passed (16)\n   Start at  15:20:08\n   Duration  1.96s (transform 2.19s, setup 0ms, import 5.54s, tests 28ms, environment 0ms)\n\n",
      "stderr": "",
      "id": "CMD-003",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "bun x vitest run src/__tests__/cli-help-json-contract.test.ts",
      "exit_code": 0,
      "stdout": "\n RUN  v4.0.18 /Users/wyattfang/.paseo/worktrees/0tcb78qo/licell-feat-ecs-support\n\n ✓ src/__tests__/cli-help-json-contract.test.ts (3 tests) 3721ms\n     ✓ locks deploy help json contract for task-aware result schema  1286ms\n     ✓ locks task list help json contract for task tracking schema  1139ms\n     ✓ locks ecs list help json contract for agent discovery  1199ms\n\n Test Files  1 passed (1)\n      Tests  3 passed (3)\n   Start at  15:20:10\n   Duration  3.87s (transform 48ms, setup 0ms, import 58ms, tests 3.72s, environment 0ms)\n\n",
      "stderr": "",
      "id": "CMD-004",
      "core": false,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "python3 .codestable/tools/validate-yaml.py --file .codestable/features/2026-07-03-ecs-list-command/ecs-list-command-checklist.yaml --yaml-only",
      "exit_code": 0,
      "stdout": "Validated 1 file(s): 1 passed, 0 failed.\n\n  ✓ .codestable/features/2026-07-03-ecs-list-command/ecs-list-command-checklist.yaml\n\nAll files valid.\n",
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

Design bytes: 15949
Checklist bytes: 4654

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
        ".codestable/features/2026-07-03-ecs-list-command/ecs-list-command-checklist.yaml",
        "src/__tests__/cli-help-json-contract.test.ts",
        "src/__tests__/command-manifest.test.ts",
        "src/__tests__/command-registry.test.ts",
        "src/__tests__/command-surface-metadata.test.ts",
        "src/commands/registry.ts",
        "src/commands/sections.ts",
        ".codestable/features/2026-07-03-ecs-list-command/ecs-list-command-evidence-pack.md",
        "src/__tests__/ecs-command.test.ts",
        "src/commands/ecs.ts"
      ],
      "ignored_machine_artifacts": [
        ".codestable/features/2026-07-03-ecs-list-command/ecs-list-command-dod-results.json",
        ".codestable/features/2026-07-03-ecs-list-command/ecs-list-command-evidence-pack-results.json",
        ".codestable/features/2026-07-03-ecs-list-command/ecs-list-command-gate-results.json"
      ],
      "allowed_prefixes": [
        ".codestable/features/2026-07-03-ecs-list-command",
        ".codestable/features/2026-07-03-ecs-list-command",
        "src/commands/ecs.ts",
        "src/commands/sections.ts",
        "src/commands/registry.ts",
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
