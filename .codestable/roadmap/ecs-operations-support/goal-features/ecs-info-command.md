# Feature Spec: ecs-info-command

## 1. Links

- Roadmap item: `ecs-info-command`
- Design: `.codestable/features/2026-07-03-ecs-info-command/ecs-info-command-design.md`
- Checklist: `.codestable/features/2026-07-03-ecs-info-command/ecs-info-command-checklist.yaml`
- Design review: `.codestable/features/2026-07-03-ecs-info-command/ecs-info-command-design-review.md`
- Implementation review: `.codestable/features/2026-07-03-ecs-info-command/ecs-info-command-review.md`
- QA: `.codestable/features/2026-07-03-ecs-info-command/ecs-info-command-qa.md`
- Acceptance: `.codestable/features/2026-07-03-ecs-info-command/ecs-info-command-acceptance.md`

## 2. Dependencies

- Depends on: `ecs-readonly-provider`, `ecs-auth-read-permissions`, `ecs-list-command`
- Must finish before: `ecs-filter-contract-tests`, `ecs-command-surface-docs`

## 3. Type And Core Path

- Type: functional
- Core path: mock provider and CLI tests prove `licell ecs info i-xxx --output json`, input error and not-found classification.

## 4. Mandatory Commands

```bash
bun run typecheck
bun x vitest run src/__tests__/ecs-command.test.ts
bun x vitest run src/__tests__/command-registry.test.ts src/__tests__/command-manifest.test.ts src/__tests__/command-surface-metadata.test.ts
bun x vitest run src/__tests__/cli-help-json-contract.test.ts
python3 .codestable/tools/validate-yaml.py --file .codestable/features/2026-07-03-ecs-info-command/ecs-info-command-checklist.yaml --yaml-only
```

## 5. Feature DoD

- Adds `ecs info <instanceId>` to the existing ECS module only.
- Calls `getEcsInstanceDetail(instanceId, { regionId })`.
- Uses `executeWithAuthRecovery` with `requiredCapabilities=['ecs']`.
- JSON result contains `regionId`, `instanceId`, `detail.summary`.
- Empty input is `input`; provider not-found remains `not_found` using clean IDs in tests.
- Text/JSON omit sensitive fields.
- Namespace metadata and examples do not mention lifecycle half commands.

## 6. Stage Gates

- implementation.before_review: checklist steps all `done`; no second ECS module.
- review.before_pass: independent review checks thin command layer and error classification.
- qa.before_acceptance: QA reruns mandatory commands and validates JSON/error paths.
- acceptance.before_done: checks all `passed`, roadmap item ready for filter/docs features.

## 7. Failure Recovery

- Region guidance cannot be produced by current output layer: keep S5 contract to category only, do not add command catch unless design changes.
- Not-found classification polluted by input token: use clean test IDs and record existing output ordering risk.
- Lifecycle half command appears: remove and rerun surface tests.

## 8. Evidence Required

- command output
- diff summary
- review report
- QA report
- acceptance report

## 9. Deliverables

- ECS info command and tests.
- Feature review / QA / acceptance reports.

## 10. Cleanliness

- No debug output, TODO comments, commented code, unused imports.
- No provider/auth/RAM/doctor/generated docs drift.
- No lifecycle command registration.
