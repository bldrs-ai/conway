#!/usr/bin/env bash
# Usage: ./scripts/build-GHA.sh <make‑targets…>
# Example: ./scripts/build-GHA.sh ConwayGeomWasmNode ConwayGeomWasmNodeMT

set -euo pipefail

cd "$(dirname "$0")/../dependencies/conway-geom"

chmod +x ../../bin/linux/genie
../../bin/linux/genie gmake

cd gmake
make config=releaseemscripten "$@"
cd ..

mkdir -p Dist
cp ./bin/release/* Dist/
cp ConwayGeomWasm.d.ts Dist/

mkdir -p ../../compiled/dependencies/conway-geom/Dist
cp ./bin/release/* ../../compiled/dependencies/conway-geom/Dist

cd ../../
yarn build-incremental

# Record which conway-geom source these binaries came from. Stamped here,
# at the point Dist is written, rather than in each package.json wrapper:
# there are a dozen build entry points and a check that rejects a correctly
# rebuilt tree is one people learn to bypass (conway#717 review).
yarn wasm-stamp
