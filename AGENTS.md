Do not try and run yarn setup again. It has already been run in the environment setup. 


To build, run yarn build-codex-MT. To test, run yarn test. If only making changes to the typescript code in conway, you can run yarn build-incremental. If making changes to conway-geom, you need to run a full yarn build-codex-MT. 

Run chmod +x on scripts/build-codex.sh before trying to call yarn build-codex-MT.


This repo uses yarn 1.22.22.

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