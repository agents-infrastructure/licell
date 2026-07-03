# Feature Spec: ecs-lifecycle-command-scaffold

## 1. Links

- Roadmap item: `ecs-lifecycle-command-scaffold`
- Design: `.codestable/features/2026-07-03-ecs-lifecycle-command-scaffold/ecs-lifecycle-command-scaffold-design.md`
- Checklist: `.codestable/features/2026-07-03-ecs-lifecycle-command-scaffold/ecs-lifecycle-command-scaffold-checklist.yaml`
- Design review: `.codestable/features/2026-07-03-ecs-lifecycle-command-scaffold/ecs-lifecycle-command-scaffold-design-review.md`
- Implementation review: `.codestable/features/2026-07-03-ecs-lifecycle-command-scaffold/ecs-lifecycle-command-scaffold-review.md`
- QA: `.codestable/features/2026-07-03-ecs-lifecycle-command-scaffold/ecs-lifecycle-command-scaffold-qa.md`
- Acceptance: `.codestable/features/2026-07-03-ecs-lifecycle-command-scaffold/ecs-lifecycle-command-scaffold-acceptance.md`

## 2. Dependencies

- Depends on: `ecs-filter-contract-tests`, `ecs-command-surface-docs`
- Also requires: `ecs-auth-read-permissions` has landed `CAPABILITY_ACTIONS.ecs` readonly whitelist.

## 3. Type And Core Path

- Type: non-functional
- Core path: seed document exists and negative guards prove current ECS surface/auth remains read-only.

## 4. Mandatory Commands

```bash
bun run typecheck
bun x vitest run src/__tests__/command-reference.test.ts src/__tests__/command-manifest.test.ts src/__tests__/command-surface-metadata.test.ts
bun x vitest run src/__tests__/cli-help-json-contract.test.ts src/__tests__/shell-completion.test.ts
bun x vitest run src/__tests__/auth-recovery.test.ts src/__tests__/ram-bootstrap.test.ts
python3 .codestable/tools/validate-yaml.py --file .codestable/features/2026-07-03-ecs-lifecycle-command-scaffold/ecs-lifecycle-command-scaffold-checklist.yaml --yaml-only
```

## 5. Feature DoD

- `.codestable/roadmap/ecs-operations-support/ecs-lifecycle-command-seeds.md` exists.
- Seed covers phase split, common preflight, safety, confirm, dry-run, precheck, verify and future RAM actions.
- Seed explicitly records delete-specific confirmation helper caveat and confirmFlags auto-collection boundary.
- Current catalog/help/reference/completion expose only `ecs list/info`, not lifecycle half commands.
- `CAPABILITY_ACTIONS.ecs` equals readonly Describe whitelist and bootstrap policy lacks mutating ECS lifecycle actions.
- No production lifecycle command/provider wrapper is added.

## 6. Stage Gates

- implementation.before_review: checklist steps all `done`; diff contains seed/tests only.
- review.before_pass: independent review checks no hidden command, no RAM expansion, and seed usefulness.
- qa.before_acceptance: QA reruns mandatory commands and validates negative guards.
- acceptance.before_done: checks all `passed`, roadmap ready for final audit.

## 7. Failure Recovery

- Missing previous surface: return to dependency feature; do not write guard against undefined capability.
- Lifecycle command leaks: remove registration/descriptor and rerun surface tests.
- Mutating RAM action appears: remove from current epic or handoff for approved scope change.

## 8. Evidence Required

- command output
- diff summary
- seed document
- review report
- QA report
- acceptance report

## 9. Deliverables

- `.codestable/roadmap/ecs-operations-support/ecs-lifecycle-command-seeds.md`
- Negative guard tests.
- Feature review / QA / acceptance reports.

## 10. Cleanliness

- No debug output, TODO comments, commented code, unused imports.
- No production lifecycle command/provider wrapper.
- No generated docs hand edits.
