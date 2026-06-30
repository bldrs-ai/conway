Dependencies are bootstrapped by `scripts/web-setup.sh` (run from the cloud
environment setup script and/or the SessionStart hook). If `node_modules` is
already present, it has run — don't redo it. If `node_modules` is **absent**, the
bootstrap failed; re-run `bash scripts/web-setup.sh` and, if it still fails,
report it (see the install-failure rule below) — do not improvise an install.


To build, run yarn build-codex-MT. To test, run yarn test. If only making changes to the typescript code in conway, you can run yarn build-incremental. If making changes to conway-geom, you need to run a full yarn build-codex-MT. 

Run chmod +x on scripts/build-codex.sh before trying to call yarn build-codex-MT.


This repo uses **yarn Berry (4.9.2)**, vendored at `.yarn/releases/` and pinned
via `package.json#packageManager` + `.yarnrc.yml` (`nodeLinker: node-modules`).
In the web sandbox, corepack can't self-bootstrap yarn (its download host is
egress-blocked), so `scripts/web-setup.sh` installs a `yarn` PATH shim that execs
the vendored binary — `yarn <cmd>` then works normally. If `yarn` ever errors
trying to reach `repo.yarnpkg.com`, call it directly:
`node .yarn/releases/yarn-4.9.2.cjs <cmd>`. CI activates Berry with
`corepack enable` (the runner network is unrestricted).

## Install failures: stop, do not improvise

If `yarn install` / `yarn setup` fails (commonly `error Error: aborted` in
Claude Code on the web — the sandbox egress resets sustained installer
connections), **stop and report it**. Do NOT route around it:

- Do NOT hand-edit `yarn.lock`, switch the registry, or point resolved URLs at a
  different host.
- Do NOT hand-fetch tarballs (curl/wget) and splice them into the cache or tree.
- Do NOT fall back to `npm install` — npm re-resolves without `yarn.lock` and
  installs a tree that **drifts** from the lockfile (different hoist; the
  ts-jest/babel-jest peer conflict yarn tolerates). An unfaithful tree is worse
  than a clear failure.

Root cause and the real fix (Berry vendored + cached setup script, or
zero-install) are in `design/new/web-build-environment.md`. Note: `node_modules`
may be **absent** despite the "setup already ran" line above, when that setup
install failed — if so, report it rather than silently working around it.