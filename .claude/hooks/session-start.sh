#!/usr/bin/env bash
# SessionStart hook: bring a fresh Claude Code on the web container to a state
# where `yarn lint`, `yarn typecheck`/`yarn build-incremental` work and the
# TypeScript is editable.
#
# Deliberately scoped to the FAST, TS-only path. The EMSDK install and the
# ~2–4 min conway-geom WASM build — needed only to *run* tests/geometry
# locally — are NOT done here: the tests-pass invariant is owned by CI, so
# paying that cost on every session start is wasted time. When you actually
# need to run tests or geometry in a session, run:
#
#     bash .claude/hooks/wasm-setup.sh
#
# Each step is idempotent and gated on a per-step *completion stamp* written
# only after the step fully succeeds (see `stamped`/`stamp`). This makes the
# bootstrap resumable: if a slow cold-start run is killed mid-step (timeout,
# OOM), no stamp is written, so the next session re-runs that step instead of
# treating a half-finished artifact as complete. Gating on the artifact alone
# (`node_modules/.bin/jest` exists) is kill-fragile — a partial install missing
# typescript/@swc would be skipped forever. See PLAYBOOK.md §"Session bootstrap".

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

# 2. Submodules (conway-geom + nested). tsconfig.json compiles
# `dependencies/conway-geom/*.ts` directly, so typecheck/build need the
# submodule checked out — but not its WASM build.
if [ ! -f dependencies/conway-geom/genie.lua ] || ! stamped submodules; then
  log "git submodule update --init --recursive"
  git submodule update --init --recursive
  stamp submodules
else
  log "submodules present, skipping init"
fi

# 3. compiled/ — `tsc --build` over the TS (incl. conway-geom sources). TS-only;
# no EMSDK/WASM. Gives a ready `yarn lint`/`yarn build-incremental`.
if [ ! -d compiled ] || ! stamped build; then
  log "yarn build-incremental"
  yarn build-incremental
  stamp build
else
  log "compiled/ present and stamped, skipping build-incremental"
fi

log "ready (TS dev). To run tests/geometry: bash .claude/hooks/wasm-setup.sh"
