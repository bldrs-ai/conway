#!/usr/bin/env python3
"""Markdown summary of one PR-regression shard, for the PR comment.

Before sharding, this diff lived inline in `run-ifc-regression` and the
whole report was one job's PR comment. The baseline side has to be read
out of the corpus repo at the pinned commit, and only the shard job has
that checkout, so each shard writes its own fragment and the aggregator
concatenates them.

What a reviewer needs is the DELTA. The full `errors.csv` repeats a
couple dozen pages of long-standing, already-triaged output on every
PR; row counts always show, full rows only for entries added or
resolved vs the baseline. `failed.csv` additionally prints all current
rows when non-empty — hard failures are rare and always worth reading.

Both sides are scoped to the shard's own model list: the batch only
regenerated those, so baseline rows for every OTHER model in the corpus
would otherwise count as "resolved" (the phantom "602 resolved" seen on
the first smoke run, conway#443).
"""

from __future__ import annotations

import argparse
import csv
import io
import subprocess
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from shard_list import parse_shard  # noqa: E402 - needs the path above

# Per-table row caps. Ten fragments share one PR comment, and GitHub
# rejects a comment body over 65536 characters.
MAX_ROWS = 20
MAX_PERF_ROWS = 5

PERF_COLUMNS = ('file', 'status', 'parseTimeMs', 'geometryTimeMs',
                'totalTimeMs', 'rssMb', 'heapUsedMb')


def _clean(row: list[str]) -> tuple[str, ...]:
    """Flatten a CSV row so it cannot break out of a markdown table."""
    return tuple(
        field.replace('\n', ' ').replace('\r', ' ').replace('|', '\\|')
        for field in row)


def _parse(text: str) -> tuple[list[str], list[tuple[str, ...]]]:
    rows = list(csv.reader(io.StringIO(text)))
    if not rows:
        return [], []
    return rows[0], [_clean(row) for row in rows[1:]]


def _table(header: list[str], rows: list[tuple[str, ...]],
           limit: int = MAX_ROWS) -> str:
    out = ['| ' + ' | '.join(header) + ' |', '|' + ' --- |' * len(header)]
    out += ['| ' + ' | '.join(row) + ' |' for row in rows[:limit]]
    if len(rows) > limit:
        out += ['', f'_...and {len(rows) - limit} more row(s); '
                    'full CSV in the shard artifact._']
    return '\n'.join(out)


def _details(summary: str, body: str) -> str:
    return f'<details><summary>{summary}</summary>\n\n{body}\n\n</details>'


def _baseline(root: Path, sha: str, name: str) -> tuple[bool, str]:
    """The report as committed at the pinned corpus commit."""
    done = subprocess.run(
        ['git', '-C', str(root), 'show',
         f'{sha}:regression/test_models/{name}'],
        capture_output=True, text=True, check=False)
    return done.returncode == 0, done.stdout


def _report_section(root: Path, sha: str, name: str, scope: set[str],
                    empty_msg: str, mode: str) -> list[str]:
    current_path = root / 'regression' / 'test_models' / name
    if not current_path.is_file():
        return [f'_No {name} produced._']

    header, current = _parse(current_path.read_text(encoding='utf-8'))
    has_baseline, baseline_text = _baseline(root, sha, name)
    baseline = _parse(baseline_text)[1] if has_baseline else []

    if 'file' in header:
        index = header.index('file')
        in_scope = (lambda row: len(row) > index and row[index] in scope)
        baseline = [row for row in baseline if in_scope(row)]
        current = [row for row in current if in_scope(row)]

    lines: list[str] = []
    if not current:
        lines.append(empty_msg)
    else:
        lines.append(f'**{len(current)}** row(s) '
                     f'(baseline **{len(baseline)}**, scoped to this shard).')
    if not has_baseline:
        lines.append(f'_No {name} at the pinned corpus commit — '
                     'every row counts as new._')
    if current and mode == 'full':
        lines += ['', _table(header, current)]

    added = list((Counter(current) - Counter(baseline)).elements())
    resolved = list((Counter(baseline) - Counter(current)).elements())
    if added or resolved:
        bits = ([f'{len(added)} new'] if added else []) + \
               ([f'{len(resolved)} resolved'] if resolved else [])
        lines += ['', f'**Changes vs baseline:** {", ".join(bits)}.']
        if added:
            lines += ['', _details(f'New ({len(added)})',
                                   _table(header, added))]
        if resolved:
            lines += ['', _details(f'Resolved ({len(resolved)})',
                                   _table(header, resolved))]
    elif current:
        lines.append('No changes vs baseline.')
    return lines


def _perf_section(perf: Path) -> list[str]:
    if not perf.is_file():
        return ['_No perf.csv produced._']
    with perf.open(newline='', encoding='utf-8') as fh:
        rows = list(csv.DictReader(fh))
    if not rows:
        return ['_perf.csv is empty._']

    def total(row: dict[str, str]) -> int:
        try:
            return int(row.get('totalTimeMs', '0') or 0)
        except ValueError:
            return 0

    rows.sort(key=total, reverse=True)
    header = list(PERF_COLUMNS)
    table = _table(header,
                   [tuple(row.get(col, '') for col in header) for row in rows],
                   limit=MAX_PERF_ROWS)
    shown = min(MAX_PERF_ROWS, len(rows))
    # These come from a --parallel run (models contend), so they are a
    # smoke signal only — the clean per-model record is perf-three-*.
    return [table, '',
            f'_Top {shown} of {len(rows)} by totalTimeMs; contended '
            '(--parallel), so coarse._']


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--shard-id', required=True)
    parser.add_argument('--shard-file', required=True)
    parser.add_argument('--root', required=True,
                        help='corpus checkout root (the `models` directory)')
    parser.add_argument('--sha', required=True,
                        help='pinned corpus commit, the baseline side')
    parser.add_argument('--perf', required=True)
    parser.add_argument('--out', required=True)
    args = parser.parse_args()

    corpus, names = parse_shard(args.shard_file)
    root = Path(args.root)
    scope = set(names)

    lines = [f'<h3>{args.shard_id} <sub>({corpus}, {len(names)} '
             f'model(s))</sub></h3>', '']
    lines += ['**failed.csv:**', '']
    lines += _report_section(root, args.sha, 'failed.csv', scope,
                            'No failures :white_check_mark:', 'full')
    lines += ['', '**errors.csv:**', '']
    lines += _report_section(root, args.sha, 'errors.csv', scope,
                            'No errors found.', 'diff')
    lines += ['', '**Performance:**', '']
    lines += _perf_section(Path(args.perf))
    lines.append('')

    Path(args.out).write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f'wrote {args.out} ({len(lines)} line(s))')


if __name__ == '__main__':
    main()
