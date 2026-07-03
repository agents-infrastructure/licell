# Feature Spec: ecs-readonly-provider

## 1. Links

- Roadmap item: `ecs-readonly-provider`
- Design: `.codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-design.md`
- Checklist: `.codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-checklist.yaml`
- Design review: `.codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-design-review.md`
- Implementation review: `.codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-review.md`
- QA: `.codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-qa.md`
- Acceptance: `.codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-acceptance.md`

## 2. Dependencies

- Depends on: none
- Must finish before: `ecs-auth-read-permissions`, `ecs-list-command`, `ecs-info-command`, `ecs-filter-contract-tests`

## 3. Type And Core Path

- Type: functional
- Core path: mock ECS SDK `DescribeInstances` / `DescribeInstanceAttribute` behavior through provider tests; no real cloud call required.

## 4. Mandatory Commands

```bash
bun run typecheck
bun x vitest run src/__tests__/ecs-provider.test.ts
python3 .codestable/tools/validate-yaml.py --file .codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-checklist.yaml --yaml-only
```

## 5. Feature DoD

- `createEcsClient(regionId?)`, `listEcsInstances(options?)`, `getEcsInstanceDetail(instanceId, options?)` are implemented behind provider facade.
- Region resolution and endpoint are `ecs.${regionId}.aliyuncs.com`.
- Filters map into ECS request shape and provider proves no post-filter.
- Pagination, truncation, summary normalization, tags, arrays and sensitive-field exclusion are covered.
- Detail not-found throws a token that is classified as `not_found`.
- No command/auth/docs behavior is introduced in this feature.

## 6. Stage Gates

- implementation.before_review: checklist steps all `done`; scope gate shows no command/auth/docs drift.
- review.before_pass: independent review consumes provider tests and request/normalization evidence.
- qa.before_acceptance: QA reruns mandatory commands and validates no real cloud dependency.
- acceptance.before_done: checks all `passed`, roadmap item ready for downstream features.

## 7. Failure Recovery

- SDK field mismatch: fix provider mapping or update approved surface only with handoff if public contract changes.
- Typecheck blocked by missing deps: restore dependencies/lockfile; do not skip typecheck.
- Cloud semantic uncertainty: record residual risk and handoff only if it affects approved CLI surface.

## 8. Evidence Required

- command output
- diff summary
- review report
- QA report
- acceptance report

## 9. Deliverables

- ECS provider source and tests.
- Feature review / QA / acceptance reports.

## 10. Cleanliness

- No debug output, TODO comments, commented code, unused imports.
- No lifecycle mutating ECS API calls.
- No generated docs hand edits.
