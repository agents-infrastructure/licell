---
doc_type: feature-evidence-pack
feature: 2026-07-03-ecs-lifecycle-start-reboot
status: generated
---

# 2026-07-03-ecs-lifecycle-start-reboot evidence pack

## 1. Scope

- Design: `.codestable/features/2026-07-03-ecs-lifecycle-start-reboot/ecs-lifecycle-start-reboot-design.md`
- Checklist: `.codestable/features/2026-07-03-ecs-lifecycle-start-reboot/ecs-lifecycle-start-reboot-checklist.yaml`

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
      "stdout": "\n\u001b[1m\u001b[46m RUN \u001b[49m\u001b[22m \u001b[36mv4.0.18 \u001b[39m\u001b[90m/Users/wyattfang/.paseo/worktrees/0tcb78qo/feat-ecs-support\u001b[39m\n\n \u001b[32m✓\u001b[39m src/__tests__/ecs-lifecycle-provider.test.ts \u001b[2m(\u001b[22m\u001b[2m6 tests\u001b[22m\u001b[2m)\u001b[22m\u001b[32m 57\u001b[2mms\u001b[22m\u001b[39m\n \u001b[32m✓\u001b[39m src/__tests__/ecs-lifecycle-command.test.ts \u001b[2m(\u001b[22m\u001b[2m11 tests\u001b[22m\u001b[2m)\u001b[22m\u001b[33m 451\u001b[2mms\u001b[22m\u001b[39m\n     \u001b[33m\u001b[2m✓\u001b[22m\u001b[39m ecs start --dry-run emits plan with willExecute=false and does NOT call startEcsInstance \u001b[33m 433\u001b[2mms\u001b[22m\u001b[39m\n\n\u001b[2m Test Files \u001b[22m \u001b[1m\u001b[32m2 passed\u001b[39m\u001b[22m\u001b[90m (2)\u001b[39m\n\u001b[2m      Tests \u001b[22m \u001b[1m\u001b[32m17 passed\u001b[39m\u001b[22m\u001b[90m (17)\u001b[39m\n\u001b[2m   Start at \u001b[22m 14:44:51\n\u001b[2m   Duration \u001b[22m 615ms\u001b[2m (transform 329ms, setup 0ms, import 133ms, tests 509ms, environment 0ms)\u001b[22m\n\n",
      "stderr": "",
      "id": "CMD-002",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "bun x vitest run src/__tests__/command-manifest.test.ts src/__tests__/cli-help-json-contract.test.ts src/__tests__/shell-completion.test.ts",
      "exit_code": 0,
      "stdout": "\n\u001b[1m\u001b[46m RUN \u001b[49m\u001b[22m \u001b[36mv4.0.18 \u001b[39m\u001b[90m/Users/wyattfang/.paseo/worktrees/0tcb78qo/feat-ecs-support\u001b[39m\n\n \u001b[32m✓\u001b[39m src/__tests__/command-manifest.test.ts \u001b[2m(\u001b[22m\u001b[2m4 tests\u001b[22m\u001b[2m)\u001b[22m\u001b[32m 4\u001b[2mms\u001b[22m\u001b[39m\n \u001b[32m✓\u001b[39m src/__tests__/shell-completion.test.ts \u001b[2m(\u001b[22m\u001b[2m14 tests\u001b[22m\u001b[2m)\u001b[22m\u001b[32m 10\u001b[2mms\u001b[22m\u001b[39m\n \u001b[32m✓\u001b[39m src/__tests__/cli-help-json-contract.test.ts \u001b[2m(\u001b[22m\u001b[2m5 tests\u001b[22m\u001b[2m)\u001b[22m\u001b[33m 6512\u001b[2mms\u001b[22m\u001b[39m\n     \u001b[33m\u001b[2m✓\u001b[22m\u001b[39m keeps ecs namespace help includes start/reboot but excludes stop/delete/rm/run/create \u001b[33m 1652\u001b[2mms\u001b[22m\u001b[39m\n     \u001b[33m\u001b[2m✓\u001b[22m\u001b[39m locks deploy help json contract for task-aware result schema \u001b[33m 1147\u001b[2mms\u001b[22m\u001b[39m\n     \u001b[33m\u001b[2m✓\u001b[22m\u001b[39m locks task list help json contract for task tracking schema \u001b[33m 1131\u001b[2mms\u001b[22m\u001b[39m\n     \u001b[33m\u001b[2m✓\u001b[22m\u001b[39m locks ecs list help json contract for agent discovery \u001b[33m 1324\u001b[2mms\u001b[22m\u001b[39m\n     \u001b[33m\u001b[2m✓\u001b[22m\u001b[39m locks ecs info help json contract for agent discovery \u001b[33m 1141\u001b[2mms\u001b[22m\u001b[39m\n\n\u001b[2m Test Files \u001b[22m \u001b[1m\u001b[32m3 passed\u001b[39m\u001b[22m\u001b[90m (3)\u001b[39m\n\u001b[2m      Tests \u001b[22m \u001b[1m\u001b[32m23 passed\u001b[39m\u001b[22m\u001b[90m (23)\u001b[39m\n\u001b[2m   Start at \u001b[22m 14:44:51\n\u001b[2m   Duration \u001b[22m 6.71s\u001b[2m (transform 1.49s, setup 0ms, import 3.20s, tests 6.53s, environment 0ms)\u001b[22m\n\n",
      "stderr": "",
      "id": "CMD-003",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "bun x vitest run src/__tests__/auth-recovery.test.ts src/__tests__/ram-bootstrap.test.ts",
      "exit_code": 0,
      "stdout": "\n\u001b[1m\u001b[46m RUN \u001b[49m\u001b[22m \u001b[36mv4.0.18 \u001b[39m\u001b[90m/Users/wyattfang/.paseo/worktrees/0tcb78qo/feat-ecs-support\u001b[39m\n\n \u001b[32m✓\u001b[39m src/__tests__/auth-recovery.test.ts \u001b[2m(\u001b[22m\u001b[2m6 tests\u001b[22m\u001b[2m)\u001b[22m\u001b[32m 2\u001b[2mms\u001b[22m\u001b[39m\n \u001b[32m✓\u001b[39m src/__tests__/ram-bootstrap.test.ts \u001b[2m(\u001b[22m\u001b[2m4 tests\u001b[22m\u001b[2m)\u001b[22m\u001b[32m 4\u001b[2mms\u001b[22m\u001b[39m\n\n\u001b[2m Test Files \u001b[22m \u001b[1m\u001b[32m2 passed\u001b[39m\u001b[22m\u001b[90m (2)\u001b[39m\n\u001b[2m      Tests \u001b[22m \u001b[1m\u001b[32m10 passed\u001b[39m\u001b[22m\u001b[90m (10)\u001b[39m\n\u001b[2m   Start at \u001b[22m 14:44:58\n\u001b[2m   Duration \u001b[22m 549ms\u001b[2m (transform 396ms, setup 0ms, import 909ms, tests 6ms, environment 0ms)\u001b[22m\n\n",
      "stderr": "",
      "id": "CMD-004",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "python3 .codestable/tools/validate-yaml.py --file .codestable/features/2026-07-03-ecs-lifecycle-start-reboot/ecs-lifecycle-start-reboot-checklist.yaml --yaml-only",
      "exit_code": 0,
      "stdout": "Validated 1 file(s): 1 passed, 0 failed.\n\n  ✓ .codestable/features/2026-07-03-ecs-lifecycle-start-reboot/ecs-lifecycle-start-reboot-checklist.yaml\n\nAll files valid.\n",
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

