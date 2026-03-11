#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${ROOT_DIR}/dist"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/licell-standalone.XXXXXX")"
TARGET_OS="${LICELL_TARGET_OS:-}"
TARGET_ARCH="${LICELL_TARGET_ARCH:-}"
SEA_NODE_MIN_MAJOR="${LICELL_STANDALONE_NODE_MIN_MAJOR:-20}"
SEA_SENTINEL_FUSE="NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2"
ESBUILD_NPM_PACKAGE="${LICELL_ESBUILD_NPM_PACKAGE:-esbuild@0.27.3}"
POSTJECT_NPM_PACKAGE="${LICELL_POSTJECT_NPM_PACKAGE:-postject@1.0.0-alpha.6}"
NODE_NPM_PACKAGE_PREFIX="${LICELL_NODE_NPM_PACKAGE_PREFIX:-node@}"
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

ensure_node_support() {
  local major
  major="$(node -p "Number(process.versions.node.split('.')[0])")"
  if [[ -z "$major" || "$major" -lt "$SEA_NODE_MIN_MAJOR" ]]; then
    echo "[build-standalone] Node.js >= ${SEA_NODE_MIN_MAJOR} is required (current: $(node -v))" >&2
    exit 1
  fi
}

supports_build_sea() {
  local node_bin="${1:-node}"
  "$node_bin" --help 2>/dev/null | grep -q -- "--build-sea"
}

node_binary_has_sea_fuse() {
  local node_bin="$1"
  [[ -x "$node_bin" ]] || return 1
  "$node_bin" -e '
const fs = require("fs");
const [binPath, sentinel] = process.argv.slice(1);
const contents = fs.readFileSync(binPath);
process.exit(contents.includes(Buffer.from(sentinel, "utf8")) ? 0 : 1);
' "$node_bin" "$SEA_SENTINEL_FUSE"
}

resolve_build_node_path() {
  local host_node_path="$1"
  local tooling_dir="$2"
  local npm_cache_dir="$3"

  if node_binary_has_sea_fuse "$host_node_path"; then
    echo "$host_node_path"
    return 0
  fi

  local node_version node_pkg resolved_node_path
  node_version="$(node -p "process.version.replace(/^v/, '')")"
  node_pkg="${NODE_NPM_PACKAGE_PREFIX}${node_version}"

  echo "[build-standalone] host node lacks SEA fuse; resolving official ${node_pkg} binary" >&2
  resolved_node_path="$(
    cd "$tooling_dir" && \
    npm_config_cache="$npm_cache_dir" npm exec --yes --package="$node_pkg" -- \
      node -p "process.execPath"
  )"

  if [[ -z "$resolved_node_path" || ! -x "$resolved_node_path" ]]; then
    echo "[build-standalone] failed to resolve usable Node binary from ${node_pkg}" >&2
    exit 1
  fi
  if ! node_binary_has_sea_fuse "$resolved_node_path"; then
    echo "[build-standalone] resolved Node binary still lacks SEA fuse: ${resolved_node_path}" >&2
    exit 1
  fi

  echo "$resolved_node_path"
}

write_sea_config_json() {
  local config_path="$1"
  local main_path="$2"
  local output_path="$3"
  local executable_path="${4:-}"

  if [[ -n "$executable_path" ]]; then
    node -e '
const fs = require("fs");
const [configPath, mainPath, outputPath, executablePath] = process.argv.slice(1);
fs.writeFileSync(configPath, JSON.stringify({
  main: mainPath,
  executable: executablePath,
  output: outputPath,
  disableExperimentalSEAWarning: true,
  useSnapshot: false,
  useCodeCache: false
}, null, 2));
' "$config_path" "$main_path" "$output_path" "$executable_path"
    return
  fi

  node -e '
const fs = require("fs");
const [configPath, mainPath, outputPath] = process.argv.slice(1);
fs.writeFileSync(configPath, JSON.stringify({
  main: mainPath,
  output: outputPath,
  disableExperimentalSEAWarning: true,
  useSnapshot: false,
  useCodeCache: false
}, null, 2));
' "$config_path" "$main_path" "$output_path"
}

