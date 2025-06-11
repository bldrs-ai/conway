#!/bin/bash
set -e

# Navigate to the parent directory
cd ..

# Clone EMSDK if it doesn't already exist
if [ ! -d "./emsdk" ]; then
  git clone https://github.com/emscripten-core/emsdk.git
fi

cd emsdk

# Install and activate version 3.1.72
./emsdk install 3.1.72
./emsdk activate 3.1.72

# Optionally set environment variables for current shell session
source ./emsdk_env.sh
