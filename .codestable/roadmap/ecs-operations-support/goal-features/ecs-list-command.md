# Feature Spec: ecs-list-command

## 1. Links

- Roadmap item: `ecs-list-command`
- Design: `.codestable/features/2026-07-03-ecs-list-command/ecs-list-command-design.md`
- Checklist: `.codestable/features/2026-07-03-ecs-list-command/ecs-list-command-checklist.yaml`
- Design review: `.codestable/features/2026-07-03-ecs-list-command/ecs-list-command-design-review.md`
- Implementation review: `.codestable/features/2026-07-03-ecs-list-command/ecs-list-command-review.md`
- QA: `.codestable/features/2026-07-03-ecs-list-command/ecs-list-command-qa.md`
- Acceptance: `.codestable/features/2026-07-03-ecs-list-command/ecs-list-command-acceptance.md`

## 2. Dependencies

- Depends on: `ecs-readonly-provider`, `ecs-auth-read-permissions`
- Must finish before: `ecs-info-command`, `ecs-filter-contract-tests`, `ecs-command-surface-docs`

## 3. Type And Core Path

- Type: functional
- Core path: mock provider and CLI parser tests prove `licell ecs list --output json` produces expected result and metadata.

## 4. Mandatory Commands

```bash
bun run typecheck
bun x vitest run src/__tests__/ecs-command.test.ts
bun x vitest run src/__tests__/command-registry.test.ts src/__tests__/command-manifest.test.ts src/__tests__/command-surface-metadata.test.ts
bun x vitest run src/__tests__/cli-help-json-contract.test.ts
python3 .codestable/tools/validate-yaml.py --file .codestable/features/2026-07-03-ecs-list-command/ecs-list-command-checklist.yaml --yaml-only
```

## 5. Feature DoD

- Adds `INFRA_SECTION` and ECS command module.
- Registers only `ecs list`; `ecs info` and lifecycle commands stay absent in this feature.
- `ecsCommandModule` is placed after `supaCommandModule` and before `doctorCommandModule`.
- Parses list filters and calls `listEcsInstances(options)`.
- Uses `executeWithAuthRecovery` with `requiredCapabilities=['ecs']`.
- Emits text and JSON result with roadmap payload fields.
- Help/catalog metadata exposes safe safety, preferred JSON output, result fields, options and examples.

## 6. Stage Gates

- implementation.before_review: checklist steps all `done`; section order and no half command evidence present.
- review.before_pass: independent review checks registry order, parser contract and scope.
- qa.before_acceptance: QA reruns mandatory commands and validates JSON/help path.
- acceptance.before_done: checks all `passed`, roadmap item ready for info/docs features.

## 7. Failure Recovery

- Section order wrong: fix registry insertion point, not generated docs.
- Parser option unsupported by provider: handoff if public surface must change.
- Lifecycle half command appears: remove descriptor/registration and rerun surface tests.

## 8. Evidence Required

- command output
- diff summary
- review report
- QA report
- acceptance report

## 9. Deliverables

- ECS command module/list command and tests.
- Feature review / QA / acceptance reports.

## 10. Cleanliness

- No debug output, TODO comments, commented code, unused imports.
- No provider/auth/RAM/doctor mutation beyond approved call sites.
- No generated docs hand edits.
