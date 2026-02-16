#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

TARGET="preview"
EXPECT_KEY="TEST_FLAG"
EXPECT_VALUE="from-cloud"
DOMAIN=""
REDIS_INSTANCE_ID=""
DIST_DIR="dist"
WITH_SSL=0
WITH_OSS=0
WITH_REDIS_ROTATE=0
YES=0

PASS_COUNT=0
SKIP_COUNT=0

log() {
  echo "[smoke] $*"
}

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  log "PASS: $*"
}

skip() {
  SKIP_COUNT=$((SKIP_COUNT + 1))
  log "SKIP: $*"
}

fail() {
  log "FAIL: $*"
  exit 1
}

usage() {
  cat <<'EOF'
Usage:
  scripts/smoke.sh [options]

Options:
  --target <alias>                Alias used by env/domain checks (default: preview)
  --expect-key <key>              Expected env key after env pull (default: TEST_FLAG)
  --expect-value <value>          Expected env value after env pull (default: from-cloud)
  --domain <domain>               Domain for DNS/SSL tests (optional)
  --redis-instance <instanceId>   Redis instance id for rotate-password check
  --dist <dir>                    Dist directory for OSS test (default: dist)
  --with-ssl                      Run SSL issuance check (requires --domain)
  --with-oss                      Run OSS deploy check
  --with-redis-rotate             Run Redis rotate-password masking check
  --yes                           Non-interactive mode for confirmations
  -h, --help                      Show this help

Env overrides:
  LICELL_BIN=/path/to/licell      Use compiled licell binary instead of bun run
  ALI_BIN=/path/to/ali            Legacy alias for LICELL_BIN

Examples:
  scripts/smoke.sh --target preview --expect-key TEST_FLAG --expect-value from-cloud
  scripts/smoke.sh --domain api.example.com --with-ssl --target preview
EOF
}

confirm() {
  local message="$1"
  if [[ "$YES" -eq 1 ]]; then
    return 0
  fi
  echo
  read -r -p "[smoke] $message [y/N] " answer
  case "$answer" in
    y|Y|yes|YES) return 0 ;;
    *) return 1 ;;
  esac
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "missing required command: $1"
}

run_cli() {
  local cli_bin="${LICELL_BIN:-${ALI_BIN:-}}"
  if [[ -n "$cli_bin" ]]; then
    "$cli_bin" "$@"
    return
  fi
  if [[ -x "./licell" ]]; then
    ./licell "$@"
    return
  fi
  if [[ -x "./ali" ]]; then
    ./ali "$@"
    return
  fi
  bun run src/cli.ts -- "$@"
}

get_project_app_name() {
  node -e "const fs=require('fs');for(const path of ['.licell/project.json','.ali/project.json']){try{const p=JSON.parse(fs.readFileSync(path,'utf8'));if(p.appName){process.stdout.write(String(p.appName));break;}}catch{}}"
}

get_auth_fc_endpoint() {
  node -e "const fs=require('fs');const os=require('os');const path=require('path');for(const dir of ['.licell-cli','.ali-cli']){try{const p=JSON.parse(fs.readFileSync(path.join(os.homedir(),dir,'auth.json'),'utf8'));if(p.accountId&&p.region){process.stdout.write(String(p.accountId)+'.'+String(p.region)+'.fc.aliyuncs.com');break;}}catch{}}"
}

get_project_redis_instance() {
  node -e "const fs=require('fs');for(const path of ['.licell/project.json','.ali/project.json']){try{const p=JSON.parse(fs.readFileSync(path,'utf8'));if(p.cache&&p.cache.instanceId){process.stdout.write(String(p.cache.instanceId));break;}}catch{}}"
}

wait_for_cname() {
  local domain="$1"
  local expected="$2"
  local attempt
  for attempt in $(seq 1 18); do
    local cname
    cname="$(dig +short CNAME "$domain" | tail -n 1 | sed 's/\.$//')"
    if [[ "$cname" == "$expected" ]]; then
      return 0
    fi
    sleep 10
  done
  return 1
}

check_env_pull() {
  log "Step 1/6: env pull cloud sync"
  if ! confirm "请先在 FC(${TARGET}) 上设置 ${EXPECT_KEY}=${EXPECT_VALUE}，然后继续"; then
    skip "env pull cloud sync"
    return
  fi

  run_cli "env pull" --target "$TARGET"

  [[ -f .env ]] || fail ".env not generated"
  local expected_line="${EXPECT_KEY}=\"${EXPECT_VALUE}\""
  if grep -Fqx "$expected_line" .env; then
    pass "env pull fetched expected key/value"
  else
    echo
    log "Current .env:"
    cat .env
    fail "expected line not found: $expected_line"
  fi
}

check_env_clear() {
  log "Step 2/6: env pull clears local residue"
  if ! confirm "请先清空 FC(${TARGET}) 环境变量，然后继续"; then
    skip "env pull clears local residue"
    return
  fi

  run_cli "env pull" --target "$TARGET"
  [[ -f .env ]] || fail ".env should exist even when cloud env is empty"
  if [[ ! -s .env ]]; then
    pass "empty cloud env clears local .env"
  else
    echo
    log "Current .env:"
    cat .env
    fail ".env should be empty after pulling empty cloud env"
  fi
}

