#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${ROOT_DIR}/dist"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/licell-standalone.XXXXXX")"
TARGET_OS="${LICELL_TARGET_OS:-}"
TARGET_ARCH="${LICELL_TARGET_ARCH:-}"
NODE_TARGET_VERSION="${LICELL_STANDALONE_NODE_TARGET:-18}"
DEFINE_VERSION_ARGS=()

if [[ -n "${LICELL_VERSION:-}" ]]; then
  DEFINE_VERSION_ARGS+=(--define:process.env.LICELL_VERSION=\"${LICELL_VERSION}\")
fi

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

pkg_target_for() {
  local os="$1"
  local arch="$2"

  case "${os}-${arch}" in
    linux-x64) echo "node${NODE_TARGET_VERSION}-linux-x64" ;;
    linux-arm64) echo "node${NODE_TARGET_VERSION}-linux-arm64" ;;
    darwin-x64) echo "node${NODE_TARGET_VERSION}-macos-x64" ;;
    darwin-arm64) echo "node${NODE_TARGET_VERSION}-macos-arm64" ;;
    *)
      echo "[build-standalone] unsupported pkg target: ${os}-${arch}" >&2
      exit 1
      ;;
  esac
}

main() {
  require_cmd tar
  require_cmd mktemp
  require_cmd npm

  [[ -d "${ROOT_DIR}/node_modules" ]] || {
    echo "[build-standalone] missing node_modules, run bun install first" >&2
    exit 1
  }

  local host_os host_arch os arch pkg_target bundle_path bin_path archive_path
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

  pkg_target="$(pkg_target_for "$os" "$arch")"
  bundle_path="${TMP_DIR}/licell-bundle.cjs"
  bin_path="${OUT_DIR}/licell-${os}-${arch}"
  archive_path="${OUT_DIR}/licell-${os}-${arch}.tar.gz"

  mkdir -p "${TMP_DIR}/tooling"

  echo "[build-standalone] bundling entry with esbuild: target=node${NODE_TARGET_VERSION}"
  (
    cd "${TMP_DIR}/tooling"
    npm exec --yes --package=esbuild -- \
      esbuild "${ROOT_DIR}/src/cli.ts" \
        --bundle \
        --platform=node \
        --target="node${NODE_TARGET_VERSION}" \
        --format=cjs \
        --external:proxy-agent \
        "${DEFINE_VERSION_ARGS[@]}" \
        --outfile="${bundle_path}"
  )

  echo "[build-standalone] building standalone binary with pkg: ${pkg_target}"
  (
    cd "${TMP_DIR}/tooling"
    npm exec --yes --package=pkg -- \
      pkg "${bundle_path}" \
        --targets "${pkg_target}" \
        --compress GZip \
        --output "${bin_path}"
  )
  chmod +x "${bin_path}"

  cp "${bin_path}" "${TMP_DIR}/licell"
  chmod +x "${TMP_DIR}/licell"
  tar -czf "${archive_path}" -C "${TMP_DIR}" licell

  echo "[build-standalone] done"
  echo "[build-standalone] binary:  ${bin_path}"
  echo "[build-standalone] archive: ${archive_path}"
  if [[ "$os" == "darwin" ]]; then
    echo "[build-standalone] note: darwin binaries may need ad-hoc codesign on the target machine"
  fi
}

main "$@"
