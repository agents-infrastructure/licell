#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NPM_CACHE_DIR="$(mktemp -d "${TMPDIR:-/tmp}/licell-npm-cache.XXXXXX")"

cleanup() {
  rm -rf "$NPM_CACHE_DIR"
}

trap cleanup EXIT INT TERM

npm_config_cache="$NPM_CACHE_DIR" npx --yes tsx --tsconfig "${ROOT_DIR}/tsconfig.json" "${ROOT_DIR}/src/cli.ts" "$@"
