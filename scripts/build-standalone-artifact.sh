#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${ROOT_DIR}/dist"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/licell-standalone.XXXXXX")"
TARGET_OS="${LICELL_TARGET_OS:-}"
TARGET_ARCH="${LICELL_TARGET_ARCH:-}"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT INT TERM

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "[build-standalone] missing required command: $1" >&2
    exit 1
  }
}

detect_os_arch() {
  local os arch
  os="$(uname -s | tr '[:upper:]' '[:lower:]')"
  arch="$(uname -m | tr '[:upper:]' '[:lower:]')"

  case "$os" in
    darwin|linux) ;;
    *)
      echo "[build-standalone] unsupported OS: ${os}" >&2
      exit 1
      ;;
  esac

  case "$arch" in
    x86_64|amd64) arch="x64" ;;
    arm64|aarch64) arch="arm64" ;;
    *)
      echo "[build-standalone] unsupported architecture: ${arch}" >&2
      exit 1
      ;;
  esac

  echo "${os}" "${arch}"
}

normalize_target() {
  local os="$1"
  local arch="$2"

  case "$os" in
    darwin|linux) ;;
    *)
      echo "[build-standalone] unsupported target os: ${os}" >&2
      exit 1
      ;;
  esac

  case "$arch" in
    x64|arm64) ;;
    x86_64|amd64) arch="x64" ;;
    aarch64) arch="arm64" ;;
    *)
      echo "[build-standalone] unsupported target arch: ${arch}" >&2
      exit 1
      ;;
  esac

  echo "${os}" "${arch}"
}

main() {
  require_cmd bun
  require_cmd tar
  require_cmd mktemp

  local host_os host_arch os arch bun_target bin_path archive_path
  read -r host_os host_arch < <(detect_os_arch)

  if [[ -n "$TARGET_OS" || -n "$TARGET_ARCH" ]]; then
    [[ -n "$TARGET_OS" && -n "$TARGET_ARCH" ]] || {
      echo "[build-standalone] LICELL_TARGET_OS and LICELL_TARGET_ARCH must be provided together" >&2
      exit 1
    }
    read -r os arch < <(normalize_target "$TARGET_OS" "$TARGET_ARCH")
  else
    os="$host_os"
    arch="$host_arch"
  fi

  mkdir -p "$OUT_DIR"

  bun_target="bun-${os}-${arch}"
  bin_path="${OUT_DIR}/licell-${os}-${arch}"
  archive_path="${OUT_DIR}/licell-${os}-${arch}.tar.gz"

  echo "[build-standalone] building executable: ${bin_path} (target=${bun_target})"
  BUN_DISABLE_TRANSPILE_CACHE=1 bun build "${ROOT_DIR}/src/cli.ts" \
    --compile \
    --target "${bun_target}" \
    --minify \
    --outfile "$bin_path"
  chmod +x "$bin_path"

  cp "$bin_path" "${TMP_DIR}/licell"
  chmod +x "${TMP_DIR}/licell"
  tar -czf "$archive_path" -C "$TMP_DIR" licell

  echo "[build-standalone] done"
  echo "[build-standalone] binary:  ${bin_path}"
  echo "[build-standalone] archive: ${archive_path}"
  echo "[build-standalone] upload archive to GitHub Release asset with same file name"
}

main "$@"
