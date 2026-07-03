---
doc_type: feature-evidence-pack
feature: ecs-auth-read-permissions
status: generated
---

# ecs-auth-read-permissions evidence pack

## 1. Scope

- Design: `.codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-design.md`
- Checklist: `.codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-checklist.yaml`

## 2. DoD Results

```json
{
  "gate_id": "dod-runner",
  "stage": "acceptance",
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
      "command": "bun x vitest run src/__tests__/auth-recovery.test.ts src/__tests__/ram-bootstrap.test.ts src/__tests__/doctor-cloud.test.ts",
      "exit_code": 0,
      "stdout": "\n RUN  v4.0.18 /Users/wyattfang/.paseo/worktrees/0tcb78qo/licell-feat-ecs-support\n\n ✓ src/__tests__/auth-recovery.test.ts (6 tests) 3ms\n ✓ src/__tests__/ram-bootstrap.test.ts (4 tests) 7ms\n ✓ src/__tests__/doctor-cloud.test.ts (10 tests) 9ms\n\n Test Files  3 passed (3)\n      Tests  20 passed (20)\n   Start at  15:01:11\n   Duration  1.48s (transform 1.09s, setup 0ms, import 2.60s, tests 19ms, environment 0ms)\n\n",
      "stderr": "",
      "id": "CMD-002",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "bun x vitest run src/__tests__/doctor-cloud-integration.test.ts",
      "exit_code": 0,
      "stdout": "\n RUN  v4.0.18 /Users/wyattfang/.paseo/worktrees/0tcb78qo/licell-feat-ecs-support\n\n ✓ src/__tests__/doctor-cloud-integration.test.ts (2 tests) 16ms\n\n Test Files  1 passed (1)\n      Tests  2 passed (2)\n   Start at  15:01:12\n   Duration  1.63s (transform 868ms, setup 0ms, import 1.53s, tests 16ms, environment 0ms)\n\n",
      "stderr": "",
      "id": "CMD-003",
      "core": false,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "python3 .codestable/tools/validate-yaml.py --file .codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-checklist.yaml --yaml-only",
      "exit_code": 0,
      "stdout": "Validated 1 file(s): 1 passed, 0 failed.\n\n  ✓ .codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-checklist.yaml\n\nAll files valid.\n",
      "stderr": "",
      "id": "CMD-004",
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

Design bytes: 16414
Checklist bytes: 4124

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
  "stage": "acceptance.final",
  "status": "passed",
  "blocking": [],
  "warnings": [],
  "evidence": [
    {
      "changed_files": [
        ".codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-checklist.yaml",
        ".codestable/roadmap/ecs-operations-support/ecs-operations-support-items.yaml",
        ".codestable/roadmap/ecs-operations-support/ecs-operations-support-roadmap.md",
        ".codestable/roadmap/ecs-operations-support/goal-state.yaml",
        "src/__tests__/auth-recovery.test.ts",
        "src/__tests__/doctor-cloud.test.ts",
        "src/__tests__/ram-bootstrap.test.ts",
        "src/providers/doctor-cloud.ts",
        "src/providers/ram.ts",
        "src/utils/auth-recovery.ts",
        ".codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-acceptance.md",
        ".codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-evidence-pack.md",
        ".codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-qa.md",
        ".codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-review.md"
      ],
      "ignored_machine_artifacts": [
        ".codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-dod-results.json",
        ".codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-evidence-pack-results.json",
        ".codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-gate-results.json"
      ],
      "allowed_prefixes": [
        ".codestable/features/2026-07-03-ecs-auth-read-permissions",
        ".codestable/features/2026-07-03-ecs-auth-read-permissions",
        ".codestable/roadmap/ecs-operations-support",
        "src/utils/auth-recovery.ts",
        "src/providers/ram.ts",
        "src/providers/doctor-cloud.ts",
        "src/__tests__/auth-recovery.test.ts",
        "src/__tests__/ram-bootstrap.test.ts",
        "src/__tests__/doctor-cloud.test.ts"
      ]
    }
  ],
  "providers": {}
}
```
