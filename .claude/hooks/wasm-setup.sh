#!/usr/bin/env bash
# On-demand conway-geom WASM toolchain setup. Run this in a Claude Code on the
# web session when you actually need to run tests or geometry locally:
#
#     bash .claude/hooks/wasm-setup.sh
#
# It is intentionally NOT part of session-start.sh: the EMSDK install and the
# ~2–4 min WASM build are wasted on the common edit/lint/typecheck loop, and the
# tests-pass invariant is owned by CI. Assumes session-start.sh already ran
# (node_modules + submodules present). Steps are idempotent and stamped, so
# re-running is cheap and a killed run resumes rather than re-does completed work.

set -euo pipefail

REPO="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$REPO"

log() { printf '[wasm-setup] %s\n' "$*"; }

STAMP_DIR="$REPO/.claude/.bootstrap"
mkdir -p "$STAMP_DIR"
stamped() { [ -f "$STAMP_DIR/$1.done" ]; }
stamp()   { touch "$STAMP_DIR/$1.done"; }

if [ ! -f dependencies/conway-geom/genie.lua ]; then
  log "conway-geom submodule missing — run session-start.sh first (git submodule update)"
  exit 1
fi

# 1. Pre-built WASM dependency zip extraction (idempotent build input).
log "yarn extract-wasm-dependencies"
yarn extract-wasm-dependencies >/dev/null

# 2. EMSDK install at ../emsdk (matches scripts/setup-emsdk.sh + build-codex.sh).
# The stamp includes the version so a version bump re-provisions environments
# that were stamped on the old toolchain.
EMSDK_VERSION="${EMSDK_VERSION:-6.0.2}"
EMSDK_DIR="$(cd "$REPO/.." && pwd)/emsdk"
if [ ! -x "$EMSDK_DIR/emsdk_env.sh" ] || ! stamped "emsdk-$EMSDK_VERSION"; then
  log "installing EMSDK $EMSDK_VERSION at $EMSDK_DIR (slow on first run, cached afterward)"
  EMSDK_VERSION="$EMSDK_VERSION" bash "$REPO/scripts/setup-emsdk.sh"
  stamp "emsdk-$EMSDK_VERSION"
else
  log "EMSDK present at $EMSDK_DIR, skipping install"
fi

# Put emcc on PATH for this process, and persist into the session if invoked
# where CLAUDE_ENV_FILE is available (so later commands see emcc too).
if [ -f "$EMSDK_DIR/emsdk_env.sh" ]; then
  # shellcheck disable=SC1090,SC1091
  source "$EMSDK_DIR/emsdk_env.sh" >/dev/null 2>&1 || true
  if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
    {
      echo "export EMSDK=\"$EMSDK\""
      echo "export EMSDK_NODE=\"${EMSDK_NODE:-}\""
      echo "export PATH=\"$EMSDK:$EMSDK/upstream/emscripten:\$PATH\""
    } >> "$CLAUDE_ENV_FILE"
  fi
fi

# 3. conway-geom WASM build (MT node target — what tests load at runtime).
WASM_OUT="$REPO/dependencies/conway-geom/Dist/ConwayGeomWasmNodeMT.js"
if [ ! -f "$WASM_OUT" ] || ! stamped "wasm-emsdk-$EMSDK_VERSION"; then
  log "building conway-geom WASM (ConwayGeomWasmNodeMT) — first run ~2–4 min"
  chmod +x "$REPO/scripts/build-codex.sh"
  yarn build-codex-MT
  stamp "wasm-emsdk-$EMSDK_VERSION"
else
  log "WASM artifact present, skipping conway-geom build"
fi

log "ready — yarn test / geometry can now run"