codesign_macos_binary() {
  local binary_path="$1"
  if [[ "$(uname -s)" != "Darwin" ]]; then
    return 0
  fi
  if ! command -v codesign >/dev/null 2>&1; then
    return 0
  fi
  codesign --sign - "$binary_path" >/dev/null 2>&1 || {
    echo "[build-standalone] warning: codesign failed for ${binary_path}" >&2
  }
}

main() {
  require_cmd tar
  require_cmd mktemp
  require_cmd npm
  require_cmd node

  [[ -d "${ROOT_DIR}/node_modules" ]] || {
    echo "[build-standalone] missing node_modules, run bun install first" >&2
    exit 1
  }
  ensure_node_support

  local host_os host_arch os arch bundle_path bin_path archive_path node_path build_node_path sea_blob_path sea_config_path npm_cache_dir
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

  if [[ "$os" != "$host_os" || "$arch" != "$host_arch" ]]; then
    echo "[build-standalone] cross-compilation is not supported; run build on ${os}-${arch}" >&2
    echo "[build-standalone] host=${host_os}-${host_arch}, target=${os}-${arch}" >&2
    exit 1
  fi

  bundle_path="${TMP_DIR}/licell-bundle.cjs"
  bin_path="${OUT_DIR}/licell-${os}-${arch}"
  archive_path="${OUT_DIR}/licell-${os}-${arch}.tar.gz"
  sea_blob_path="${TMP_DIR}/sea-prep.blob"
  sea_config_path="${TMP_DIR}/sea-config.json"
  node_path="$(command -v node)"
  npm_cache_dir="${TMP_DIR}/npm-cache"

  mkdir -p "${TMP_DIR}/tooling"
  mkdir -p "${npm_cache_dir}"
  build_node_path="$(resolve_build_node_path "$node_path" "${TMP_DIR}/tooling" "$npm_cache_dir")"

  echo "[build-standalone] bundling entry with esbuild: target=node${SEA_NODE_MIN_MAJOR}"
  (
    cd "${TMP_DIR}/tooling"
    local esbuild_args=(
      esbuild "${ROOT_DIR}/src/cli.ts"
      --bundle
      --platform=node
      --target="node${SEA_NODE_MIN_MAJOR}"
      --format=cjs
      --external:proxy-agent
      --outfile="${bundle_path}"
    )
    if [[ ${#DEFINE_VERSION_ARGS[@]} -gt 0 ]]; then
      esbuild_args+=("${DEFINE_VERSION_ARGS[@]}")
    fi
    npm exec --yes --package="${ESBUILD_NPM_PACKAGE}" -- \
      "${esbuild_args[@]}"
  )

  if supports_build_sea "$build_node_path"; then
    echo "[build-standalone] building SEA executable with $(basename "$build_node_path") --build-sea"
    write_sea_config_json "$sea_config_path" "$bundle_path" "$bin_path" "$build_node_path"
    "$build_node_path" --build-sea "$sea_config_path"
  else
    echo "[build-standalone] building SEA executable with --experimental-sea-config + postject"
    write_sea_config_json "$sea_config_path" "$bundle_path" "$sea_blob_path"
    "$build_node_path" --experimental-sea-config "$sea_config_path"
    cp "$build_node_path" "$bin_path"

    if [[ "$os" == "darwin" ]] && command -v codesign >/dev/null 2>&1; then
      codesign --remove-signature "$bin_path" >/dev/null 2>&1 || true
    fi

    (
      cd "${TMP_DIR}/tooling"
      local postject_args=(
        postject "${bin_path}" NODE_SEA_BLOB "${sea_blob_path}"
        --sentinel-fuse "${SEA_SENTINEL_FUSE}"
      )
      if [[ "$os" == "darwin" ]]; then
        postject_args+=(--macho-segment-name NODE_SEA)
      fi
      npm exec --yes --package="${POSTJECT_NPM_PACKAGE}" -- \
        "${postject_args[@]}"
    )
  fi

  if [[ "$os" == "darwin" ]]; then
    codesign_macos_binary "$bin_path"
  fi

  chmod +x "${bin_path}"
  "${bin_path}" --version >/dev/null

  cp "${bin_path}" "${TMP_DIR}/licell"
  chmod +x "${TMP_DIR}/licell"
  tar -czf "${archive_path}" -C "${TMP_DIR}" licell

  echo "[build-standalone] done"
  echo "[build-standalone] binary:  ${bin_path}"
  echo "[build-standalone] archive: ${archive_path}"
}

main "$@"
