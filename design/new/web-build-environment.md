# Web build environment: install reliability & "ready right off"

Status: investigation + plan (2026-06). Supersedes the ad-hoc npm fallback in
PR #341. Read this when touching `.claude/hooks/session-start.sh`, the cloud
environment **setup script**, the network allowlist, or the yarn version.

## TL;DR

1. The Claude-Code-on-web egress **resets sustained package-manager TLS
   connections.** A long-running `yarn`/`npm` install accumulates dropped
   sockets; a single fresh request (curl) is fine.
2. **yarn classic (1.22.22) cannot recover** — it aborts the whole run on the
   first dropped socket (`error Error: aborted`), on *every* registry/proxy
   path. Per-request-retry installers (npm `--fetch-retries`, Berry `httpRetry`)
   do better but are **still not enough in one shot**: a cold Berry install
   fetched 299 MB then failed on the tail (`YN0001 ReadError: The server aborted
   pending request`, retries exhausted), and a resume sometimes **hangs** in the
   fetch step with no error at all (a dropped socket with no reset event, which
   `httpRetry` waits on forever). The egress both **resets and hangs** sustained
   connections.
2b. **What actually completes: a kill-and-resume loop.** Wrap the install in
   `timeout <N> yarn install` and re-run until it exits 0. Berry's global cache
   (`~/.yarn`, on the snapshotted filesystem) persists between attempts, so each
   attempt resolves in seconds and fetches only the shrinking tail; a hung
   attempt is killed by the timeout and the next one resumes. This converges
   where any single invocation stalls.
3. The heavy bootstrap currently runs in the **SessionStart hook**, which
   re-runs **every session**. The mechanism for "deps present right off" is the
   **environment setup script**, whose filesystem is **snapshotted/cached**
   across sessions.
4. Fix = two independent axes: **(A)** migrate to **Berry, vendored** (faithful
   + completes, kills the drift-y npm fallback); **(B)** move the heavy install
   to the **cached setup script**, leaving the hook a thin stamp-gated guard.

## What was actually measured (this container)

Env: `node v22.22.2`; `yarn` is **entirely corepack** (no standalone classic
binary — `/opt/node22/bin/yarn -> corepack/dist/yarn.js`); outbound HTTPS via
agent proxy at `$HTTPS_PROXY`; `CLAUDE_CODE_PROXY_RESOLVES_HOSTS=true`.

