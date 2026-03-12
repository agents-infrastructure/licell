# Licell CLI (`licell`)

[中文 README](./README.md)

Licell is an Alibaba Cloud CLI for deployment and operations, designed for both humans and AI agents.

It is not just a bag of cloud commands. It is organized around one primary delivery flow:

- one main entry: `deploy`
- one project state file: `.licell/project.json`
- one set of atomic resource commands: `fn` / `oss` / `dns` / `domain`
- one agent-facing surface: `--help` / `--output json` / `mcp` / `skills`

Default region is `cn-hangzhou`. For agent automation, use a dedicated test account or isolated region instead of sharing a production environment directly. For team sharing, use the team auth distribution workflow described below.

---

## What Licell Is

If you imagine a Vercel-like CLI experience for Alibaba Cloud, that is roughly what Licell aims to be:

- **Human-friendly**: `init -> deploy -> release -> rollback`
- **Agent-friendly**: self-describing commands, structured help, structured output, MCP, and skills
- **Architecture-friendly**: workflow commands produce outcomes, atomic commands expose precise resource control

Licell currently covers:

- FC API deployment and release
- OSS static site deployment
- custom domains, HTTPS, CDN, DNS
- ACR / Docker image deployment
- serverless database and cache helpers
- MCP / skills / JSON output / shared-doc generation for agent automation

---

## Core Design

### 1. Workflow-first

For most cases, start with outcome-oriented commands:

- `licell deploy --type api`
- `licell deploy --type static`
- `licell domain app bind`
- `licell domain static bind`
- `licell release promote`
- `licell release rollback`

These commands are designed to reduce manual orchestration.

### 2. Atomic commands underneath

When you need exact control, drop down to resource-level commands:

- `licell fn domain ...`
- `licell oss domain ...`
- `licell dns records ...`
- `licell oss ...`
- `licell fn ...`

These are better for:

- debugging
- custom automation
- agent plans that need precise, step-by-step control

### 3. One command registry, many surfaces

Licell's latest architecture treats commands as executable and self-describing.

The same shared command metadata drives:

- CLI `--help`
- structured help
- MCP tool catalog
- skills scaffolding
- generated README sections
- agent surface docs
- shell completion

That means command-surface changes can converge across help, MCP, skills, and docs instead of drifting apart.

---

## Installation

### Recommended: install script

```bash
curl -fsSL https://github.com/agents-infrastructure/licell/releases/latest/download/install.sh | bash
```

After installation, run:

```bash
licell
```

Running bare `licell` enters the first-run flow.

### Next step after install: finish auth first

After installation, complete auth first so Licell is ready to use.

If you hold your own AK/SK credentials, run:

```bash
licell login --bootstrap-ram
```

If auth is distributed by your SRE or platform team, run:

```bash
licell auth restore '<token>' '<passkey>' --yes
```

