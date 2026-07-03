---
doc_type: feature-evidence-pack
feature: ecs-readonly-provider
status: generated
---

# ecs-readonly-provider evidence pack

## 1. Scope

- Design: `.codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-design.md`
- Checklist: `.codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-checklist.yaml`

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
      "command": "bun x vitest run src/__tests__/ecs-provider.test.ts",
      "exit_code": 0,
      "stdout": "\n RUN  v4.0.18 /Users/wyattfang/.paseo/worktrees/0tcb78qo/licell-feat-ecs-support\n\n ✓ src/__tests__/ecs-provider.test.ts (9 tests) 50ms\n\n Test Files  1 passed (1)\n      Tests  9 passed (9)\n   Start at  14:39:59\n   Duration  208ms (transform 97ms, setup 0ms, import 65ms, tests 50ms, environment 0ms)\n\n",
      "stderr": "",
      "id": "CMD-002",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "python3 .codestable/tools/validate-yaml.py --file .codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-checklist.yaml --yaml-only",
      "exit_code": 0,
      "stdout": "Validated 1 file(s): 1 passed, 0 failed.\n\n  ✓ .codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-checklist.yaml\n\nAll files valid.\n",
      "stderr": "",
      "id": "CMD-003",
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

Design bytes: 18610
Checklist bytes: 4225

## 5. Residual Risks

- none

## 6. Provider Signals

```json
{
  "archguard": {
    "status": "available",
    "signal_type": "availability",
    "summary": "archguard binary found at /opt/homebrew/bin/archguard; risk summary not collected in this minimal mode",
    "warnings": [
      "archguard available but risk summary not collected"
    ]
  },
  "meta_cc": {
    "status": "unavailable",
    "reason": "meta-cc summary not found; realtime session collection is out of scope",
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
        ".codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-checklist.yaml",
        ".codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-design-review.md",
        ".codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-design.md",
        ".codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-evidence-pack.md",
        "src/__tests__/ecs-provider.test.ts",
        "src/providers/ecs.ts",
        "src/providers/ecs/client.ts",
        "src/providers/ecs/query.ts",
        "src/providers/ecs/types.ts"
      ],
      "ignored_machine_artifacts": [
        ".codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-dod-results.json",
        ".codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-evidence-pack-results.json",
        ".codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-gate-results.json"
      ],
      "allowed_prefixes": [
        ".codestable/features/2026-07-03-ecs-readonly-provider",
        "src/providers/ecs.ts",
        "src/providers/ecs/",
        "src/__tests__/ecs-provider.test.ts"
      ]
    }
  ],
  "providers": {}
}
```
