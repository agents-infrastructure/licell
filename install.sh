#!/usr/bin/env bash
set -euo pipefail

REPO="${LICELL_REPO:-dafang/licell}"
REF="${LICELL_REF:-main}"
ARCHIVE_URL="${LICELL_ARCHIVE_URL:-https://api.github.com/repos/${REPO}/tarball/${REF}}"
INSTALL_ROOT="${LICELL_INSTALL_ROOT:-$HOME/.local/share/licell}"
BIN_DIR="${LICELL_BIN_DIR:-$HOME/.local/bin}"
PACKAGE_MANAGER="${LICELL_PACKAGE_MANAGER:-npm}"
GITHUB_TOKEN="${LICELL_GITHUB_TOKEN:-}"
TMP_DIR=""

log() {
  echo "[licell-install] $*"
}

die() {
  echo "[licell-install] error: $*" >&2
  exit 1
}

cleanup() {
  if [[ -n "$TMP_DIR" && -d "$TMP_DIR" ]]; then
    rm -rf "$TMP_DIR"
  fi
}
trap cleanup EXIT INT TERM

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "missing required command: $1"
}

detect_os_arch() {
  local os arch
  os="$(uname -s | tr '[:upper:]' '[:lower:]')"
  arch="$(uname -m | tr '[:upper:]' '[:lower:]')"

  case "$os" in
    darwin|linux) ;;
    *)
      die "unsupported OS: ${os} (expected darwin or linux)"
      ;;
  esac

  case "$arch" in
    x86_64|amd64) arch="x64" ;;
    arm64|aarch64) arch="arm64" ;;
    *)
      die "unsupported architecture: ${arch} (expected x64 or arm64)"
      ;;
  esac

  echo "${os}" "${arch}"
}

write_legacy_shim() {
  cat > "${BIN_DIR}/ali" <<EOF
#!/usr/bin/env bash
set -euo pipefail
exec "${BIN_DIR}/licell" "\$@"
EOF
  chmod +x "${BIN_DIR}/ali"
}

show_path_hint() {
  if [[ ":$PATH:" != *":${BIN_DIR}:"* ]]; then
    log "add ${BIN_DIR} to PATH:"
    log "  export PATH=\"${BIN_DIR}:\$PATH\""
  fi
}

adhoc_codesign_if_needed() {
  local binary_path="$1"
  local os="$2"
  if [[ "$os" != "darwin" ]]; then
    return 0
  fi
  if ! command -v codesign >/dev/null 2>&1; then
    return 0
  fi
  if ! codesign --force --deep --sign - "$binary_path" >/dev/null 2>&1; then
    log "warning: ad-hoc codesign failed for ${binary_path}, will rely on run check"
  fi
}

download_with_optional_auth() {
  local url="$1"
  local output="$2"
  if [[ -n "$GITHUB_TOKEN" ]]; then
    curl -fsSL \
      -H "Authorization: Bearer ${GITHUB_TOKEN}" \
      -H "Accept: application/vnd.github+json" \
      "$url" \
      -o "$output"
    return
  fi
  curl -fsSL "$url" -o "$output"
}

install_prebuilt_runtime_package() {
  local src_dir="$1"
  local os="$2"
  local arch="$3"
  local prebuilt_dir="${INSTALL_ROOT}/prebuilt-${os}-${arch}"

  check_node_version

  mkdir -p "$INSTALL_ROOT" "$BIN_DIR"
  rm -rf "$prebuilt_dir"
  mkdir -p "$prebuilt_dir"
  cp -R "${src_dir}/." "$prebuilt_dir/"

  chmod +x "${prebuilt_dir}/licell"
  if [[ -f "${prebuilt_dir}/ali" ]]; then
    chmod +x "${prebuilt_dir}/ali"
  fi

  cat > "${BIN_DIR}/licell" <<EOF
#!/usr/bin/env bash
set -euo pipefail
exec "${prebuilt_dir}/licell" "\$@"
EOF
  chmod +x "${BIN_DIR}/licell"
  write_legacy_shim

  if ! "${BIN_DIR}/licell" --help >/dev/null 2>&1; then
    log "installed prebuilt runtime package failed to run, fallback to source install"
    return 1
  fi

  log "installed prebuilt runtime package to ${prebuilt_dir}"
  show_path_hint
  log "run: licell --help"
  return 0
}

