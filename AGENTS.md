# AGENTS.md instructions for licell

<INSTRUCTIONS>
## Skills

A skill is a set of local instructions to follow that is stored in a `SKILL.md` file.
Below is the list of skills that can be used. Each entry includes a name, description,
and file path so you can open the source for full instructions when using a specific skill.

### Available skills

- alicloud-alidns: Manage Alibaba Cloud DNS (Alidns) using the `@alicloud/alidns20150109` TypeScript SDK. Use when working with DNS domains, DNS record CRUD (A/AAAA/CNAME/MX/TXT/SRV/CAA/etc.), DNS GTM/traffic management, DNSSEC, Public DNS, and related operations. (file: .claude/skills/alicloud-alidns/SKILL.md)
- aliyun-api-ref: Alibaba Cloud API reference for this repo. Use when adding/modifying Alibaba Cloud provider integrations and API calls, debugging errors, or aligning with project-specific SDK/auth/pagination/retry conventions. (file: .claude/skills/alicloud-api-ref/SKILL.md)
- alicloud-cdn: Manage Alibaba Cloud CDN using the `@alicloud/cdn20180510` TypeScript SDK. Use when working with accelerated domains, domain configuration, SSL, cache refresh/prefetch, monitoring/analytics, logs, and related operations. (file: .claude/skills/alicloud-cdn/SKILL.md)
- alicloud-cr: Manage Alibaba Cloud Container Registry (ACR) Enterprise Edition using the `@alicloud/cr20181201` TypeScript SDK. Use when working with registry instances, namespaces, repos, tags, build rules, sync, scanning, and event notifications. (file: .claude/skills/alicloud-cr/SKILL.md)
- alicloud-ecs: Manage Alibaba Cloud Elastic Compute Service (ECS) using the `@alicloud/ecs20140526` TypeScript SDK. Use when working with instances, disks/snapshots, images, security groups, VPC/EIP/ENI, SSH keys, Cloud Assistant, tags, and system events. (file: .claude/skills/alicloud-ecs/SKILL.md)
- alicloud-fc: Manage Alibaba Cloud Function Compute (FC) 3.0 using the `@alicloud/fc20230330` TypeScript SDK. Use when working with functions, triggers, versions/aliases, async invocation, scaling/concurrency, custom domains, layers, VPC bindings, and tags. (file: .claude/skills/alicloud-fc/SKILL.md)
- alicloud-oss: Manage Alibaba Cloud OSS (Object Storage Service) using the `@alicloud/oss20190517` TypeScript SDK. Use when working with buckets, objects, multipart uploads, lifecycle/versioning/CORS/encryption/replication/WORM, live channels, and static website hosting. (file: .claude/skills/alicloud-oss/SKILL.md)
- alicloud-rds: Manage Alibaba Cloud RDS using the `@alicloud/rds20140815` TypeScript SDK. Use when working with RDS instances (MySQL/PostgreSQL/SQL Server/MariaDB), accounts, databases, backups, security, monitoring, parameters, and tagging. (file: .claude/skills/alicloud-rds/SKILL.md)
- alicloud-redis: Manage Alibaba Cloud Redis (Tair / R-KVStore) using the `@alicloud/r-kvstore20150101` TypeScript SDK. Use when working with Redis/Tair instances, accounts, backups, security, parameters, monitoring, scaling, and tagging. (file: .claude/skills/alicloud-redis/SKILL.md)
- alicloud-vpc: Manage Alibaba Cloud VPC networking using the `@alicloud/vpc20160428` TypeScript SDK. Use when working with VPCs, VSwitches, route tables, EIPs, NAT/VPN gateways, IPv6, flow logs, and related networking operations. (file: .claude/skills/alicloud-vpc/SKILL.md)

### How to use skills

- Discovery: The list above is the skills available in this repo (name + description + file path). Skill bodies live on disk at the listed paths.
- Trigger rules: If the user names a skill (with `$SkillName` or plain text) OR the task clearly matches a skill's description shown above, you must use that skill for that turn. Multiple mentions mean use them all. Do not carry skills across turns unless re-mentioned.
- Missing/blocked: If a named skill isn't in the list or the path can't be read, say so briefly and continue with the best fallback.
- How to use a skill (progressive disclosure):
  1) After deciding to use a skill, open its `SKILL.md`. Read only enough to follow the workflow.
  2) When `SKILL.md` references relative paths (e.g., `scripts/foo.ts`), resolve them relative to the skill directory listed above first, and only consider other paths if needed.
  3) If `SKILL.md` points to extra folders such as `references/`, load only the specific files needed for the request; don't bulk-load everything.
  4) If `scripts/` exist, prefer running or patching them instead of retyping large code blocks.
  5) If `assets/` or templates exist, reuse them instead of recreating from scratch.
- Coordination and sequencing:
  - If multiple skills apply, choose the minimal set that covers the request and state the order you'll use them.
  - Announce which skill(s) you're using and why (one short line). If you skip an obvious skill, say why.
- Context hygiene:
  - Keep context small: summarize long sections instead of pasting them; only load extra files when needed.
  - Avoid deep reference-chasing: prefer opening only files directly linked from `SKILL.md` unless you're blocked.
  - When variants exist (services/SDK versions), pick only the relevant reference file(s) and note that choice.
- Safety and fallback: If a skill can't be applied cleanly (missing files, unclear instructions), state the issue, pick the next-best approach, and continue.
</INSTRUCTIONS>

