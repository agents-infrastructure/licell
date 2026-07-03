# Feature Spec: ecs-auth-read-permissions

## 1. Links

- Roadmap item: `ecs-auth-read-permissions`
- Design: `.codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-design.md`
- Checklist: `.codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-checklist.yaml`
- Design review: `.codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-design-review.md`
- Implementation review: `.codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-review.md`
- QA: `.codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-qa.md`
- Acceptance: `.codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-acceptance.md`

## 2. Dependencies

- Depends on: `ecs-readonly-provider`
- Must finish before: `ecs-list-command`, `ecs-info-command`, `ecs-command-surface-docs`, `ecs-lifecycle-command-scaffold`

## 3. Type And Core Path

- Type: mixed
- Core path: auth recovery and RAM policy tests prove `ecs` capability has only Describe actions; doctor probe test proves optional warn path.

## 4. Mandatory Commands

```bash
bun run typecheck
bun x vitest run src/__tests__/auth-recovery.test.ts src/__tests__/ram-bootstrap.test.ts src/__tests__/doctor-cloud.test.ts
bun x vitest run src/__tests__/doctor-cloud-integration.test.ts
python3 .codestable/tools/validate-yaml.py --file .codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-checklist.yaml --yaml-only
```

## 5. Feature DoD

- `AuthCapability` includes `ecs`, with non-empty label and action hints.
- `resolveAuthCapabilityActions(['ecs'])` returns exactly `ecs:DescribeInstanceAttribute` and `ecs:DescribeInstances`.
- bootstrap policy adds the two Describe actions and keeps existing ECS security-group actions.
- doctor includes ECS as optional, not required, and probes through `listEcsInstances({ limit: 1 })`.
- AccessDenied on optional ECS probe is warn and suggests `licell auth repair`.
- No ECS lifecycle mutating RAM action is added.

## 6. Stage Gates

- implementation.before_review: checklist steps all `done`; scope gate shows no command/docs/lifecycle drift.
- review.before_pass: independent review checks permission minimality and migration semantics.
- qa.before_acceptance: QA reruns mandatory commands and verifies optional warn behavior.
- acceptance.before_done: checks all `passed`, roadmap item ready for command features.

## 7. Failure Recovery

- Missing provider import: return to `ecs-readonly-provider` state or handoff if dependency not implemented.
- RAM/action expansion beyond Describe: remove expansion or handoff for scope change.
- Doctor probe causes required error: fix optional plan/probe classification and rerun review/QA.

## 8. Evidence Required

- command output
- diff summary
- review report
- QA report
- acceptance report

## 9. Deliverables

- auth/RAM/doctor code updates and tests.
- Feature review / QA / acceptance reports.

## 10. Cleanliness

- No debug output, TODO comments, commented code, unused imports.
- No ECS lifecycle mutating action.
- No generated docs hand edits.
