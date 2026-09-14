#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if command -v npm >/dev/null 2>&1; then
  RUNNER="npm exec --"
elif command -v npx >/dev/null 2>&1; then
  RUNNER="npx"
else
  echo "Node/npm is required to run Gwalawala with Expo."
  exit 1
fi

case "${1:-}" in
  "") exec $RUNNER expo start ;;
  --ios) exec $RUNNER expo start --ios ;;
  --android) exec $RUNNER expo start --android ;;
  --web) exec $RUNNER expo start --web ;;
  --dev-client) exec $RUNNER expo start --dev-client ;;
  --tunnel) exec $RUNNER expo start --tunnel ;;
  --export-web) exec $RUNNER expo export --platform web ;;
  --help|-h)
    cat <<'EOF'
Gwalawala Expo runner

Usage:
  ./script/build_and_run.sh             Start Expo/Metro
  ./script/build_and_run.sh --android   Start Expo and Android
  ./script/build_and_run.sh --ios       Start Expo and iOS
  ./script/build_and_run.sh --web       Start Expo web
  ./script/build_and_run.sh --dev-client Start Expo dev client
  ./script/build_and_run.sh --tunnel    Start Expo with tunnel
  ./script/build_and_run.sh --export-web Export the web build
EOF
    ;;
  *) echo "Unknown option: $1"; exit 2 ;;
esac