Design bytes: 11359
Checklist bytes: 5346

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
        "src/__tests__/auth-recovery.test.ts",
        "src/__tests__/cli-help-json-contract.test.ts",
        "src/__tests__/command-manifest.test.ts",
        "src/__tests__/ram-bootstrap.test.ts",
        "src/__tests__/shell-completion.test.ts",
        "src/commands/ecs.ts",
        "src/providers/ecs.ts",
        "src/providers/ecs/types.ts",
        "src/providers/ram.ts",
        "src/utils/auth-recovery.ts",
        "src/utils/cli-shared.ts",
        ".codestable/features/2026-07-03-ecs-lifecycle-delete/ecs-lifecycle-delete-checklist.yaml",
        ".codestable/features/2026-07-03-ecs-lifecycle-delete/ecs-lifecycle-delete-design-review.md",
        ".codestable/features/2026-07-03-ecs-lifecycle-delete/ecs-lifecycle-delete-design.md",
        ".codestable/features/2026-07-03-ecs-lifecycle-start-reboot/dod-results.json",
        ".codestable/features/2026-07-03-ecs-lifecycle-start-reboot/ecs-lifecycle-start-reboot-acceptance.md",
        ".codestable/features/2026-07-03-ecs-lifecycle-start-reboot/ecs-lifecycle-start-reboot-checklist.yaml",
        ".codestable/features/2026-07-03-ecs-lifecycle-start-reboot/ecs-lifecycle-start-reboot-design-review.md",
        ".codestable/features/2026-07-03-ecs-lifecycle-start-reboot/ecs-lifecycle-start-reboot-design.md",
        ".codestable/features/2026-07-03-ecs-lifecycle-start-reboot/ecs-lifecycle-start-reboot-dod-contract-results.json",
        ".codestable/features/2026-07-03-ecs-lifecycle-start-reboot/ecs-lifecycle-start-reboot-evidence.md",
        ".codestable/features/2026-07-03-ecs-lifecycle-start-reboot/ecs-lifecycle-start-reboot-qa.md",
        ".codestable/features/2026-07-03-ecs-lifecycle-start-reboot/ecs-lifecycle-start-reboot-review.md",
        ".codestable/features/2026-07-03-ecs-lifecycle-stop/ecs-lifecycle-stop-checklist.yaml",
        ".codestable/features/2026-07-03-ecs-lifecycle-stop/ecs-lifecycle-stop-design-review.md",
        ".codestable/features/2026-07-03-ecs-lifecycle-stop/ecs-lifecycle-stop-design.md",
        ".codestable/features/2026-07-03-ecs-lifecycle-surface-harden/ecs-lifecycle-surface-harden-checklist.yaml",
        ".codestable/features/2026-07-03-ecs-lifecycle-surface-harden/ecs-lifecycle-surface-harden-design-review.md",
        ".codestable/features/2026-07-03-ecs-lifecycle-surface-harden/ecs-lifecycle-surface-harden-design.md",
        ".codestable/roadmap/ecs-lifecycle-operations/ecs-lifecycle-operations-items.yaml",
        ".codestable/roadmap/ecs-lifecycle-operations/ecs-lifecycle-operations-roadmap-review.md",
        ".codestable/roadmap/ecs-lifecycle-operations/ecs-lifecycle-operations-roadmap.md",
        ".codestable/roadmap/ecs-lifecycle-operations/goal-features/ecs-lifecycle-delete.md",
        ".codestable/roadmap/ecs-lifecycle-operations/goal-features/ecs-lifecycle-start-reboot.md",
        ".codestable/roadmap/ecs-lifecycle-operations/goal-features/ecs-lifecycle-stop.md",
        ".codestable/roadmap/ecs-lifecycle-operations/goal-features/ecs-lifecycle-surface-harden.md",
        ".codestable/roadmap/ecs-lifecycle-operations/goal-plan.md",
        ".codestable/roadmap/ecs-lifecycle-operations/goal-protocol-audit.md",
        ".codestable/roadmap/ecs-lifecycle-operations/goal-protocol-feature-loop.md",
        ".codestable/roadmap/ecs-lifecycle-operations/goal-protocol-gates.md",
        ".codestable/roadmap/ecs-lifecycle-operations/goal-protocol.md",
        ".codestable/roadmap/ecs-lifecycle-operations/goal-state.yaml",
        "src/__tests__/ecs-lifecycle-command.test.ts",
        "src/__tests__/ecs-lifecycle-provider.test.ts",
        "src/commands/ecs-lifecycle.ts",
        "src/providers/ecs/lifecycle.ts"
      ],
      "ignored_machine_artifacts": [
        ".codestable/features/2026-07-03-ecs-lifecycle-start-reboot/ecs-lifecycle-start-reboot-dod-results.json"
      ],
      "allowed_prefixes": [
        ".codestable/features/2026-07-03-ecs-lifecycle-start-reboot",
        "src/",
        ".codestable/"
      ]
    }
  ],
  "providers": {}
}
```
