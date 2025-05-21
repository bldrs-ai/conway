Do not try and run yarn setup again. It has already been run in the environment setup. 


To build, run yarn build-codex-MT. To test, run yarn test. If only making changes to the typescript code in conway, you can run yarn build-incremental. If making changes to conway-geom, you need to run a full yarn build-codex-MT. 

Run chmod +x on scripts/build-codex.sh before trying to call yarn build-codex-MT.


This repo uses yarn 1.22.22. 