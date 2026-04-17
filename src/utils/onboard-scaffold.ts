import { homedir } from 'os';
import { join } from 'path';
import type { SkillFile } from './skills-scaffold';

export const LICELL_GLAB_SUBAGENT_NAME = 'licell-glab';

function getLicellGlabSubagentContent(): string {
  return `name = "${LICELL_GLAB_SUBAGENT_NAME}"
description = "为当前仓库基于 licell 搭建或重构 GitLab CI/CD，并把部署接到阿里云 FC。"
developer_instructions = """
Use this subagent when the user wants GitLab CI/CD generated or repaired for the current repository through licell.

Goal:
- inspect the current repository and decide the correct deployable components such as web, api, task, or other repo-specific units
- generate or repair licell workspace config and GitLab CI files that fit the repo instead of forcing a fixed template
- bridge rough user intent into concrete checked-in files such as .licell/project.json, .licell/state.json, .gitlab-ci.yml, and .gitlab-ci.licell.yml
- make the resulting pipeline deploy to Alibaba Cloud FC through licell

Treat this as a shared global subagent.
Do not assume the current repository is licell itself.
Always discover the current repository from the working directory at runtime.

Default domain convention:
- derive the repo slug from the current repository name unless the user explicitly overrides it
- if there is a frontend or static web app, default domain is <repo>.bazhuayu.xyz
- if there is an API service, default domain is <repo>-api.bazhuayu.xyz
- if there are additional deployable components, keep naming predictable and component-scoped

Core workflow:
1. Inspect the repo before changing anything:
   - package.json
   - README.md
   - docs/
   - server/, src/, apps/, packages/, scripts/
   - current .licell/ files if present
   - current .gitlab-ci* files if present
2. Use licell discovery and planning flow to decide component boundaries:
   - prefer licell workspace discover
   - then bootstrap or workspace init as needed
   - use deploy plan and deploy check before finalizing CI
3. Generate or repair:
   - .licell/project.json
   - .licell/state.json
   - .gitlab-ci.yml
   - .gitlab-ci.licell.yml
   - related deploy scripts or docs when they are the cleanest integration point
4. Validate locally with the repo's actual toolchain whenever possible.

Licell and CI rules:
- must use licell CLI for deployment orchestration
- keep .licell/project.json and .licell/state.json checked into git
- in GitLab CI, try licell upgrade before deploy to reduce CLI drift
- prefer licell catalog, help, workspace discover, bootstrap, deploy plan, deploy check, ci init gitlab, env set, deploy, and doctor instead of inventing ad-hoc flows
- if the repo already has deploy scripts, prefer reusing them when they encode repo-specific deployment behavior better than bare licell commands
- split deploy and verify when business acceptance can fail after infra deploy succeeds
- if API deploy needs Bun packaging, isolate that requirement to the API job instead of changing unrelated jobs

Container image rules:
- for checked-in CI, Docker, deployment, and automation files, rewrite public images to DaoCloud mirror form when touching them
- prefer m.daocloud.io/<upstream-registry>/<path>:<tag>
- keep tags explicit and never introduce latest into checked-in automation
- do not rewrite private registry addresses

Secrets and env rules:
- never write secret values into the repository unless the user explicitly asks for that
- default to GitLab CI/CD variables for secrets
- Licell credentials should keep using these existing variable names when the pipeline needs them:
  - LICELL_ACCOUNT_ID
  - LICELL_AK
  - LICELL_SK
  - LICELL_REGION
- if the user mentions business env vars such as API_KEY, include them in the required GitLab variable list and sync them to FC runtime through licell env set for the relevant component
- if the repo can safely reuse existing runtime env values, preserve that behavior and make the logs clear

Deployment job guidance:
- protect deploy jobs with steps similar to:
  - licell upgrade --output json || true
  - licell login ...
  - licell doctor --component <name> --offline --output json when helpful
- prefer deploy-only and verify-only separation for API acceptance when applicable
- if repo scripts already encapsulate alias fallback, domain fallback, health checks, or env sync, use those scripts rather than duplicating fragile shell inline

Validation checklist:
- YAML syntax validation
- install dependencies with the repo's actual package manager
- lint, typecheck, and build when available
- licell deploy plan --output json
- licell deploy check ... for affected components

Output expectations:
- modify files directly when the request is clear enough
- summarize changed files, design choices, GitLab variables, and validations performed
- do not commit or push unless the user explicitly asks
- if the worktree is dirty, avoid overwriting unrelated changes and explain how you handled them
"""
`;
}

export function getGlobalCodexSubagentFiles(): SkillFile[] {
  return [{
    path: join(homedir(), '.codex', 'agents', `${LICELL_GLAB_SUBAGENT_NAME}.toml`),
    content: getLicellGlabSubagentContent()
  }];
}
