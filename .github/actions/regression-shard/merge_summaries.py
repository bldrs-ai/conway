#!/usr/bin/env python3
"""Concatenate per-shard summary fragments into one PR comment body.

Each shard writes `shard_summary.md` into its own artifact (see
shard_summary.py); the aggregator downloads them all and this stitches
them together, so the reviewer still gets one comment the way the
single-job report used to read.

A shard whose fragment is missing is called out rather than skipped: it
means the job died before the summary step, which is exactly the case
a silent omission would hide.
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from shard_list import parse_shard  # noqa: E402 - needs the path above

# GitHub rejects an issue-comment body over 65536 characters. Leave room
# for the truncation notice itself.
MAX_BODY = 60000


def shard_order(shard_dir: Path) -> list[tuple[str, str]]:
    """(shard id, corpus) in report order: coverage first, then headlines.

    Deliberately derived from the lists rather than the matrix, so the
    comment keeps a stable order without the aggregator having to know
    the matrix. `shard_list.py check` is what keeps the two in step.
    """
    shards = sorted(
        (path.stem, parse_shard(str(path))[0])
        for path in shard_dir.glob('*.txt'))
    coverage = [s for s in shards if s[0].startswith('coverage-')]
    return coverage + [s for s in shards if s not in coverage]


def fragment(root: Path, shard: str) -> str | None:
    """This shard's fragment, from the artifact download tree."""
    # download-artifact with merge-multiple:false lands each artifact in
    # a directory named after it.
    direct = root / f'regression-shard-{shard}' / 'shard_summary.md'
    if direct.is_file():
        return direct.read_text(encoding='utf-8')
    return None


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--artifacts', required=True)
    parser.add_argument('--shard-dir', default='regression/shards')
    parser.add_argument('--out', required=True)
    parser.add_argument('--public-sha', default='')
    parser.add_argument('--private-sha', default='')
    parser.add_argument('--package', default='')
    parser.add_argument('--run-url', default='')
    parser.add_argument('--visual-diff-count', default='0')
    parser.add_argument(
        '--private-reason', default='no-token',
        choices=('no-token', 'not-on-prs'),
        help='why the private headline shards did not run, when they did not')
    args = parser.parse_args()

    root = Path(args.artifacts)
    shards = shard_order(Path(args.shard_dir))

    header = ['## Regression Results (PR shards, IFC + STEP)', '']
    if args.public_sha:
        header.append(f'**Public models:** `bldrs-ai/test-models@'
                      f'{args.public_sha}`')
    if args.private_sha:
        header.append(f'**Private models:** `bldrs-ai/test-models-private@'
                      f'{args.private_sha}`')
    elif args.private_reason == 'not-on-prs':
        header.append(
            '**Private models:** not run on pull requests. The seven '
            'headline shards (PSB, D3D, ILNA, DOWA, Orbiter, BLSN, '
            'Hospital) run on merge to `main` and on `rc-*` tags — they '
            'cannot be cached on a public repo, so running them per push '
            'would spend ~2.6 GB of private LFS each time. See '
            '`regression/shards/README.md`.')
    else:
        header.append('**Private models:** skipped '
                      '(no `TEST_MODELS_PRIVATE_TOKEN` — expected on a fork).')
    header += [
        '',
        'Digest *changes* are informational — they are reviewed in the '
        'visual diff and blessed at the rc. A row in `failed.csv`, or an '
        'un-allowlisted zero-geometry model, is what fails the check. '
        'The full public+private corpus runs once per release candidate '
        '(`rc-*` tag, see `rc-regression.yml`).',
        '',
    ]
    if args.visual_diff_count != '0':
        header += [f'**Visual diff:** {args.visual_diff_count} public '
                   'model(s) changed digests; see the `visual-diff` job.', '']
    if args.package:
        header += [f'**NPM package artifact:** `{args.package}`'
                   + (f' — [this run\'s artifacts]({args.run_url})'
                      if args.run_url else ''), '']

    # A private shard that did not run is the NORMAL case on a pull
    # request (they are gated to merge/rc) and on a fork (no token).
    # Reporting either as a failed shard would cry wolf on every PR, so
    # it is accounted for separately.
    private_skipped = not args.private_sha

    body: list[str] = []
    missing: list[str] = []
    skipped: list[str] = []
    for shard, corpus in shards:
        text = fragment(root, shard)
        if text is None:
            (skipped if corpus == 'private' and private_skipped
             else missing).append(shard)
            continue
        body += [text, '']

    if skipped:
        why = ('not run on pull requests'
               if args.private_reason == 'not-on-prs'
               else 'no private-models token')
        header += [f'_Headline shards ({why}): '
                   + ', '.join(f'`{shard}`' for shard in skipped) + '._', '']
    if missing:
        header += [
            '> [!WARNING]',
            '> No summary uploaded by: '
            + ', '.join(f'`{shard}`' for shard in missing)
            + '. Those shards failed before they could report; read their '
              'job logs.',
            '',
        ]

    out = '\n'.join(header + body).rstrip() + '\n'
    if len(out) > MAX_BODY:
        # Trimming the tail would delete whole shards, and the headline
        # shards sort LAST -- so the one fragment quoting the model that
        # just crashed is the first thing to go. That is the exact
        # regression this report exists to fix. Budget per fragment
        # instead: every shard keeps its head, which is where its counts
        # and its failed.csv rows are.
        budget = max(600, (MAX_BODY - len('\n'.join(header))) // max(1, len(body) // 2 or 1))
        trimmed = []
        for text in body:
            if len(text) > budget:
                text = (text[:budget].rsplit('\n', 1)[0]
                        + '\n\n_...fragment truncated; full CSVs in this '
                          'shard\'s `regression-shard-*` artifact._\n')
            trimmed.append(text)
        out = '\n'.join(header + trimmed).rstrip() + '\n'
    if len(out) > MAX_BODY:
        out = (out[:MAX_BODY].rsplit('\n', 1)[0]
               + '\n\n_...truncated; full per-shard CSVs are in the '
                 '`regression-shard-*` run artifacts._\n')
    Path(args.out).write_text(out, encoding='utf-8')
    print(f'{len(shards) - len(missing) - len(skipped)}/{len(shards)} shard '
          f'fragment(s), {len(skipped)} not run, {len(missing)} missing, '
          f'{len(out)} char(s) -> {args.out}')
    if github_output := os.environ.get('GITHUB_OUTPUT'):
        with open(github_output, 'a', encoding='utf-8') as fh:
            fh.write(f'missing={len(missing)}\n')


if __name__ == '__main__':
    main()
