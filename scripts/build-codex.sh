#!/usr/bin/env bash
# Usage: ./scripts/build-GHA.sh <make‑targets…>
# Example: ./scripts/build-GHA.sh ConwayGeomWasmNode ConwayGeomWasmNodeMT

set -euo pipefail

chmod +x ../emsdk/emsdk_env.sh
source ../emsdk/emsdk_env.sh

cd "$(dirname "$0")/../dependencies/conway-geom"

chmod +x linux_genie/genie
linux_genie/genie gmake

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
