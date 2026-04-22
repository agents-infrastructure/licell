# Licell — workflow-first Alibaba Cloud deployment CLI for humans and agents.

Licell is not a grab-bag of cloud scripts. It is a workflow-first CLI with one main delivery path (`deploy`), one project state model (`.licell/project.json`), and one shared agent surface (`catalog` / `--help` / `--output json` / skills).

The repo is expected to keep these surfaces aligned:

- Human-facing CLI UX
- Agent-facing structured help and JSON output
- Generated docs and command reference material
- Skill scaffolds and shell completion

When you change command behavior, assume you may also need to update command metadata, tests, and generated docs.

## Reading Order

When starting work in this repository, read in this order:

1. `README.md` — product intent, core workflow, and user-facing behavior.
2. `docs/reference/agent-surfaces.md` — canonical agent flow, JSON contracts, and command surface summary.
3. `src/commands/` — top-level command modules and command metadata.
4. `src/providers/` — Alibaba Cloud provider integrations.
5. `src/utils/` — shared config, output, deploy planning, doctor, and command helpers.
6. Task-specific tests in `src/__tests__/`.

If the task is about one specific cloud product, open the matching skill before reading deep implementation details.

## Working Model

### Prefer the workflow layer first

Most features should preserve the main Licell experience instead of bypassing it.

- Use workflow commands for result-oriented flows: `deploy`, `release`, `domain`, `task`, `doctor`.
- Use resource-level commands only when you need lower-level control or diagnostics: `fn`, `oss`, `dns`, `cache`, `db`, etc.
- Do not introduce a provider-only shortcut if the behavior belongs in the main workflow.

### Treat command metadata as part of the feature

In this repo, commands are expected to be executable and self-describing.

When editing a command in `src/commands/`, also check whether the change should be reflected in:

- command descriptors / examples / option insights
- `licell catalog --output json`
- `licell <command> --help --output json`
- generated docs in `README.md` and `docs/reference/agent-surfaces.md`
- skills or scaffolds derived from the command registry

Do not hand-wave command-surface drift.

### Prefer structured agent flows

For agent-facing automation, the canonical flow is:

1. `licell catalog --output json`
2. `licell <command> --help --output json`
3. `licell <command> --output json`

For streamed JSON output, consume only lines prefixed with `@@LICELL_JSON@@` and then inspect `type=event|result|error`.

If you are unsure about output structure, use `docs/reference/agent-surfaces.md` as the source of truth instead of inferring from console text.

## Repository Map

- `src/cli.ts` — CLI entrypoint and top-level wiring.
- `src/commands/` — command modules, command registry metadata, and workflow entrypoints.
- `src/providers/` — Alibaba Cloud service integrations and deploy/runtime helpers.
- `src/utils/` — config, doctor, output envelopes, deploy planning, auth, and shared helpers.
- `src/__tests__/` — unit, integration, contract, and behavior-locking tests.
- `docs/reference/agent-surfaces.md` — generated agent contract and command surface summary.
- `docs/scenarios/` — higher-level workflow examples.
- `scripts/sync-docs.ts` and `scripts/check-docs.ts` — generated docs sync and drift detection.
- `.claude/skills/` — repo-local skills for Licell workflows and Alibaba Cloud providers.

## Coding Standards

- Keep repo-level guidance here; do not duplicate full command catalogs or API reference tables in this file.
- Preserve the workflow-first mental model: mainline commands orchestrate outcomes, provider code implements cloud interactions.
- Keep command modules thin when possible; push reusable cloud logic into `src/providers/` or focused helpers in `src/utils/`.
- When fixing a bug in a command or provider, prefer adding or extending a characterization test in `src/__tests__/` before or alongside the change.
- When behavior changes affect help text, examples, JSON contracts, or command metadata, update the command descriptor instead of patching generated docs by hand.
- Keep generated surfaces consistent; do not edit generated sections and then forget to sync them.

## Testing and Validation

Run the smallest correct validation set for the change, then expand if the surface is broad.

### Common validation commands

```bash
bun run typecheck
bun run test:ci
bun run docs:check
```

### When to run what

