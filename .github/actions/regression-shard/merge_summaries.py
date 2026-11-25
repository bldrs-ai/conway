#!/usr/bin/env python3
"""Concatenate per-shard summary fragments into one PR comment body.

Each shard writes `shard_summary.md` into its own artifact (see
shard_summary.py); the aggregator downloads them all and this stitches
them together, so the reviewer still gets one comment the way the
single-job report used to read.

A shard whose fragment is missing is called out rather than skipped: it
means the job died before the summary step, which is exactly the case
a silent omission would hide. "Missing" is judged against what this run
SELECTED: a headline shard that alsocheck did not name, or that a pull
request never runs, is reported as not selected, not as failed.

Models a PR named on its `alsocheck:` line get their own section ahead
of the fixed shards, so the reviewer reads the models the fix is for
first. See alsocheck.py.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from alsocheck import ALSOCHECK_PRIVATE_ID, ALSOCHECK_PUBLIC_ID  # noqa: E402
from shard_list import shard_entries  # noqa: E402 - needs the path above

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
        (path.stem, shard_entries(str(path))[0])
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


def _json_list(raw: str) -> list[str]:
    try:
        value = json.loads(raw or '[]')
    except json.JSONDecodeError:
        return []
    return [v for v in value if isinstance(v, str)] if isinstance(
        value, list) else []


def _alsocheck_section(public: list[str], private: list[str],
                       headline: list[str],
                       args: argparse.Namespace) -> list[str]:
    """The heading and notes of the alsocheck section.

    Public paths are printed (they are public, and resolve-models only
    passes paths it found in the public corpus); private models appear
    by code only.
    """
    named = ([f'`{c}` (private)' for c in private]
             + [f'`{p}` (public)' for p in public])
    lines = ['### alsocheck', '',
             'Models this PR asked CI to check: ' + ', '.join(named) + '.',
             '']
    notes = []
    if public:
        notes.append(
            'Public: rendered before/after unconditionally in the visual '
            'diff comment, digest change or not.')
    if private and args.alsocheck_private_skipped == 'fork':
        notes.append(
            'Private: **skipped** - a pull request from a fork has no access '
            'to the private corpus, so ' + ', '.join(
                f'`{c}`' for c in private) + ' did not run. A maintainer can '
            'run them with a manual dispatch (`alsocheck` input).')
    elif private:
        in_headline = [c for c in private if c in headline]
        if in_headline and args.private_scope == 'all':
            notes.append(
                'Private: ' + ', '.join(f'`{c}`' for c in in_headline)
                + ' also ran as part of the full headline set below.')
        if args.private_render == 'true':
            notes.append(
                'Private renders: pushed to `bldrs-ai/test-models-private` '
                '(branch `visual-diff-assets`) and linked by code in a '
                'separate comment; the links open only for people with '
                'access to that repo. Nothing private is published here.')
        elif args.private_render == 'no-write-token':
            notes.append(
                'Private renders: **skipped** - '
                '`TEST_MODELS_PRIVATE_WRITE_TOKEN` is not set, and private '
                'renders have no other destination. Regression ran.')
    lines += [f'- {n}' for n in notes] + ([''] if notes else [])
    return lines


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
    parser.add_argument(
        '--private-scope', default='', choices=('', 'all', 'selected', 'none'),
        help='resolve-models: all seven headline shards, the alsocheck '
             'selection, or none. Empty: infer from --private-sha (the '
             'behaviour before alsocheck).')
    parser.add_argument('--private-selected', default='',
                        help='space-separated headline codes alsocheck '
                             'selected (scope "selected")')
    parser.add_argument('--alsocheck-public', default='[]',
                        help='JSON list of public paths alsocheck named')
    parser.add_argument('--alsocheck-private', default='[]',
                        help='JSON list of private codes alsocheck named '
                             '(as requested, before any fork skip)')
    parser.add_argument('--alsocheck-private-skipped', default='',
                        choices=('', 'fork'))
    parser.add_argument(
        '--private-render', default='none',
        choices=('none', 'true', 'no-write-token', 'fork'),
        help='what happens to private alsocheck renders this run')
    args = parser.parse_args()

    root = Path(args.artifacts)
    shards = shard_order(Path(args.shard_dir))

    header = ['## Regression Results (PR shards, IFC + STEP)', '']
    if args.public_sha:
        header.append(f'**Public models:** `bldrs-ai/test-models@'
                      f'{args.public_sha}`')
    if args.private_sha:
        header.append(f'**Private models:** `bldrs-ai/test-models-private@'
                      f'{args.private_sha}`'
                      + (' (alsocheck selection only)'
                         if args.private_scope == 'selected' else ''))
    elif args.private_reason == 'not-on-prs':
        header.append(
            '**Private models:** not run on pull requests. The seven '
            'headline shards (`PSB900`, `D3D224`, `ILNA250`, `DOWA418`, '
            '`O10`, `BLSN282`, `AHMAC555`) run on merge to `main` and on `rc-*` tags — they '
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

    also_public = _json_list(args.alsocheck_public)
    also_private = _json_list(args.alsocheck_private)
    selected = set(args.private_selected.split())
    scope = args.private_scope or ('all' if args.private_sha else 'none')
    headline = [shard for shard, corpus in shards if corpus == 'private']

    # Which fragments this run must have. A private shard that did not
    # run is the NORMAL case on a pull request (they are gated to
    # merge/rc unless alsocheck names one) and on a fork (no token).
    # Reporting either as a failed shard would cry wolf on every PR, so
    # it is accounted for separately - and only a shard that was
    # expected and is absent is "missing".
    if scope == 'all':
        expected_private = set(headline)
    elif scope == 'selected':
        expected_private = selected
    else:
        expected_private = set()

    # alsocheck section: the headline shards it selected (only when the
    # run is not running all seven anyway), then its own jobs.
    also_ids = ([code for code in headline if code in selected]
                if scope == 'selected' else [])
    if also_public:
        also_ids.append(ALSOCHECK_PUBLIC_ID)
    if [c for c in also_private if c not in headline] and \
            args.alsocheck_private_skipped != 'fork':
        also_ids.append(ALSOCHECK_PRIVATE_ID)

    body: list[str] = []
    missing: list[str] = []
    skipped: list[str] = []
    also_body: list[str] = []
    for shard in also_ids:
        text = fragment(root, shard)
        if text is None:
            missing.append(shard)
        else:
            also_body += [text, '']
    for shard, corpus in shards:
        if shard in also_ids:
            continue
        text = fragment(root, shard)
        if text is None:
            if corpus == 'private' and shard not in expected_private:
                skipped.append(shard)
            else:
                missing.append(shard)
            continue
        body += [text, '']

    if skipped:
        if scope == 'selected':
            why = ('not selected - this run\'s alsocheck named only '
                   + ', '.join(f'`{c}`' for c in sorted(selected)))
        elif args.private_reason == 'not-on-prs':
            why = 'not run on pull requests'
        else:
            why = 'no private-models token'
        header += [f'_Headline shards ({why}): '
                   + ', '.join(f'`{shard}`' for shard in skipped) + '._', '']
    if missing:
        header += [
            '> [!WARNING]',
            '> No summary uploaded by: '
            + ', '.join(f'`{shard}`' for shard in missing)
            + '. Those shards were expected to run and failed before they '
              'could report; read their job logs.',
            '',
        ]

    if also_public or also_private:
        section = _alsocheck_section(also_public, also_private, headline,
                                     args)
        # One element each, like a fragment: the per-fragment truncation
        # budget below divides by the number of elements.
        body = (['\n'.join(section).rstrip() + '\n', ''] + also_body
                + (['### Fixed shards\n', ''] if body else []) + body)

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
    total = len(shards) + len(
        [i for i in also_ids if i in (ALSOCHECK_PUBLIC_ID, ALSOCHECK_PRIVATE_ID)])
    print(f'{total - len(missing) - len(skipped)}/{total} shard '
          f'fragment(s), {len(skipped)} not run, {len(missing)} missing, '
          f'{len(out)} char(s) -> {args.out}')
    if github_output := os.environ.get('GITHUB_OUTPUT'):
        with open(github_output, 'a', encoding='utf-8') as fh:
            fh.write(f'missing={len(missing)}\n')


if __name__ == '__main__':
    main()
