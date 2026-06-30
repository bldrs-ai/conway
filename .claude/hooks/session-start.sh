#!/usr/bin/env bash
# SessionStart hook (Claude Code on the web).
#
# The heavy bootstrap (install + submodules + build) lives in the shared,
# idempotent scripts/web-setup.sh, exposed as `yarn setup`. The intended place to
# run it is the cloud *environment setup script* — a multi-repo dispatcher that
# runs `yarn setup` per checkout (see scripts/web-setup.sh header for the exact
# field) — whose filesystem result is snapshotted, so a session starts with
# node_modules already present and this hook is a near-instant no-op.
#
# This hook is the fallback: it runs the same shared script for a cold cache (or
# if the environment setup script was never configured). web-setup.sh is
# stamp-gated, so when node_modules is already there it returns immediately.
#
# CAVEAT: this hook only loads when the session root IS this repo. Under a
# multi-repo parent root (this repo is a subdir) Claude reads .claude/ from the
# parent, so the hook never fires — the cloud dispatcher is then the only
# bootstrap path. Keep that field correct.
#
# Reliability + faithfulness rationale (yarn Berry, resume loop, NO npm
# fallback) lives in scripts/web-setup.sh and design/new/web-build-environment.md.

set -euo pipefail

# Only run in the remote (web) sandbox. Local dev runs its own setup.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

REPO="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
exec bash "$REPO/scripts/web-setup.sh"
