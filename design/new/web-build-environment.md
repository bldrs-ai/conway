# Web build environment: install reliability & "ready right off"

Status: decided (2026-06). This supersedes the yarn Berry migration (PR #342),
which has been **reverted** — see "Why we are on classic yarn, not Berry" below.
Read this when touching `.claude/hooks/session-start.sh`, the cloud environment
**setup script**, or the dependency toolchain.

## TL;DR

- conway is on **yarn classic (1.22.22)**. Dependencies are bootstrapped by
  `yarn setup` (`yarn install && yarn submodule-update &&
  yarn extract-wasm-dependencies`).
- The real bootstrap runs in the cloud **environment setup script**, whose
  filesystem is **snapshotted** so `node_modules` is present right off in every
  session. The `.claude/hooks/session-start.sh` hook is a stamp-gated fallback
  for local dev / a cold cache.
- The session root may be a **parent dir holding several checkouts** (conway,
  Share, ...), not the conway repo. Set the setup-script field to the multi-repo
  dispatcher below.

## Why we are on classic yarn, not Berry

PR #342 migrated to yarn Berry (vendored 4.9.2) + a kill-and-resume install loop,
to survive an egress that **resets and silently hangs sustained installer
connections**. That diagnosis is real (see "Network, measured" below), but the
migration solved the wrong problem:

- The hostile network is the **in-session** sandbox. **No install runs there** —
  the install runs in the **setup-script phase**, which has a *healthy* network
  (a plain `yarn install` completes in ~1–2 min). So Berry's resume loop,
  vendored binary, PATH shim, and lockfile reformat bought nothing for the
  actual bootstrap path, at the cost of real complexity.
- Berry also broke the natural setup entry point: `yarn setup` is `yarn run
  setup`, and Berry's `yarn run` refuses to start without a completed install
  (`Couldn't find the node_modules state file — findPackageLocation`). The
  bootstrap script can't run via `yarn run` on a cold checkout — a chicken-and-egg.
  Classic `yarn run` has no such requirement (verified: it runs cold), so the
  `yarn setup` convention Just Works.

Net: classic yarn + the snapshotted setup script is simpler and sufficient. If
the **setup-phase** network ever turns hostile too, revisit Berry or a
zero-install (committed cache) — but not before.

## Multi-repo session root (measured 2026-06)

A web session can be rooted at a parent dir (`/home/user`) with conway, Share,
conway-geom and test-models checked out side by side, **not** at the conway repo.
That breaks two single-repo assumptions at once:

1. A repo-relative setup-script field (`bash scripts/web-setup.sh`, or even
   `yarn setup`) run from the parent does not resolve / has no `package.json`,
   and silently no-ops — leaving `node_modules` empty.
2. The `conway/.claude/settings.json` SessionStart hook never loads: Claude reads
   `.claude/` from the **session root** (the parent), not a subdir. So the
   in-session fallback never fires either.

### The fix: a `yarn setup` convention + dispatcher

Each repo exposes its bootstrap as `yarn setup` (conway: the install/submodule/
wasm chain; Share: `yarn install`). Set the cloud **setup-script field** to a
dispatcher that runs `yarn setup` in the CWD if it has that target, else in each
known subrepo, and always exits 0:

```bash
has_setup() { [ -f "$1/package.json" ] && node -e 'process.exit(((require(process.argv[1]+"/package.json").scripts)||{}).setup?0:1)' "$(cd "$1" && pwd)" 2>/dev/null; }
if has_setup .; then yarn setup; else for d in conway Share; do [ -d "$d" ] && has_setup "$d" && ( cd "$d" && yarn setup ); done; fi; true
```

The trailing `true` is load-bearing: a non-zero setup script makes the *session
fail to start* (per the web docs), so a transient cold-install failure would lock
you out. Exiting 0 lets the session start; when the root IS conway the
SessionStart hook then re-runs the bootstrap, surfacing a failure in-session
where it is recoverable. Under a multi-repo parent root the hook does not load,
so the dispatcher is the only bootstrap path — keep it correct.

## Network, measured (this container)

Env: `node v22`; outbound HTTPS via agent proxy at `$HTTPS_PROXY`;
`registry.npmjs.org` is on the proxy's noProxy bypass list.

| Probe | Result |
|---|---|
| `curl` a registry tarball, fresh connection | **200, < 1 s** |
| small `yarn install` (few deps), in-session | completes |
| full-tree `yarn install` (~940 deps), **in-session** | **hangs in the fetch step** — resets and silently-dead sockets accumulate; classic 1.x has no per-request retry and aborts on the first drop |
| full-tree `yarn install`, **setup-script phase** | **completes (~1–2 min)** — healthy network |

Conclusion: a single fresh request is fine; a *sustained* in-session install
wedges. Because the bootstrap runs in the healthy setup phase (and is
snapshotted), classic yarn is enough. Do not "fix" an in-session install by
hand-editing `yarn.lock`, switching registries, hand-fetching tarballs, or
falling back to npm (npm re-resolves and drifts the tree) — if an install must
happen and the in-session egress blocks it, run it from CI / the setup phase or
report the failure.
