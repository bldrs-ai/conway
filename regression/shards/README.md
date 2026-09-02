# PR regression shards

Ready-PR digest CI is **at most 10 shards** on free `ubuntu-24.04`.
Each shard skip-smudges its corpus and LFS-pulls only the files in its
list, so a 900 MB headline model fits on the 14 GB disk.

| Shard | Corpus | Why |
|---|---|---|
| `coverage-1` … `coverage-3` | public `test-models` | Small/fast models for schema and exporter spread. Lists union to [`../smoke_models.txt`](../smoke_models.txt). |
| `psb`, `d3d`, `ilna`, `dowa`, `orbiter`, `blsn`, `hospital` | private `test-models-private` | One headline model each. A few-minute load gets its own machine so a regression there cannot hide behind a short coverage batch. |

Private shards need `TEST_MODELS_PRIVATE_TOKEN`. Forks without it skip
those shards; public coverage still runs. Visual-diff is **public
coverage only** — rendering private models would publish them onto
`visual-diff-assets`.

The full public+private corpora still run once per `rc-*` tag
(`rc-regression.yml`).

Do not add an 11th shard. If a new headline model needs isolation,
merge two coverage lists or move a small headline into coverage.
