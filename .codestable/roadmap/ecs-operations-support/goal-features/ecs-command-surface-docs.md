# Feature Spec: ecs-command-surface-docs

## 1. Links

- Roadmap item: `ecs-command-surface-docs`
- Design: `.codestable/features/2026-07-03-ecs-command-surface-docs/ecs-command-surface-docs-design.md`
- Checklist: `.codestable/features/2026-07-03-ecs-command-surface-docs/ecs-command-surface-docs-checklist.yaml`
- Design review: `.codestable/features/2026-07-03-ecs-command-surface-docs/ecs-command-surface-docs-design-review.md`
- Implementation review: `.codestable/features/2026-07-03-ecs-command-surface-docs/ecs-command-surface-docs-review.md`
- QA: `.codestable/features/2026-07-03-ecs-command-surface-docs/ecs-command-surface-docs-qa.md`
- Acceptance: `.codestable/features/2026-07-03-ecs-command-surface-docs/ecs-command-surface-docs-acceptance.md`

## 2. Dependencies

- Depends on: `ecs-list-command`, `ecs-info-command`, `ecs-auth-read-permissions`
- Must finish before: `ecs-lifecycle-command-scaffold`

## 3. Type And Core Path

- Type: mixed
- Core path: registry-derived catalog/help/docs/skill/completion all discover ECS list/info and omit lifecycle half commands.

## 4. Mandatory Commands

```bash
bun run typecheck
bun x vitest run src/__tests__/command-reference.test.ts src/__tests__/readme-docs.test.ts src/__tests__/agent-surface-docs.test.ts src/__tests__/skills-scaffold.test.ts
bun x vitest run src/__tests__/command-surface-metadata.test.ts src/__tests__/cli-help-json-contract.test.ts
bun x vitest run src/__tests__/shell-completion.test.ts
bun run docs:sync
bun run docs:check
python3 .codestable/tools/validate-yaml.py --file .codestable/features/2026-07-03-ecs-command-surface-docs/ecs-command-surface-docs-checklist.yaml --yaml-only
```

## 5. Feature DoD

- ECS metadata completeness is verified read-only; missing descriptor metadata returns to list/info feature, not patched here.
- README generated block and agent surface are updated via docs sync.
- skill scaffold and committed `.claude/skills/licell/SKILL.md` stay in sync.
- completion exposes ECS root/subcommands/options.
- Cloud Infrastructure section order is verified.
- lifecycle half commands are absent from catalog/help/docs/test-only skill renderer/completion.

## 6. Stage Gates

- implementation.before_review: checklist steps all `done`; docs generated from source.
- review.before_pass: independent review checks source-of-truth discipline and generated diff.
- qa.before_acceptance: QA reruns mandatory commands including docs check.
- acceptance.before_done: checks all `passed`, roadmap item ready for lifecycle guard.

## 7. Failure Recovery

- Descriptor metadata missing: fix owning list/info feature or handoff; do not patch `ecs.ts` only from docs feature.
- Docs drift: rerun docs sync and docs check.
- Skill scaffold drift: update scaffold and committed skill together, with test.

## 8. Evidence Required

- command output
- diff summary
- docs_sync_output
- docs_check_output
- review report
- QA report
- acceptance report

## 9. Deliverables

- Generated docs updates and source tests.
- Skill scaffold/committed skill sync.
- Feature review / QA / acceptance reports.

## 10. Cleanliness

- No debug output, TODO comments, commented code, unused imports.
- No provider/auth/RAM/doctor behavior change.
- No hand-edited generated docs sections.
