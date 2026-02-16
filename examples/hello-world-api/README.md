# Hello World API (for Aero CLI smoke test)

This is a minimal API app for validating `ali deploy`, `env pull`, `domain add`, and SSL flow.

## 1) Enter this project

```bash
cd /path/to/aero-cli/examples/hello-world-api
```

## 2) Login in this directory

Run login here so Aero CLI writes local project binding to:

- `.ali/project.json`
- 默认 Region 使用 `cn-hangzhou`（回车直接使用默认值）

```bash
ali login
```

If your `ali` is not installed globally yet, from repo root you can use:

```bash
cd /path/to/aero-cli/examples/hello-world-api
../../scripts/ali-tsx.sh login
```

## 3) First deploy (API)

```bash
ali deploy
```

Use fixed domain rule (auto bind `${appName}.your-domain.xyz`) with:

```bash
ali deploy --target preview --domain-suffix your-domain.xyz
```

Enable HTTPS in the same deploy:

```bash
ali deploy --target preview --domain-suffix your-domain.xyz --ssl
```

Force renew certificate (ignore expiry threshold):

```bash
ali deploy --target preview --domain-suffix your-domain.xyz --ssl --ssl-force-renew
```

Default SSL behavior:

- If HTTPS is not enabled: issue a new certificate.
- If HTTPS is enabled: auto-renew only when cert is near expiry (default threshold `30` days).
- You can override threshold via env: `ALI_SSL_RENEW_BEFORE_DAYS=45`.
- DNS challenge now waits by polling TXT propagation (instead of fixed 45s sleep). You can tune timeout via `ALI_SSL_DNS_READY_TIMEOUT_MS` (default `180000`).
- By default challenge verification is enabled; set `ALI_SSL_SKIP_CHALLENGE_VERIFY=1` only when debugging compatibility issues.

CI/non-interactive deploy (no TTY) example:

```bash
ali deploy --type api --entry src/index.ts --target preview --domain-suffix your-domain.xyz --ssl
```

Specify FC runtime explicitly:

```bash
ali deploy --type api --entry src/index.ts --runtime nodejs20 --target preview
```

Use Node 22 custom runtime mode:

```bash
ali deploy --type api --entry src/index.ts --runtime nodejs22 --target preview
```

`nodejs22` here maps to FC `custom.debian12` and starts your handler via a generated bootstrap.
The first deploy may download Linux Node 22 runtime and cache it under `~/.ali-cli/runtimes/node22`.

## 3.1) Provision Serverless DB (optional)

```bash
ali db add
```

Non-interactive / CI style example:

```bash
ali db add \
  --type mysql \
  --engine-version 8.0 \
  --category serverless_basic \
  --class mysql.n2.serverless.1c \
  --storage 20 \
  --storage-type cloud_essd \
  --min-rcu 0.5 \
  --max-rcu 2 \
  --auto-pause on \
  --zone cn-hangzhou-b
```

PostgreSQL 18 basic series example:

```bash
ali db add \
  --type postgres \
  --engine-version 18.0 \
  --category serverless_basic \
  --class pg.n2.serverless.1c \
  --storage 20 \
  --storage-type cloud_essd \
  --min-rcu 0.5 \
  --max-rcu 8 \
  --auto-pause on \
  --zone cn-hangzhou-b
```

Current behavior:

- `postgres` -> RDS Serverless PostgreSQL (`payType=Serverless`, `category=serverless_basic`)
- `mysql` -> RDS Serverless MySQL (`payType=Serverless`, `category=serverless_basic`)
- CLI will auto-select/create VPC/VSwitch in RDS Serverless supported zones.
- CLI will auto-create/check required RDS service linked roles.

If PostgreSQL reports `未查询到可售 POSTGRES Serverless 规格`, it means this region currently has no sellable Serverless PostgreSQL class for your account.
Switch region and retry.

## 3.2) Provision Redis (optional)

```bash
ali cache add --type redis
```

Non-interactive / CI style example:

```bash
ali cache add \
  --type redis \
  --class kvcache.cu.g4b.2 \
  --zone cn-hangzhou-b
```

说明:

- 现在 `cache add` 默认创建 **Tair Serverless KV（Redis 兼容）**。
- 若你已经在控制台创建好实例，可直接绑定（不走创建流程）：

```bash
ali cache add \
  --type redis \
  --instance tt-xxxxxxxx \
  --password 'your-password'
```

- 如果同地域有且仅有一个可用虚拟集群（`tk-`），CLI 会自动探测；否则请显式传 `--vk-name`。
- `--engine-version` / `--node-type` / `--capacity` 属于旧版 Redis 参数，在 Serverless KV 模式下不支持。

When prompted:

- Deploy type: `api`
- Entry file: `src/index.ts` (需要导出 `handler`)
- App name: e.g. `aero-hello-smoke`

## 4) Verify endpoint

After deploy, open the URL returned by CLI. The FC public URL includes a random suffix (not `app.region.fcapp.run`), for example:

```bash
curl -sS "https://<your-app>-<random>.cn-hangzhou.fcapp.run" | jq .
```

## 5) Continue smoke tests

From repo root:

```bash
cd /path/to/aero-cli
ALI_BIN=./scripts/ali-tsx.sh ./scripts/smoke.sh --target preview --expect-key TEST_FLAG --expect-value from-cloud
```

Optional:

```bash
ALI_BIN=./scripts/ali-tsx.sh ./scripts/smoke.sh --target preview --domain api.example.com --with-ssl
```
