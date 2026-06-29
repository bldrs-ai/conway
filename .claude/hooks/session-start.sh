#!/usr/bin/env bash
# SessionStart hook: bring a fresh Claude Code on the web container to a state
# where `yarn lint`, `yarn test`, and `yarn build-incremental` all work.
#
# Each step is idempotent and gated on a per-step *completion stamp* written
# only after the step fully succeeds (see `stamped`/`stamp` below). This makes
# the bootstrap resumable: if a slow cold-start run is killed mid-step (e.g. the
# synchronous hook hits its timeout, or OOM), no stamp is written, so the next
# session re-runs that step instead of treating a half-finished artifact as
# complete. Gating on the artifact alone (`node_modules/.bin/jest` exists) is
# kill-fragile — a partial install missing typescript/@swc would be skipped
# forever. See PLAYBOOK.md §"Session bootstrap" for the rationale per step.

set -euo pipefail

# Only run in the remote (web) sandbox. Local dev runs `yarn setup` itself.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

REPO="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$REPO"

log() { printf '[session-start] %s\n' "$*"; }

# Per-step completion stamps (gitignored runtime state, not artifacts).
STAMP_DIR="$REPO/.claude/.bootstrap"
mkdir -p "$STAMP_DIR"
stamped() { [ -f "$STAMP_DIR/$1.done" ]; }
stamp()   { touch "$STAMP_DIR/$1.done"; }

# 1. node_modules. Network: the agent proxy can abort large tarball fetches
# under parallel load (observed on @swc/core platform binaries), so cap
# concurrency and retry — yarn caches each fetched tarball, so a retry resumes
# where the previous attempt aborted rather than restarting. Lockfile drift is
# NOT a network problem: detect the frozen-lockfile mismatch and fail fast with
# a clear message instead of burning five retries on a deterministic error.
if [ ! -d node_modules ] || ! stamped node_modules; then
  install_ok=false
  install_log="$(mktemp)"
  for attempt in 1 2 3 4 5; do
    log "yarn install (attempt ${attempt})"
    # pipefail (set above) makes this test reflect yarn's exit, not tee's.
    if yarn install --frozen-lockfile --network-concurrency 4 2>&1 | tee "$install_log"; then
      install_ok=true
      break
    fi
    if grep -qi 'frozen-lockfile\|lockfile needs to be updated' "$install_log"; then
      log "yarn.lock is out of sync with package.json — frozen install cannot proceed; fix the lockfile. Not retrying."
      break
    fi
    if [ "${attempt}" -lt 5 ]; then
      log "yarn install attempt ${attempt} failed (likely network); backing off"
      sleep $(( attempt * 5 ))
    fi
  done
  rm -f "$install_log"
  if [ "${install_ok}" != true ]; then
    log "yarn install did not complete"
    exit 1
  fi
  stamp node_modules
else
  log "node_modules present and stamped, skipping yarn install"
fi

# 2. Submodules (conway-geom + nested)
if [ ! -f dependencies/conway-geom/genie.lua ] || ! stamped submodules; then
  log "git submodule update --init --recursive"
  git submodule update --init --recursive
  stamp submodules
else
  log "submodules present, skipping init"
fi

# 3. Pre-built WASM dependency zip extraction (idempotent, fast — always run).
log "yarn extract-wasm-dependencies"
yarn extract-wasm-dependencies >/dev/null

# 4. EMSDK install at ../emsdk (matches scripts/setup-emsdk.sh + build-codex.sh).
EMSDK_DIR="$(cd "$REPO/.." && pwd)/emsdk"
if [ ! -x "$EMSDK_DIR/emsdk_env.sh" ] || ! stamped emsdk; then
  log "installing EMSDK 3.1.72 at $EMSDK_DIR (slow on first run, cached afterward)"
  bash "$REPO/scripts/setup-emsdk.sh"
  stamp emsdk
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
WASM_OUT="$REPO/dependencies/conway-geom/Dist/ConwayGeomWasmNodeMT.js"
if [ ! -f "$WASM_OUT" ] || ! stamped wasm; then
  log "building conway-geom WASM (ConwayGeomWasmNodeMT) — first run ~2–4 min"
  chmod +x "$REPO/scripts/build-codex.sh"
  yarn build-codex-MT
  stamp wasm
else
  log "WASM artifact present, skipping conway-geom build"
  # Ensure compiled/ exists so tests can run.
  if [ ! -d "$REPO/compiled" ]; then
    log "compiled/ missing — running yarn build-incremental"
    yarn build-incremental
  fi
fi

log "ready"