- Code changes: run `bun run typecheck` and the relevant tests; use `bun run test:ci` for normal command/provider changes.
- Command metadata, help, catalog, README-generated sections, or docs-generation changes: run `bun run docs:sync` and then `bun run docs:check`.
- Help / catalog / JSON-contract changes: run the affected tests plus `bun run test:integration` if the change touches CLI help integration behavior.
- Release / install / upgrade / packaging changes: run `bun run build`, and use `bun run e2e:install-upgrade` when changing install or upgrade behavior.
- Strictly documentation-only changes: source-code validation may be skipped, but `bun run docs:check` is still preferred if generated docs or command docs are involved.

If a validation step fails, fix it and rerun. Do not declare success on a known-red tree.

## Docs and Generated Surface Discipline

This repo contains generated or registry-derived documentation. Prefer editing the source of truth, then syncing.

- Command behavior and help live in `src/commands/` metadata.
- Agent contract summary lives in `docs/reference/agent-surfaces.md`.
- README generated blocks are maintained via the docs sync scripts.

When command surface changes, prefer this sequence:

```bash
bun run docs:sync
bun run docs:check
```

Do not manually polish generated output and leave the generator inputs stale.

## Release Discipline

If you are preparing a release or touching release-critical behavior:

- Keep `package.json` and `package-lock.json` versions aligned.
- Validate install / upgrade behavior when touching installer, upgrade flow, or packaged artifact logic.
- Remember that GitHub release assets are produced by `.github/workflows/release.yml`.
- Prefer patch releases for bug fixes unless the change clearly changes behavior or API expectations.

## Skills

Use the minimal set of skills that covers the task. Announce which skill(s) you are using and why in one short line.

### Workflow skill

- `licell` — use first for Licell CLI workflows, deploy/release/task flows, auth/bootstrap behavior, and agent-facing command usage.

### Alibaba Cloud provider skills

Use these when changing a specific provider integration, debugging provider errors, or aligning SDK usage:

- `alicloud-fc` — Function Compute
- `alicloud-oss` — Object Storage Service
- `alicloud-alidns` — DNS / Alidns
- `alicloud-cdn` — CDN
- `alicloud-cr` — ACR / Container Registry
- `alicloud-ecs` — Elastic Compute Service
- `alicloud-rds` — RDS
- `alicloud-redis` — Redis / Tair
- `alicloud-vpc` — VPC networking
- `aliyun-api-ref` — repo-specific Alibaba Cloud API reference and conventions

### Skill usage rules

- If the user names a skill, use it.
- If the task clearly matches a skill's description, use it even if the user did not explicitly name it.
- If multiple skills apply, choose the smallest useful set and use them in a clear order.
- Open the skill's `SKILL.md`, but read only the parts needed for the current task.
- Resolve paths mentioned by a skill relative to that skill's directory first.
- If a skill points to scripts, templates, or assets, prefer using them over recreating the logic manually.
- If a named skill is missing or blocked, say so briefly and continue with the best fallback.

### Available skills

- `licell` — `.claude/skills/licell/SKILL.md`
- `alicloud-alidns` — `.claude/skills/alicloud-alidns/SKILL.md`
- `aliyun-api-ref` — `.claude/skills/alicloud-api-ref/SKILL.md`
- `alicloud-cdn` — `.claude/skills/alicloud-cdn/SKILL.md`
- `alicloud-cr` — `.claude/skills/alicloud-cr/SKILL.md`
- `alicloud-ecs` — `.claude/skills/alicloud-ecs/SKILL.md`
- `alicloud-fc` — `.claude/skills/alicloud-fc/SKILL.md`
- `alicloud-oss` — `.claude/skills/alicloud-oss/SKILL.md`
- `alicloud-rds` — `.claude/skills/alicloud-rds/SKILL.md`
- `alicloud-redis` — `.claude/skills/alicloud-redis/SKILL.md`
- `alicloud-vpc` — `.claude/skills/alicloud-vpc/SKILL.md`

## Progressive Disclosure Rules

Keep context small and load detail only when it becomes necessary.

- Start from repo intent and command surface, not from random provider internals.
- Read the nearest relevant command, provider, test, or skill before opening unrelated files.
- Prefer a narrow, task-shaped reading path over bulk-loading whole directories.
- For unfamiliar Alibaba Cloud behavior, consult the matching provider skill or `aliyun-api-ref` before improvising SDK usage.
- When a task is about contracts or outputs, verify against docs/tests instead of guessing from memory.

## Final Checks Before You Finish

Before concluding work, quickly confirm:

- the implementation matches Licell's workflow-first design
- the relevant tests or validation commands were run
- docs and generated surfaces are not left stale
- the repo is left in a coherent state for the next agent
