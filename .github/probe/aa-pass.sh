#!/usr/bin/env bash
#
# One pass of the A/A null test (.github/workflows/perf-aa-null.yml).
#
# THIS FILE EXISTS SO THE PASSES CANNOT DRIFT APART. The experiment's entire
# claim is that nothing differs between passes except position in the sequence,
# so the invocation is written once and every pass calls it with a name. Four
# copies of the same command block in the YAML would put that claim at the
# mercy of a copy-paste.
#
# The flags mirror rc-regression.yml's blessed pass exactly — same exclude,
# `--concurrency 1` (serial, which is what makes the per-model numbers usable),
# `--timeout 300000`, `--parallel --mem-utilization 90`, and
# CONWAY_PERF_EXPOSE_GC=1 set by the caller — so `totalTimeMs` here is the
# quantity the rc gate computes on and not a lookalike from a bespoke harness.
#
# `output_folder` STAYS RELATIVE, for the reason rc-regression.yml spells out
# on its paired pass: the batch ends every run with `git diff -- <output>`
# executed inside the model checkout, and an absolute path makes git exit 128
# with "is outside repository". A relative `aa-<name>-out` resolves to nothing
# there and diffs empty. Each pass gets its OWN empty output folder so no pass
# ever writes over a previous pass's digests — a fresh mkdir on every pass is
# one less way for pass 2 to differ from pass 1.
#
# Usage: .github/probe/aa-pass.sh <PASS_NAME>

set -euo pipefail

NAME="${1:?usage: aa-pass.sh <PASS_NAME>}"
OUT="aa-${NAME}-out"
RESIDENCY="aa-residency-${NAME}.txt"

rm -rf "${OUT}"

# Page-cache residency of the corpus on either side of the pass. This is the
# direct evidence for how cold P1 actually was, which decides whether the
# faithful three-pass result understates the bias a larger-than-RAM corpus
# would see. `|| true` throughout: vmtouch is a diagnostic, and a missing one
# must not fail a pass that would otherwise have produced numbers.
{
  echo "=== ${NAME} corpus residency BEFORE ==="
  vmtouch models 2>&1 || echo "(vmtouch unavailable)"
  echo "=== ${NAME} free -m BEFORE ==="
  free -m 2>&1 || true
} | tee "${RESIDENCY}" || true

START=$(date +%s)

node --experimental-specifier-resolution=node \
  ./compiled/src/ifc/ifc_regression_batch_main.js \
  -e 'sp-.*\.ifc|cg4.*-cylinder\.stp' \
  --concurrency 1 \
  --timeout 300000 \
  --perf "${GITHUB_WORKSPACE}/perf-${NAME}.csv" \
  models \
  "${OUT}" \
  --parallel --mem-utilization 90

END=$(date +%s)

{
  echo "=== ${NAME} corpus residency AFTER ==="
  vmtouch models 2>&1 || echo "(vmtouch unavailable)"
  echo "=== ${NAME} free -m AFTER ==="
  free -m 2>&1 || true
} | tee -a "${RESIDENCY}" || true

echo "AA_PASS_WALL_SECONDS_${NAME}=$((END - START))"
echo "AA_PASS_ROWS_${NAME}=$(($(wc -l < "${GITHUB_WORKSPACE}/perf-${NAME}.csv") - 1))"
