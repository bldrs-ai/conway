#!/usr/bin/env bash
# SessionStart hook: bring a fresh Claude Code on the web container to a state
# where `yarn lint`, `yarn test`, and `yarn build-incremental` all work.
#
# Steps are idempotent; expensive work (yarn install, EMSDK install, WASM build)
# is skipped when its outputs are already present. See PLAYBOOK.md §"Session
# bootstrap" for the rationale behind each step.

set -euo pipefail

# Only run in the remote (web) sandbox. Local dev runs `yarn setup` itself.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

REPO="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$REPO"

log() { printf '[session-start] %s\n' "$*"; }

# 1. node_modules
if [ ! -d node_modules ] || [ ! -x node_modules/.bin/jest ]; then
  log "yarn install"
  yarn install --frozen-lockfile
else
  log "node_modules present, skipping yarn install"
fi

# 2. Submodules (conway-geom + nested)
if [ ! -f dependencies/conway-geom/genie.lua ]; then
  log "git submodule update --init --recursive"
  git submodule update --init --recursive
else
  log "submodules present, skipping init"
fi

# 3. Pre-built WASM dependency zip extraction (idempotent)
log "yarn extract-wasm-dependencies"
yarn extract-wasm-dependencies >/dev/null

# 4. EMSDK install at ../emsdk (matches scripts/setup-emsdk.sh + build-codex.sh).
EMSDK_DIR="$(cd "$REPO/.." && pwd)/emsdk"
if [ ! -x "$EMSDK_DIR/emsdk_env.sh" ]; then
  log "installing EMSDK 3.1.72 at $EMSDK_DIR (slow on first run, cached afterward)"
  bash "$REPO/scripts/setup-emsdk.sh"
else
  log "EMSDK present at $EMSDK_DIR, skipping install"
fi

# Persist emsdk env into the session so emcc is on PATH for subsequent commands.
if [ -n "${CLAUDE_ENV_FILE:-}" ] && [ -f "$EMSDK_DIR/emsdk_env.sh" ]; then
  # shellcheck disable=SC1090,SC1091
  source "$EMSDK_DIR/emsdk_env.sh" >/dev/null 2>&1 || true
  {
    echo "export EMSDK=\"$EMSDK\""
    echo "export EMSDK_NODE=\"${EMSDK_NODE:-}\""
    echo "export PATH=\"$EMSDK:$EMSDK/upstream/emscripten:\$PATH\""
  } >> "$CLAUDE_ENV_FILE"
fi

# 5. conway-geom WASM build (MT node target — what tests need).
# `bundle-examples` rebuilds the bundled CLIs but is also fast and cached.
WASM_OUT="$REPO/dependencies/conway-geom/Dist/ConwayGeomWasmNodeMT.js"
if [ ! -f "$WASM_OUT" ]; then
  log "building conway-geom WASM (ConwayGeomWasmNodeMT) — first run ~2–4 min"
  chmod +x "$REPO/scripts/build-codex.sh"
  yarn build-codex-MT
else
  log "WASM artifact present, skipping conway-geom build"
  # Ensure compiled/ exists so tests can run.
  if [ ! -d "$REPO/compiled" ]; then
    log "compiled/ missing — running yarn build-incremental"
    yarn build-incremental
  fi
fi

log "ready"