install_from_binary_archive() {
  local os="$1"
  local arch="$2"
  local asset_name binary_url

  asset_name="licell-${os}-${arch}.tar.gz"
  binary_url="${LICELL_BINARY_URL:-https://github.com/${REPO}/releases/latest/download/${asset_name}}"

  log "trying prebuilt binary: ${binary_url}"
  if ! download_with_optional_auth "$binary_url" "${TMP_DIR}/licell-bin.tar.gz"; then
    log "prebuilt binary unavailable, fallback to source install"
    return 1
  fi

  mkdir -p "${TMP_DIR}/bin"
  if ! tar -xzf "${TMP_DIR}/licell-bin.tar.gz" -C "${TMP_DIR}/bin"; then
    log "invalid prebuilt binary archive, fallback to source install"
    return 1
  fi

  local src_bin src_dir
  src_bin="$(find "${TMP_DIR}/bin" -type f -name licell | head -n 1 || true)"
  if [[ -z "$src_bin" ]]; then
    log "prebuilt archive does not contain licell executable, fallback to source install"
    return 1
  fi
  src_dir="$(dirname "$src_bin")"

  if [[ -f "${src_dir}/dist/licell.js" ]]; then
    if install_prebuilt_runtime_package "$src_dir" "$os" "$arch"; then
      return 0
    fi
    return 1
  fi

  mkdir -p "$BIN_DIR"
  install -m 0755 "$src_bin" "${BIN_DIR}/licell"
  adhoc_codesign_if_needed "${BIN_DIR}/licell" "$os"
  write_legacy_shim

  if ! "${BIN_DIR}/licell" --help >/dev/null 2>&1; then
    log "installed prebuilt binary failed to run, fallback to source install"
    return 1
  fi

  log "installed prebuilt standalone binary to ${BIN_DIR}/licell"
  show_path_hint
  log "run: licell --help"
  return 0
}

check_node_version() {
  require_cmd node
  local major
  major="$(node -p "process.versions.node.split('.')[0]")"
  if [[ -z "$major" || "$major" -lt 20 ]]; then
    die "Node.js >= 20 is required for runtime install (current: $(node -v))"
  fi
}

install_deps() {
  local work_dir="$1"
  case "$PACKAGE_MANAGER" in
    npm)
      require_cmd npm
      (cd "$work_dir" && npm install --omit=dev --no-audit --no-fund)
      ;;
    pnpm)
      require_cmd pnpm
      (cd "$work_dir" && pnpm install --prod --frozen-lockfile)
      ;;
    yarn)
      require_cmd yarn
      (cd "$work_dir" && yarn install --production --frozen-lockfile)
      ;;
    *)
      die "unsupported LICELL_PACKAGE_MANAGER: $PACKAGE_MANAGER (expected: npm|pnpm|yarn)"
      ;;
  esac
}

install_from_source() {
  check_node_version
  require_cmd tar

  log "downloading source archive: ${ARCHIVE_URL}"
  download_with_optional_auth "$ARCHIVE_URL" "${TMP_DIR}/licell-src.tar.gz" \
    || die "failed to download source archive (set LICELL_ARCHIVE_URL or LICELL_GITHUB_TOKEN for private repos)"
  tar -xzf "${TMP_DIR}/licell-src.tar.gz" -C "$TMP_DIR"

  local package_path source_dir version_label version_dir
  package_path="$(find "$TMP_DIR" -mindepth 1 -maxdepth 4 -type f -name package.json | head -n 1 || true)"
  [[ -n "$package_path" ]] || die "failed to unpack licell source archive (package.json not found)"
  source_dir="$(dirname "$package_path")"

  version_label="$(echo "$REF" | tr '/:' '--')"
  version_dir="${INSTALL_ROOT}/${version_label}"

  mkdir -p "$INSTALL_ROOT"
  rm -rf "$version_dir"
  cp -R "$source_dir" "$version_dir"

  if [[ ! -f "${version_dir}/dist/licell.js" ]]; then
    require_cmd bun
    [[ -f "${version_dir}/src/cli.ts" ]] || die "src/cli.ts not found in source archive"
    log "dist/licell.js missing, building with bun"
    (
      cd "$version_dir"
      BUN_DISABLE_TRANSPILE_CACHE=1 bun build ./src/cli.ts \
        --target node \
        --packages external \
        --minify \
        --outfile dist/licell.js
    )
  fi

  log "installing runtime dependencies with ${PACKAGE_MANAGER}"
  install_deps "$version_dir"

  ln -sfn "$version_dir" "${INSTALL_ROOT}/current"
  mkdir -p "$BIN_DIR"

  cat > "${BIN_DIR}/licell" <<EOF
#!/usr/bin/env bash
set -euo pipefail
INSTALL_ROOT="${INSTALL_ROOT}"
exec node "\${INSTALL_ROOT}/current/dist/licell.js" "\$@"
EOF
  chmod +x "${BIN_DIR}/licell"
  write_legacy_shim

  if ! "${BIN_DIR}/licell" --help >/dev/null 2>&1; then
    die "installed source fallback launcher failed to run"
  fi

  log "installed source fallback to ${BIN_DIR}/licell"
  show_path_hint
  log "run: licell --help"
}

main() {
  require_cmd curl
  require_cmd mktemp
  TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/licell-install.XXXXXX")"

  local os arch
  read -r os arch < <(detect_os_arch)

  if install_from_binary_archive "$os" "$arch"; then
    return
  fi
  install_from_source
}

main "$@"
