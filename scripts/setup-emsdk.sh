#!/bin/bash
set -e

# Single source of truth for local installs; keep in sync with EMSDK_VERSION in
# .github/workflows/build.yml (CI) — goldens/baselines are blessed on that
# toolchain, so a mismatched local emsdk produces spurious digest diffs.
EMSDK_VERSION="${EMSDK_VERSION:-6.0.2}"

# Navigate to the parent directory
cd ..

# Clone EMSDK if it doesn't already exist
if [ ! -d "./emsdk" ]; then
  git clone https://github.com/emscripten-core/emsdk.git
fi

cd emsdk

./emsdk install "$EMSDK_VERSION"
./emsdk activate "$EMSDK_VERSION"

# Optionally set environment variables for current shell session
source ./emsdk_env.sh
