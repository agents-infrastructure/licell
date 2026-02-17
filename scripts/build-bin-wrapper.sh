#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

BUN_DISABLE_TRANSPILE_CACHE=1 bun build "${ROOT_DIR}/src/cli.ts" \
  --target node \
  --packages external \
  --minify \
  --outfile "${ROOT_DIR}/dist/licell.js"

if [[ -n "${LICELL_VERSION:-}" ]]; then
cat > "${ROOT_DIR}/licell" <<EOF
#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="\$(cd "\$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
export LICELL_VERSION="${LICELL_VERSION}"
exec node "\${ROOT_DIR}/dist/licell.js" "\$@"
EOF
else
cat > "${ROOT_DIR}/licell" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "${ROOT_DIR}/dist/licell.js" "$@"
EOF
fi

cat > "${ROOT_DIR}/ali" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "${ROOT_DIR}/licell" "$@"
EOF

chmod +x "${ROOT_DIR}/licell" "${ROOT_DIR}/ali"
echo "Generated ./licell wrapper -> node dist/licell.js (legacy ./ali shim kept)"
