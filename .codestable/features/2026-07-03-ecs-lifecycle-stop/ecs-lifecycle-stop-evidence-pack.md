---
doc_type: feature-evidence-pack
feature: 2026-07-03-ecs-lifecycle-stop
status: generated
---

# 2026-07-03-ecs-lifecycle-stop evidence pack

## 1. Scope

- Design: `.codestable/features/2026-07-03-ecs-lifecycle-stop/ecs-lifecycle-stop-design.md`
- Checklist: `.codestable/features/2026-07-03-ecs-lifecycle-stop/ecs-lifecycle-stop-checklist.yaml`

## 2. DoD Results

```json
{
  "gate_id": "dod-runner",
  "stage": "acceptance.before_done",
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
      "command": "bun x vitest run src/__tests__/ecs-lifecycle-command.test.ts src/__tests__/ecs-lifecycle-provider.test.ts",
      "exit_code": 0,
      "stdout": "\n\u001b[1m\u001b[46m RUN \u001b[49m\u001b[22m \u001b[36mv4.0.18 \u001b[39m\u001b[90m/Users/wyattfang/.paseo/worktrees/0tcb78qo/feat-ecs-support\u001b[39m\n\n \u001b[32m✓\u001b[39m src/__tests__/ecs-lifecycle-provider.test.ts \u001b[2m(\u001b[22m\u001b[2m8 tests\u001b[22m\u001b[2m)\u001b[22m\u001b[32m 55\u001b[2mms\u001b[22m\u001b[39m\n \u001b[32m✓\u001b[39m src/__tests__/ecs-lifecycle-command.test.ts \u001b[2m(\u001b[22m\u001b[2m17 tests\u001b[22m\u001b[2m)\u001b[22m\u001b[33m 435\u001b[2mms\u001b[22m\u001b[39m\n     \u001b[33m\u001b[2m✓\u001b[22m\u001b[39m ecs start --dry-run emits plan with willExecute=false and does NOT call startEcsInstance \u001b[33m 411\u001b[2mms\u001b[22m\u001b[39m\n\n\u001b[2m Test Files \u001b[22m \u001b[1m\u001b[32m2 passed\u001b[39m\u001b[22m\u001b[90m (2)\u001b[39m\n\u001b[2m      Tests \u001b[22m \u001b[1m\u001b[32m25 passed\u001b[39m\u001b[22m\u001b[90m (25)\u001b[39m\n\u001b[2m   Start at \u001b[22m 15:01:07\n\u001b[2m   Duration \u001b[22m 600ms\u001b[2m (transform 327ms, setup 0ms, import 137ms, tests 490ms, environment 0ms)\u001b[22m\n\n",
      "stderr": "",
      "id": "CMD-002",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "bun x vitest run src/__tests__/command-manifest.test.ts src/__tests__/cli-help-json-contract.test.ts src/__tests__/shell-completion.test.ts",
      "exit_code": 0,
      "stdout": "\n\u001b[1m\u001b[46m RUN \u001b[49m\u001b[22m \u001b[36mv4.0.18 \u001b[39m\u001b[90m/Users/wyattfang/.paseo/worktrees/0tcb78qo/feat-ecs-support\u001b[39m\n\n \u001b[32m✓\u001b[39m src/__tests__/command-manifest.test.ts \u001b[2m(\u001b[22m\u001b[2m4 tests\u001b[22m\u001b[2m)\u001b[22m\u001b[32m 3\u001b[2mms\u001b[22m\u001b[39m\n \u001b[32m✓\u001b[39m src/__tests__/shell-completion.test.ts \u001b[2m(\u001b[22m\u001b[2m14 tests\u001b[22m\u001b[2m)\u001b[22m\u001b[32m 14\u001b[2mms\u001b[22m\u001b[39m\n \u001b[32m✓\u001b[39m src/__tests__/cli-help-json-contract.test.ts \u001b[2m(\u001b[22m\u001b[2m5 tests\u001b[22m\u001b[2m)\u001b[22m\u001b[33m 6341\u001b[2mms\u001b[22m\u001b[39m\n     \u001b[33m\u001b[2m✓\u001b[22m\u001b[39m keeps ecs namespace help includes start/reboot/stop but excludes delete/rm/run/create \u001b[33m 1575\u001b[2mms\u001b[22m\u001b[39m\n     \u001b[33m\u001b[2m✓\u001b[22m\u001b[39m locks deploy help json contract for task-aware result schema \u001b[33m 1182\u001b[2mms\u001b[22m\u001b[39m\n     \u001b[33m\u001b[2m✓\u001b[22m\u001b[39m locks task list help json contract for task tracking schema \u001b[33m 1147\u001b[2mms\u001b[22m\u001b[39m\n     \u001b[33m\u001b[2m✓\u001b[22m\u001b[39m locks ecs list help json contract for agent discovery \u001b[33m 1186\u001b[2mms\u001b[22m\u001b[39m\n     \u001b[33m\u001b[2m✓\u001b[22m\u001b[39m locks ecs info help json contract for agent discovery \u001b[33m 1148\u001b[2mms\u001b[22m\u001b[39m\n\n\u001b[2m Test Files \u001b[22m \u001b[1m\u001b[32m3 passed\u001b[39m\u001b[22m\u001b[90m (3)\u001b[39m\n\u001b[2m      Tests \u001b[22m \u001b[1m\u001b[32m23 passed\u001b[39m\u001b[22m\u001b[90m (23)\u001b[39m\n\u001b[2m   Start at \u001b[22m 15:01:07\n\u001b[2m   Duration \u001b[22m 6.51s\u001b[2m (transform 1.47s, setup 0ms, import 3.06s, tests 6.36s, environment 0ms)\u001b[22m\n\n",
      "stderr": "",
      "id": "CMD-003",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "bun x vitest run src/__tests__/auth-recovery.test.ts src/__tests__/ram-bootstrap.test.ts",
      "exit_code": 0,
      "stdout": "\n\u001b[1m\u001b[46m RUN \u001b[49m\u001b[22m \u001b[36mv4.0.18 \u001b[39m\u001b[90m/Users/wyattfang/.paseo/worktrees/0tcb78qo/feat-ecs-support\u001b[39m\n\n \u001b[32m✓\u001b[39m src/__tests__/auth-recovery.test.ts \u001b[2m(\u001b[22m\u001b[2m6 tests\u001b[22m\u001b[2m)\u001b[22m\u001b[32m 3\u001b[2mms\u001b[22m\u001b[39m\n \u001b[32m✓\u001b[39m src/__tests__/ram-bootstrap.test.ts \u001b[2m(\u001b[22m\u001b[2m4 tests\u001b[22m\u001b[2m)\u001b[22m\u001b[32m 5\u001b[2mms\u001b[22m\u001b[39m\n\n\u001b[2m Test Files \u001b[22m \u001b[1m\u001b[32m2 passed\u001b[39m\u001b[22m\u001b[90m (2)\u001b[39m\n\u001b[2m      Tests \u001b[22m \u001b[1m\u001b[32m10 passed\u001b[39m\u001b[22m\u001b[90m (10)\u001b[39m\n\u001b[2m   Start at \u001b[22m 15:01:14\n\u001b[2m   Duration \u001b[22m 534ms\u001b[2m (transform 372ms, setup 0ms, import 876ms, tests 7ms, environment 0ms)\u001b[22m\n\n",
      "stderr": "",
      "id": "CMD-004",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "python3 .codestable/tools/validate-yaml.py --file .codestable/features/2026-07-03-ecs-lifecycle-stop/ecs-lifecycle-stop-checklist.yaml --yaml-only",
      "exit_code": 0,
      "stdout": "Validated 1 file(s): 1 passed, 0 failed.\n\n  ✓ .codestable/features/2026-07-03-ecs-lifecycle-stop/ecs-lifecycle-stop-checklist.yaml\n\nAll files valid.\n",
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

Design bytes: 6550
Checklist bytes: 3841

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
  "stage": "acceptance.before_done",
  "status": "passed",
  "blocking": [],
  "warnings": [],
  "evidence": [
    {
      "changed_files": [
        ".codestable/features/2026-07-03-ecs-lifecycle-stop/ecs-lifecycle-stop-checklist.yaml",
        ".codestable/features/2026-07-03-ecs-lifecycle-stop/ecs-lifecycle-stop-design.md",
        "src/__tests__/auth-recovery.test.ts",
        "src/__tests__/cli-help-json-contract.test.ts",
        "src/__tests__/command-manifest.test.ts",
        "src/__tests__/ecs-lifecycle-command.test.ts",
        "src/__tests__/ecs-lifecycle-provider.test.ts",
        "src/__tests__/ram-bootstrap.test.ts",
        "src/__tests__/shell-completion.test.ts",
        "src/commands/ecs-lifecycle.ts",
        "src/commands/ecs.ts",
        "src/providers/ecs.ts",
        "src/providers/ecs/lifecycle.ts",
        "src/providers/ram.ts",
        "src/utils/auth-recovery.ts",
        ".codestable/features/2026-07-03-ecs-lifecycle-stop/ecs-lifecycle-stop-acceptance.md",
        ".codestable/features/2026-07-03-ecs-lifecycle-stop/ecs-lifecycle-stop-dod-contract-results.json",
        ".codestable/features/2026-07-03-ecs-lifecycle-stop/ecs-lifecycle-stop-evidence-pack.md",
        ".codestable/features/2026-07-03-ecs-lifecycle-stop/ecs-lifecycle-stop-qa.md",
        ".codestable/features/2026-07-03-ecs-lifecycle-stop/ecs-lifecycle-stop-review.md"
      ],
      "ignored_machine_artifacts": [
        ".codestable/features/2026-07-03-ecs-lifecycle-stop/ecs-lifecycle-stop-dod-results.json",
        ".codestable/features/2026-07-03-ecs-lifecycle-stop/ecs-lifecycle-stop-evidence-pack-results.json",
        ".codestable/features/2026-07-03-ecs-lifecycle-stop/ecs-lifecycle-stop-gate-results.json"
      ],
      "allowed_prefixes": [
        ".codestable/features/2026-07-03-ecs-lifecycle-stop",
        "src/",
        ".codestable/"
      ]
    }
  ],
  "providers": {}
}
```