For team usage, see the [Team Auth Distribution](#team-auth-distribution) section below.

### Other install sources and upgrades

- npm global install and GitHub Release binaries are also supported
- for upgrades, run `licell upgrade`
- read the detailed upgrade rules below only when needed

<details>
<summary>Detailed install and upgrade behavior</summary>

- `licell upgrade` follows the current installation source by default
- if Licell was installed globally with `npm` / `pnpm` / `yarn` / `bun`, it will reuse that package manager for upgrade
- if Licell is running from project-local dependencies, `node_modules/.bin/licell`, or a dev-linked checkout, it will not do a global self-upgrade by default
- the install script and standalone binaries come from the same `releases/latest` source; Licell prefers prebuilt single-file executables and falls back to source installation when needed
- passing `--repo` or `--script-url` forces the GitHub Release upgrade path
- use `licell upgrade --dry-run` when you need to inspect the exact plan first

</details>

---

## 3-Minute Quick Start

### For humans

```bash
licell login --region cn-hangzhou
licell init --runtime nodejs22
licell deploy --type api --target preview
```

### For agents / automation

Recommended sequence:

```bash
licell deploy spec nodejs22 --output json
licell deploy check --runtime nodejs22 --entry src/index.ts --output json
licell deploy --type api --runtime nodejs22 --entry src/index.ts --target preview --output json
```

This avoids “deployment succeeded but runtime contract is broken” style failures.

---

## Configuration and State Model

Licell has three main state layers:

| Type | Default location | Purpose |
|------|------------------|---------|
| Global auth | `~/.licell-cli/auth.json` | Alibaba Cloud credentials and default region |
| Project state | `<project>/.licell/project.json` | app name, envs, network, deploy state |
| MCP project config | `<project>/.mcp.json` | MCP discovery for Claude / Codex / Cursor |

Compatibility notes:

- Licell still supports some legacy `~/.ali-cli/*` paths
- current canonical global path is `~/.licell-cli/*`

## Team Auth Distribution

When only a small set of people in a team directly hold high-privilege AK/SK credentials, it is often cleaner to separate “authorization” from “daily usage”:

- the SRE or platform team runs `licell login` on a controlled machine
- then runs `licell auth export <passkey>`
- shares the restore token with other team members
- sends the `passkey` through a separate channel
- other machines run `licell auth restore <token> <passkey>` without doing `login` again

Example:

```bash
# SRE machine
licell login --region cn-hangzhou
licell auth export 'Team-Shared-Passkey'

# team member machine
licell auth restore 'licell-auth-v1....' 'Team-Shared-Passkey' --yes
```

Typical use cases:

- distributing a ready-to-use Licell environment across a team
- enabling contributors who should not directly hold high-privilege credentials
- restoring the same environment on temporary machines, CI debug hosts, or collaboration devices

Usage and security guidance:

- send the `token` and `passkey` separately
- treat the `restore token` as sensitive, even though it is not a plain-text credential
- use a passkey with at least 12 characters
- if a shared bundle should no longer be usable, delete the exported object or create a new export
- after credential rotation, run `login` and `auth export` again instead of reusing older tokens

---

## Agent Interfaces

### 1. Structured help

Licell help is designed for both humans and agents.

```bash
licell --help
licell domain app --help
licell deploy spec --help
licell domain app bind --help --output json
```

Recommended usage:

- humans: normal `--help`
- agents: `--help --output json`

### 2. Structured output with `--output json`

Almost every command except `licell mcp serve` supports structured JSON output:

```bash
licell deploy --type api --output json
licell domain app bind api.example.com --output json
licell oss info my-bucket --output json
```

Typical fields include:

- `stage`
- `type` (`event` / `result` / `error`)
- `error.code`
- `error.category`
- `retryable`
- `provider.requestId`

### 3. MCP

If you want Claude Code, Codex, Cursor, or other agents to call Licell directly as a tool, MCP is the most natural integration path.

#### Recommended: start with setup

```bash
licell setup
licell setup --agent codex
licell setup --agent codex --global
licell setup --agent claude --global
```

#### Initialize MCP in a project

```bash
licell mcp init
```

Typical generated config:

```json
{
  "mcpServers": {
    "licell": {
      "command": "licell",
      "args": ["mcp", "serve"]
    }
  }
}
```

#### Start the MCP server manually

```bash
licell mcp serve
```

Note: `mcp serve` uses stdio JSON-RPC. Do **not** pass `--output json` there.

### 4. Skills

If you want the agent to have a richer task-oriented instruction surface inside the repo, generate skills:

```bash
licell skills init codex
licell skills init claude
licell skills init codex --global
```

By default, `skills init` writes into the current project. Use `--global` only when you explicitly want user-level global skills.

`licell setup` is the interactive wrapper, but it reuses the same underlying skills write flow.

Skills, MCP, help, and docs are meant to stay aligned through the shared command model.

---

## Recommended Workflows

## FC API deployment

```bash
licell deploy spec nodejs22
licell deploy check --runtime nodejs22 --entry src/index.ts
licell deploy --type api --runtime nodejs22 --entry src/index.ts --target preview
```

Common resource tuning:

```bash
licell deploy --type api \
  --runtime nodejs22 \
  --entry src/index.ts \
  --target preview \
  --memory 1024 \
  --vcpu 1 \
  --timeout 60
```

Common domain variants:

```bash
# auto-generate <appName>.<suffix>
licell deploy --type api --runtime nodejs22 --entry src/index.ts --domain-suffix your-domain.xyz --ssl

# full explicit domain
licell deploy --type api --runtime nodejs22 --entry src/index.ts --domain api.your-domain.xyz --ssl
```

Recommended agent sequence:

1. `deploy spec`
2. `deploy check`
3. `deploy`
4. `release promote` / `rollback` when needed

## Static site deployment

```bash
licell deploy --type static --dist dist
```

When you provide a domain, Licell switches into the static-domain workflow:

```bash
licell deploy --type static --dist dist --domain-suffix your-domain.xyz
# or
licell deploy --type static --dist dist --domain static.your-domain.xyz
```

That workflow may include:

- OSS upload
- CDN enablement
- DNS CNAME convergence
- HTTPS issuance and CDN edge cert configuration

## Release, rollback, environments

```bash
licell release list
licell release promote --from preview --to prod
licell rollback
```

If an agent manages both preview and production, it is safer to keep `release` as an explicit second step after deployment instead of letting every deploy mutate production immediately.

---

## Understanding the Domain Model

This is the part that may look “a bit busy” at first glance, but the layering is intentional.

### Workflow layer: outcome-oriented

| Command | Best for | Purpose |
|---------|----------|---------|
| `licell domain app bind` | humans / agents | bind a domain to an FC app, optionally orchestrating DNS / SSL / CDN |
| `licell domain static bind` | humans / agents | bind a domain to a static site, optionally orchestrating CDN / DNS / SSL |
| `licell deploy --type static --domain ...` | humans / agents | get a working static domain outcome directly |

### Atomic layer: resource-oriented

| Command | Purpose |
|---------|---------|
| `licell fn domain ...` | manage FC custom domain bindings |
| `licell oss domain token/bind/unbind` | manage OSS native-domain verification and binding |
| `licell dns records ...` | manage DNS records precisely |

Rule of thumb:

- **want the outcome** -> start with `domain app/static` or `deploy`
- **want exact control** -> drop to `fn domain`, `oss domain`, `dns records`

---

## Examples and Tutorials

### Scenario guides

1. [5-minute first deployment](./docs/scenarios/01-quick-start.md)
2. [Agent-driven deployment](./docs/scenarios/02-ai-driven-deployment.md)
3. [Domains, HTTPS, and CDN](./docs/scenarios/03-domain-and-https.md)
4. [Database and cache workflows](./docs/scenarios/04-database-and-cache.md)
5. [Preview / production environment management](./docs/scenarios/05-environments-and-releases.md)

### Example projects

- `examples/node22-express-api`
- `examples/python313-flask-api`
- `examples/docker-bun-hono-api`
- `examples/static-oss-site`

---

## Testing, CI, and Real-Cloud Validation

Licell verification is split into three layers.

### 1. Default CI

GitHub Actions runs:

- `typecheck`
- generated-doc checks
- stable unit tests and integration-core tests

GitHub Actions does **not** run real cloud resource e2e by default, and does **not** run slow process-level CLI integration tests by default.

### 2. Local integration tests

For real CLI process behavior such as rendered help, flags, and structured output:

```bash
bun run test:integration
```

### 3. Real cloud verification

When you want a pre-release validation pass against real Alibaba Cloud resources:

```bash
licell e2e run
licell e2e run --suite full
licell e2e list
licell e2e cleanup <runId>
```

Notes:

- `e2e run --suite full` covers a broader set of resource CRUD and workflow chains
- these checks are intentionally kept out of default GitHub Actions because they depend on real cloud accounts, domain control, certificate issuance, and external convergence timing

---

## Quick Command Map

Use `licell --help` for the current command surface.

High-value starting points:

```bash
# identity and bootstrap
licell login
licell setup
licell mcp init
licell skills init codex

# deploy safety rails
licell deploy spec nodejs22
licell deploy check --runtime nodejs22 --entry src/index.ts

# deployment
licell deploy --type api --runtime nodejs22 --entry src/index.ts --target preview
licell deploy --type static --dist dist

# workflow domains
licell domain app bind api.example.com --target preview --ssl
licell domain static bind static.example.com --bucket my-bucket --ssl

# atomic resources
licell fn domain list
licell oss domain token my-bucket static.example.com
licell dns records list example.com

# release and cleanup
licell release list
licell release promote --from preview --to prod
licell e2e run --suite full --cleanup
```

---

## Related Docs

- Chinese README: `README.md`
- Agent surface reference: `docs/reference/agent-surfaces.md`
- Scenario guides: `docs/scenarios/`
- Example projects: `examples/`

The easiest way to understand modern Licell is to think of it as an **agent-first deployment runtime on top of Alibaba Cloud**:

- workflow-first
- atomic commands underneath
- self-describing command surface
- convergence across MCP, skills, help, and docs
