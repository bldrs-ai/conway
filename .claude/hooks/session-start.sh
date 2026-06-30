#!/usr/bin/env bash
# SessionStart hook (Claude Code on the web).
#
# The heavy bootstrap (install + submodules + build) lives in the shared,
# idempotent scripts/web-setup.sh. The intended place to run it is the cloud
# *environment setup script* (configured in the web UI as
# `bash scripts/web-setup.sh || true` — the `|| true` keeps a transient
# cold-install failure from failing session *creation*), whose filesystem result
# is snapshotted — so a session
# starts with node_modules already present and this hook is a near-instant no-op.
#
# This hook is the fallback: it runs the same shared script for a cold cache (or
# if the environment setup script was never configured). web-setup.sh is
# stamp-gated, so when node_modules is already there it returns immediately.
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
