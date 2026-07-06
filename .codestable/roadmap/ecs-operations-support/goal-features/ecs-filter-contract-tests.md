# Feature Spec: ecs-filter-contract-tests

## 1. Links

- Roadmap item: `ecs-filter-contract-tests`
- Design: `.codestable/features/2026-07-03-ecs-filter-contract-tests/ecs-filter-contract-tests-design.md`
- Checklist: `.codestable/features/2026-07-03-ecs-filter-contract-tests/ecs-filter-contract-tests-checklist.yaml`
- Design review: `.codestable/features/2026-07-03-ecs-filter-contract-tests/ecs-filter-contract-tests-design-review.md`
- Implementation review: `.codestable/features/2026-07-03-ecs-filter-contract-tests/ecs-filter-contract-tests-review.md`
- QA: `.codestable/features/2026-07-03-ecs-filter-contract-tests/ecs-filter-contract-tests-qa.md`
- Acceptance: `.codestable/features/2026-07-03-ecs-filter-contract-tests/ecs-filter-contract-tests-acceptance.md`

## 2. Dependencies

- Depends on: `ecs-list-command`, `ecs-info-command`
- Must finish before: `ecs-lifecycle-command-scaffold`

## 3. Type And Core Path

- Type: non-functional
- Core path: tests prove existing provider/command contracts; no new user command.

## 4. Mandatory Commands

```bash
bun run typecheck
bun x vitest run src/__tests__/ecs-provider.test.ts src/__tests__/ecs-command.test.ts
bun x vitest run src/__tests__/cli-error.integration.test.ts src/__tests__/cli-help-json-contract.test.ts
python3 .codestable/tools/validate-yaml.py --file .codestable/features/2026-07-03-ecs-filter-contract-tests/ecs-filter-contract-tests-checklist.yaml --yaml-only
```

## 5. Feature DoD

- Provider tests cover request shape and no post-filter.
- Command tests cover CLI options to provider options.
- Error tests cover input and not_found categories through public JSON/error seams.
- JSON payload and sensitive-field whitelist are locked.
- No `ecs-filter-contract.test.ts` is added unless CMD-002 is updated first.
- No production surface change except bug fixes required by tests.

## 6. Stage Gates

- implementation.before_review: checklist steps all `done`; tests fail for real contract drift.
- review.before_pass: independent review checks test value, not just snapshots.
- qa.before_acceptance: QA reruns mandatory commands and confirms no real cloud dependency.
- acceptance.before_done: checks all `passed`, roadmap item ready for docs/lifecycle guard.

## 7. Failure Recovery

- Test discovers real bug: fix in owning previous feature scope and update evidence.
- Provider surface removes unsupported filter: update tests to final approved surface; do not emulate with local filtering.
- New test file desired: update checklist CMD first or handoff.

## 8. Evidence Required

- command output
- diff summary
- review report
- QA report
- acceptance report

## 9. Deliverables

- ECS provider/command/error contract tests.
- Feature review / QA / acceptance reports.

## 10. Cleanliness

- No debug output, TODO comments, commented code, unused imports.
- No new commands, auth/RAM/doctor changes, generated docs hand edits or real cloud calls.
