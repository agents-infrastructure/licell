#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

BUN_DISABLE_TRANSPILE_CACHE=1 bun build "${ROOT_DIR}/src/cli.ts" \
  --target node \
  --packages external \
  --minify \
  --outfile "${ROOT_DIR}/dist/ali.js"

cat > "${ROOT_DIR}/ali" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "${ROOT_DIR}/dist/ali.js" "$@"
EOF

chmod +x "${ROOT_DIR}/ali"
echo "Generated ./ali wrapper -> node dist/ali.js"
