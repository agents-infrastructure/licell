---
name: licell
description: >-
  Deploy and manage Alibaba Cloud Serverless applications using the licell CLI.
  Covers deploy, release, functions, env vars, domains, DNS, logs, OSS, database, cache, Supabase, and ECS queries.
metadata:
  author: licell
  version: "1.0"
---

# licell CLI Skill

Use the `licell` CLI as a structured deployment and operations tool for Alibaba Cloud.

## Scope

- This file teaches an agent how to drive `licell` safely.
- It is not the canonical command reference.
- If a detail can be discovered from CLI help or catalog output, prefer the CLI over this file.

## Operating Contract

- Do not guess command names, flags, argument order, or result fields.
- Discover commands with `licell catalog --output json`.
- Read per-command usage with `licell <command> --help --output json`.
- Execute real work with `licell <command> --output json`.
- For streamed output, parse only lines prefixed with `@@LICELL_JSON@@`.
- Prefer structured fields like `nextActions[]`, `result`, `error`, and `details` over human-readable console text.
- If the task is mutating or destructive, inspect help first and follow the command's structured guidance.
- Verify `kind` before trusting a record shape, and then verify `schemaVersion`.
- Do not scrape plain-text terminal output when `--output json` is available.
- Do not assume one command's result shape applies to another; read the command's help contract first.

## Preconditions

- `licell` is installed and on PATH.
- Authentication is configured, usually via `licell login`.
- If the command operates on a project, run it inside the target repo or initialized workspace.

## Canonical Invocation Sequence

```bash
licell catalog --output json
licell <command> --help --output json
licell <command> --output json
```

Use the first command for discovery, the second for contract lookup, and the third for execution.

## Schema Contracts

- Raw CLI JSON output is emitted line-by-line with the `@@LICELL_JSON@@` prefix. Each record currently conforms to `licell-cli-record@1.0`, then branches by `type=event|result|error`.
- For `licell <command> --help --output json`, read `help.kind` and `help.schemaVersion`; the current contract is `licell-help@1.0`.
- For `licell catalog --output json`, read `kind` and `schemaVersion`; the current catalog contract is `licell-agent-command-catalog@1.0`.
- `licell catalog --output json` also declares the help schema and CLI record schema explicitly: `licell-help@1.0` / `licell-cli-record@1.0`.
- Agents should prefer `nextActions[]` as the stable next-step surface; `recommendedFlow`, `decisionGuide`, and `remediation[]` are supporting guidance layers.
- For command-specific business payloads, keep reading the command help/catalog `result` descriptor; the three sections below only describe the shared CLI record envelope.

### CLI Event Record · licell-cli-record@1.0

- Streaming CLI event record for progress tracking, log bridging, and stage-aware automation.
- `kind`: Fixed to `licell-cli-record`.
- `schemaVersion`: CLI record schema version; currently `1.0`.
- `type`: Fixed to `event`.
- `ts`: Event timestamp in ISO 8601 format.
- `command`: Current command key, such as `deploy` or `oss upload`.
- `stage`: Stable stage identifier, such as `deploy`, `deploy.api`, or `auth.restore`.
- `action`: Stable action identifier, such as `run`, `execute`, or `stdout`.
- `status`: `start` / `ok` / `failed` / `skipped` / `info`.
- `source`: `command` / `console` / `stream`.
- `terminal`: Whether this event marks the terminal state of the current action.
- `ok` (optional): Present only on terminal success/failure events; `true` means success and `false` means failure.
- `message` (optional): Human-readable supplemental message.
- `data` (optional): Additional structured context object.
  - `stream` (optional): Stream type when `action=stdout|stderr`.

### CLI Result Record Envelope

- Successful CLI result envelope; command-specific payload fields should still be read from the corresponding help/catalog `result` descriptor.
- `kind`: Fixed to `licell-cli-record`.
- `schemaVersion`: CLI record schema version; currently `1.0`.
- `type`: Fixed to `result`.
- `ts`: Result timestamp in ISO 8601 format.
- `command`: Current command key.
- `stage`: Command stage identifier; usually aligned with the command key or sub-stage.
- `ok`: Fixed to `true`.

### CLI Error Record

- CLI error envelope with compatibility remediation/nextCommands plus the preferred `nextActions` surface.
- `kind`: Fixed to `licell-cli-record`.
- `schemaVersion`: CLI record schema version; currently `1.0`.
- `type`: Fixed to `error`.
- `ts`: Error timestamp in ISO 8601 format.
- `command`: Current command key.
- `stage`: Error stage, such as `parse`, `runtime`, or `deploy`.
- `ok`: Fixed to `false`.
- `error`: Stable error object.
  - `code`: Stable error code, such as `CLI_INVALID_INPUT` or `AUTH_MISSING_CREDENTIAL`.
  - `category`: `auth` / `permission` / `input` / `network` / `quota` / `conflict` / `not_found` / `internal`.
  - `message`: Primary error message.
  - `retryable`: Whether the error is suitable for direct retry.
- `provider` (optional): Alibaba Cloud provider-side context.
  - `service` (optional): Cloud product name, such as `fc`, `oss`, or `alidns`.
  - `action` (optional): Cloud API action name.
  - `code` (optional): Original cloud-side error code.
  - `requestId` (optional): Cloud-side requestId.
  - `httpStatus` (optional): Cloud-side HTTP status code.
  - `endpoint` (optional): Resolved cloud API endpoint.
- `details` (optional): Additional structured error context.
- `remediation[]`: Compatibility remediation suggestions.
  - `type`: Suggestion type, such as `note` or `command`.
  - `title`: Remediation title.
  - `reason`: Why this action is recommended.
  - `commandTemplate`: Suggested command template.
  - `commandKey` (optional): Stable command key when the command can be matched from the CLI registry.
  - `commandDescription` (optional): Matched command description.
  - `phase`: Remediation phase, such as `inspect`, `mutate`, or `verify`.
  - `priority`: `primary` / `secondary`.
  - `order`: Stable sort order.
- `nextCommands[]`: Compatibility command suggestions.
  - `commandTemplate`: Suggested command template.
  - `commandKey` (optional): Stable command key when the command can be matched from the CLI registry.
  - `description` (optional): Command suggestion description.
  - `intent`: Command intent, such as `inspect`, `repair`, or `bind`.
  - `priority`: `primary` / `secondary`.
- `nextActions[]`: Preferred unified next-step suggestions.
  - `title`: Next action title.
  - `description`: Why this action is recommended.
  - `commandTemplate`: Suggested command template.
  - `commandKey` (optional): Stable command key when the command can be matched from the CLI registry.
  - `phase`: Action phase, such as `inspect`, `verify`, or `mutate`.
  - `priority`: `primary` / `secondary`.
  - `source`: Action source, such as `error-remediation`.

- When parsing strictly, match `kind` first and then verify `schemaVersion`; if a higher unknown version appears, fall back to a compatibility path instead of assuming the old shape.