check_path_guard() {
  log "Step 3/6: deploy entry path guard"

  if [[ ! -f "$HOME/.licell-cli/auth.json" && ! -f "$HOME/.ali-cli/auth.json" ]]; then
    skip "path guard requires licell login first"
    return
  fi

  local outside_file="/tmp/licell-smoke-outside-entry.ts"
  cat >"$outside_file" <<'EOF'
export default {};
EOF

  local output
  output="$(OUTSIDE_FILE="$outside_file" bun --eval "
import { deployFC } from './src/providers/fc.ts';
const outside = process.env.OUTSIDE_FILE;
try {
  await deployFC('licell-smoke-app', outside);
  console.log('UNEXPECTED_SUCCESS');
} catch (error) {
  console.log(String(error && error.message ? error.message : error));
}
" 2>&1 || true)"

  if grep -Fq "入口文件必须在项目目录内" <<<"$output"; then
    pass "entry path guard blocks outside path"
  else
    echo
    log "Command output:"
    echo "$output"
    fail "entry path guard check did not trigger expected error"
  fi
}

check_domain_upsert() {
  if [[ -z "$DOMAIN" ]]; then
    skip "domain upsert (no --domain provided)"
    return
  fi
  log "Step 4/6: domain CNAME upsert"
  if ! confirm "建议先手工把 ${DOMAIN} CNAME 指到错误地址，用于验证 upsert；现在继续"; then
    skip "domain CNAME upsert"
    return
  fi

  run_cli "domain add" "$DOMAIN" --target "$TARGET"

  local app_name expected
  app_name="$(get_project_app_name)"
  [[ -n "$app_name" ]] || fail "missing appName in .licell/project.json"
  expected="$(get_auth_fc_endpoint)"
  [[ -n "$expected" ]] || fail "missing FC account endpoint"

  if command -v dig >/dev/null 2>&1; then
    if wait_for_cname "$DOMAIN" "$expected"; then
      pass "domain CNAME resolved to ${expected}"
    else
      fail "domain CNAME did not converge to ${expected}"
    fi
  else
    skip "dig not installed; please verify ${DOMAIN} -> ${expected} manually"
  fi
}

check_ssl() {
  if [[ "$WITH_SSL" -ne 1 ]]; then
    skip "ssl check not enabled (--with-ssl)"
    return
  fi
  [[ -n "$DOMAIN" ]] || fail "--with-ssl requires --domain"
  log "Step 5/6: SSL issuance and HTTPS probe"

  run_cli "domain add" "$DOMAIN" --ssl --target "$TARGET"

  local headers
  headers="$(curl -sS -I --max-time 30 "https://${DOMAIN}")"
  if grep -Eq '^HTTP/[0-9.]+ (200|301|302|307|308)\b' <<<"$headers"; then
    pass "https://${DOMAIN} responds with successful HTTP status"
  else
    echo
    log "Response headers:"
    echo "$headers"
    fail "unexpected HTTPS status for https://${DOMAIN}"
  fi
}

check_redis_rotate_masking() {
  if [[ "$WITH_REDIS_ROTATE" -ne 1 ]]; then
    skip "redis rotate check not enabled (--with-redis-rotate)"
    return
  fi
  log "Step 6/6: Redis rotate output masking"

  local instance_id="$REDIS_INSTANCE_ID"
  if [[ -z "$instance_id" ]]; then
    instance_id="$(get_project_redis_instance)"
  fi
  [[ -n "$instance_id" ]] || fail "missing redis instance id (set --redis-instance or run licell cache add first)"

  local output
  output="$(run_cli "cache rotate-password" --instance "$instance_id" 2>&1)"
  echo "$output"

  if grep -Fq '******@' <<<"$output"; then
    pass "rotate-password output is masked"
  else
    fail "expected masked password marker (******@) in rotate-password output"
  fi
}

check_oss_public() {
  if [[ "$WITH_OSS" -ne 1 ]]; then
    skip "oss deploy check not enabled (--with-oss)"
    return
  fi

  log "Optional: OSS deploy and URL probe"
  [[ -d "$DIST_DIR" ]] || fail "dist directory not found: $DIST_DIR"

  local app_name
  app_name="$(get_project_app_name)"
  [[ -n "$app_name" ]] || fail "missing appName in .licell/project.json"

  local deploy_output url
  deploy_output="$(APP_NAME="$app_name" DIST_DIR="$DIST_DIR" bun --eval "
import { deployOSS } from './src/providers/oss.ts';
const url = await deployOSS(process.env.APP_NAME, process.env.DIST_DIR);
console.log(url);
" 2>&1)"
  echo "$deploy_output"
  url="$(tail -n 1 <<<"$deploy_output")"

  if curl -sS -I --max-time 30 "$url" | grep -Eq '^HTTP/[0-9.]+ (200|301|302|307|308)\b'; then
    pass "OSS URL is publicly reachable: $url"
  else
    fail "OSS URL is not publicly reachable: $url"
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target) TARGET="${2:-}"; shift 2 ;;
    --expect-key) EXPECT_KEY="${2:-}"; shift 2 ;;
    --expect-value) EXPECT_VALUE="${2:-}"; shift 2 ;;
    --domain) DOMAIN="${2:-}"; shift 2 ;;
    --redis-instance) REDIS_INSTANCE_ID="${2:-}"; shift 2 ;;
    --dist) DIST_DIR="${2:-}"; shift 2 ;;
    --with-ssl) WITH_SSL=1; shift ;;
    --with-oss) WITH_OSS=1; shift ;;
    --with-redis-rotate) WITH_REDIS_ROTATE=1; shift ;;
    --yes) YES=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) fail "unknown option: $1" ;;
  esac
done

require_cmd bun
require_cmd node
require_cmd curl

log "target alias: $TARGET"
log "repo: $ROOT_DIR"

check_env_pull
check_env_clear
check_path_guard
check_domain_upsert
check_ssl
check_redis_rotate_masking
check_oss_public

echo
log "Done. Passed: ${PASS_COUNT}, Skipped: ${SKIP_COUNT}"