| Probe | Result |
|---|---|
| `node fetch` registry.npmjs.org / registry.yarnpkg.com (no proxy flag) | **200 / 200** — DNS & connect both fine |
| `curl` 9.4 MB `three` tarball, proxied | **200, 0.15–0.7s** |
| `curl` same, direct (`--noproxy`) both registries | **200, 0.13–0.36s** |
| `yarn classic install` proxied (`--network-concurrency 1`, PR #341 cmd) | **`error Error: aborted` in ~46s** |
| `yarn classic install` yarnpkg.com forced direct (`no_proxy`) | retries forever, 0 progress, aborts |
| `yarn classic install` lockfile repointed to npmjs.org (direct) | **`error Error: aborted`** on esbuild tarballs |
| `yarn Berry install` (vendored, `httpRetry:5`), cold | fetched **299 MB** then **failed** on the tail: `YN0001 ReadError: The server aborted pending request` |
| `yarn Berry install`, resume from warm 299 MB cache | resolves in **8 s** (cached), **0 ReadErrors**, then **hangs** in fetch on a dead socket |
| `yarn Berry install` in `timeout`-guarded resume loop | converges — each attempt resumes the cache, kill clears a hung socket |
| corepack download of yarn 4 from `repo.yarnpkg.com` | **403 (blocked egress host)** |

Conclusions:
- **The DNS-bypass theory (#37782) does not apply here** — Node resolves and
  connects fine. The failure is connection *resets on sustained installs*, not
  name resolution.
- **Registry/proxy choice doesn't save yarn classic** — it aborts on every
  path. The differentiator is *per-request retry*, which classic lacks.
- **corepack cannot bootstrap Berry here**: its source host `repo.yarnpkg.com`
  is not on the egress allowlist (the allowlist has `yarnpkg.com` and
  `registry.yarnpkg.com`, not `repo.yarnpkg.com`). Berry must be **vendored**
  (`.yarn/releases/yarn-4.x.cjs`, fetched from github/npm — both allowed — and
  committed) and referenced via `yarnPath:`.

## Why PR #341 is only a band-aid

PR #341's primary path (`yarn install --network-concurrency 1
--network-timeout 600000`) **always fails here** (reproduced), so it always
falls through to the npm fallback. `npm install` (no `package-lock.json`)
re-resolves version ranges and hoists differently → the installed tree
**drifts from `yarn.lock`** (versions and layout). It keeps TS dev limping
(lint/typecheck/build) but the tree is not lockfile-faithful — exactly the
"route around a failing install by rewriting the tree" reflex we want to stop.

## There is already a setup script — it is silently failing

`AGENTS.md` says *"Do not try and run yarn setup again. It has already been run
in the environment setup."* So the cloud environment **already** runs `yarn
setup` (= `yarn install && yarn submodule-update && yarn
extract-wasm-dependencies`) as its setup script. But sessions start with an
**empty `node_modules`**: that `yarn setup` is yarn **classic**, so it aborts on
the egress (reproduced above) and leaves no deps — and then `AGENTS.md` tells the
next agent *not* to re-install, so the session is wedged. The fix is not to
introduce a setup script; it is to make the existing one's install **reliable**
(Berry + resume loop) or **network-free** (zero-install), and to correct the
"yarn 1.22.22" / "don't run setup" guidance.

## Lifecycle: setup script (cached) vs SessionStart hook (every session)

Per the [web docs](https://code.claude.com/docs/en/claude-code-on-the-web):

| | Setup script | SessionStart hook (today) |
|---|---|---|
| Configured in | Cloud environment UI | repo `.claude/settings.json` |
| Runs | Once, before Claude launches | **Every** session, after launch |
| **Snapshotted/cached** | **Yes** — files persist across sessions | **No** |
| Re-runs when | setup script or allowlist changes, ~7-day expiry | always |
| Time budget | keep ≲ 5 min so the cache can build | adds latency every session |

So the heavy install belongs in the **setup script** (cached → "ready right
off"); the SessionStart hook should shrink to a fast guard that is a no-op when
the snapshot already has up-to-date `node_modules` (and still covers local dev +
a cold cache). The EMSDK/WASM toolchain is already correctly on-demand
(`.claude/hooks/wasm-setup.sh`), off the every-session path.

**Set the setup-script field to the multi-repo dispatcher below, not a bare
`bash scripts/web-setup.sh`.** Two reasons: (1) the session root may be a *parent
dir holding several checkouts* (conway, Share, ...), where a repo-relative
`scripts/web-setup.sh` does not resolve and silently no-ops under the field's
`|| true`; (2) a non-zero setup script makes the *session fail to start* (per the
web docs), so a transient cold-install failure on the flaky egress would lock you
out with no way in to fix it. Each repo exposes its bootstrap as `yarn setup`
(conway's runs this script); the dispatcher runs `yarn setup` in the CWD if it
has that target, else in each known subrepo, and always exits 0:

```bash
has_setup() { [ -f "$1/package.json" ] && node -e 'process.exit(((require(process.argv[1]+"/package.json").scripts)||{}).setup?0:1)' "$(cd "$1" && pwd)" 2>/dev/null; }
if has_setup .; then yarn setup; else for d in conway Share; do [ -d "$d" ] && has_setup "$d" && ( cd "$d" && yarn setup ); done; fi; true
```

The trailing `true` is the load-bearing equivalent of the old `|| true`. When the
root IS conway the SessionStart hook then re-runs the same script and — unlike the
setup script — a non-zero hook does **not** block the session, so a failure
surfaces in-session where it is recoverable. Under a multi-repo parent root the
hook does **not** load (Claude reads `.claude/` from the parent), so the
dispatcher is the only bootstrap path — keep it correct.

### Multi-repo session root (measured 2026-06)

A web session can be rooted at a parent dir (`/home/user`) with conway, Share,
conway-geom and test-models checked out side by side, **not** at the conway repo.
That broke the original single-repo assumptions on two axes at once: the
setup-script field `bash scripts/web-setup.sh || true` ran from the parent (no
such path → silent no-op → empty `node_modules`), and the SessionStart hook in
`conway/.claude/settings.json` never loaded (Claude reads `.claude/` from the
parent root). The fix is the `yarn setup` convention + dispatcher above. Note the
in-session egress is as hostile as ever — the Berry fetch still hangs at the
sustained-install stage in a live session; what makes `yarn setup` complete is
that the **setup-script phase runs in a healthier network context** and is
snapshotted, so the dispatcher belongs in the cloud field, not relied on via the
in-session hook.

### Snapshot invalidation (and why the install gate hashes the lockfile)

The environment snapshot is rebuilt **only** when (a) the setup-script text
changes, (b) the network-allowlist changes, or (c) it hits its ~7-day expiry.
Crucially it is keyed on the environment config, **not the repo** — a new commit
/ changed `package.json` / changed `yarn.lock` does **not** bust it. So a bare
"node_modules exists" stamp would let a warm snapshot serve **stale deps** after
a dependency bump until the 7-day expiry. `scripts/web-setup.sh` therefore gates
the install on a **hash of `yarn.lock` + `package.json`**: unchanged inputs are
an instant no-op every session (like an up-to-date local `yarn install`); a
changed lockfile forces a re-install; and the 7-day rebuild is the slow
"inch-along" path. Manual bust: edit the setup-script field to force a fresh
snapshot.

## Plan

**Axis A — Reliability (Berry, vendored, + kill-and-resume loop).** Adopt yarn 4
*without* corepack:
- commit `.yarn/releases/yarn-4.9.2.cjs` (fetched from raw.githubusercontent /
  npm), set `yarnPath:` in `.yarnrc.yml`, add `packageManager: "yarn@4.9.2"`.
- `.yarnrc.yml`: `nodeLinker: node-modules`, `httpRetry: 10`,
  `networkConcurrency: 2`. (Keep `enableGlobalCache: true` — the global cache is
  what makes resume cheap.)
- Convert `yarn.lock` to Berry format (commit it).
- **Wrap the install in a `timeout`-guarded resume loop** (the bootstrap script,
  not `.yarnrc.yml`): `for i in 1..N: timeout 150 yarn install --mode=skip-build
  && break`. `httpRetry` alone is insufficient (the egress hangs as well as
  resets); the timeout clears a hung socket and the warm global cache makes the
  next attempt resume in seconds. Run builds (`--mode=skip-build` off / a second
  `yarn install`) only after fetch+link succeed.
- Husky: Berry drops `husky install`; move to the modern `.husky/` layout
  (`prepare: husky` or drop the script and keep the hook files).
- CI `build.yml`: drop corepack reliance, use the vendored `yarnPath`; adjust
  `actions/setup-node` cache mode. CI runs on GitHub runners (no agent proxy),
  so it is unaffected by the reset issue — this is a faithfulness/version change
  only. **Validate a full green CI run before merging.**

**Axis B — Ready right off (cached setup script).** Move
install+submodule+`build-incremental` into the environment **setup script**
(cloud UI). Reduce `.claude/hooks/session-start.sh` to a stamp-gated guard.
Keep WASM/EMSDK on-demand. If the Berry install does not fit the ~5 min cache
window, either background the bulk from the setup script or keep it in the hook
(reliable + stamped — still strictly better than today).

**Axis C — Guardrail.** CLAUDE.md / deny rule: never hand-edit `yarn.lock` or
switch registries to dodge an install failure; if install fails, **stop and
report**. (Removes the improvisation reflex even on a genuinely flaky day.)

**Env-config note (cloud UI, not repo).** If corepack self-bootstrap is ever
wanted, add `repo.yarnpkg.com` to the environment's Custom allowlist — not
needed once Berry is vendored.
