#!/usr/bin/env python3
"""Helpers for PR-regression shards (regression/shards/*.txt)."""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
from pathlib import Path


def parse_shard(path: str) -> tuple[str, list[str]]:
    """Return (corpus, basenames) from a shard list file."""
    corpus = 'public'
    names: list[str] = []
    with open(path, encoding='utf-8') as fh:
        for line in fh:
            raw = line.strip()
            if raw.startswith('# corpus:'):
                corpus = raw.split(':', 1)[1].strip()
                continue
            if not raw or raw.startswith('#'):
                continue
            names.append(raw)
    if not names:
        raise SystemExit(f'{path} selected no models')
    if corpus not in ('public', 'private'):
        raise SystemExit(f'{path}: unknown corpus {corpus!r}')
    return corpus, names


def exclude_regex(names: list[str]) -> str:
    """Batch CLI exclude regex: model FILES whose basename is NOT in names."""
    alts = '|'.join(re.escape(n) for n in names)
    return (
        rf'^(?!.*/(?:{alts})$)'
        r'.*\.(?:[iI][fF][cC]|[sS][tT][eE][pP]|[sS][tT][pP])$'
    )


def find_paths(root: Path, names: list[str]) -> list[str]:
    """Relative posix paths under root/ifc and root/step matching basenames."""
    want = set(names)
    paths: list[str] = []
    for top in ('ifc', 'step'):
        base = root / top
        if not base.is_dir():
            continue
        for p in base.rglob('*'):
            if p.is_file() and p.name in want:
                paths.append(p.relative_to(root).as_posix())
    missing = want - {Path(p).name for p in paths}
    if missing:
        raise SystemExit(
            'shard names not in corpus: ' + ', '.join(sorted(missing)))
    # A basename can match more than one path (the public corpus has both
    # ifc/index.ifc and ifc/bldrs/index.ifc). Both get digested and both
    # write the same <stem>.csv, so one silently overwrites the other and
    # the visual diff may render whichever the walk reached first. Sorting
    # at least makes that deterministic, and saying so makes it findable;
    # disambiguating properly needs a path-valued shard list, not a
    # basename one.
    paths.sort()
    for name in sorted(want):
        matches = [p for p in paths if Path(p).name == name]
        if len(matches) > 1:
            print(
                f'::warning::{name} matches {len(matches)} corpus paths '
                f'({", ".join(matches)}); they share one digest CSV, so '
                f'{matches[0]} is the one whose digest survives.')
    return paths


def is_lfs_stub(path: Path) -> bool:
    """True if path is an unsmudged LFS pointer rather than the model.

    Reads only the pointer-sized prefix: these files run to ~900 MB, and
    slurping one to look at its first 200 bytes is a 900 MB allocation.
    """
    with path.open('rb') as fh:
        head = fh.read(200)
    return head.startswith(b'version https://git-lfs') or b'git-lfs.github.com' in head


def cmd_regex(args: argparse.Namespace) -> None:
    _, names = parse_shard(args.shard)
    print(exclude_regex(names), end='')


def cmd_corpus(args: argparse.Namespace) -> None:
    corpus, _ = parse_shard(args.shard)
    print(corpus, end='')


def cmd_names(args: argparse.Namespace) -> None:
    _, names = parse_shard(args.shard)
    print('\n'.join(names))


MAX_SHARDS = 10


def cmd_check(args: argparse.Namespace) -> None:
    """Validate regression/shards against the invariants the docs state.

    Cheap, hermetic, and wired into `build` so it gates every PR
    including drafts and forks. The invariants are not self-enforcing:
    the shard `# corpus:` header and the workflow matrix are separate
    declarations, a shard file with no matrix entry never runs at all,
    and `smoke_models.txt` is now only documentation of the coverage
    union, so nothing else would notice it drifting.
    """
    shard_dir = Path(args.shard_dir)
    smoke = Path(args.smoke)
    errors: list[str] = []

    files = sorted(p for p in shard_dir.glob('*.txt'))
    if not files:
        raise SystemExit(f'no shard lists in {shard_dir}')
    if len(files) > MAX_SHARDS:
        errors.append(
            f'{len(files)} shard lists, max is {MAX_SHARDS} '
            '(regression/shards/README.md)')

    # basename -> shard that claims it. A model in two shards is digested
    # twice and billed twice, and its visual-diff row would dedupe to one
    # for no stated reason.
    owner: dict[str, str] = {}
    coverage: set[str] = set()
    corpora: dict[str, str] = {}
    for path in files:
        stem = path.stem
        corpus, names = parse_shard(str(path))
        corpora[stem] = corpus
        seen: set[str] = set()
        for name in names:
            if name in seen:
                errors.append(f'{path.name}: duplicate entry {name!r}')
            seen.add(name)
            if name in owner:
                errors.append(
                    f'{name!r} is listed in both {owner[name]} and {stem}')
            else:
                owner[name] = stem
        if stem.startswith('coverage-'):
            if corpus != 'public':
                errors.append(
                    f'{path.name}: coverage shards must be public, not '
                    f'{corpus!r} — visual-diff renders them and would '
                    'publish private models')
            coverage |= seen

    smoke_names = {
        line.split('#', 1)[0].strip()
        for line in smoke.read_text(encoding='utf-8').splitlines()
    } - {''}
    if coverage != smoke_names:
        for name in sorted(smoke_names - coverage):
            errors.append(f'{smoke.name} lists {name!r}, no coverage shard does')
        for name in sorted(coverage - smoke_names):
            errors.append(f'a coverage shard lists {name!r}, {smoke.name} does not')

    errors.extend(_matrix_errors(Path(args.workflow), corpora))

    if errors:
        for message in errors:
            print(f'::error::{message}')
        raise SystemExit(1)
    print(
        f'{len(files)} shard list(s) OK: {len(coverage)} public coverage '
        f'models (= {smoke.name}), '
        f'{len(owner) - len(coverage)} headline model(s).')


def _matrix_entries(workflow: Path) -> tuple[dict[str, str], list[str]]:
    """{shard id: corpus} from the workflow's regression-shard matrix.

    Prefers PyYAML, falls back to a strict scan of the `include:` block,
    and raises if neither works. It must never degrade to "no errors":
    this cross-check is the only thing standing between a shard list and
    never running, and PyYAML is NOT installed by this repo's CI (codex
    flagged exactly that - the check used to print a notice and exit 0,
    so it had never actually run).
    """
    text = workflow.read_text(encoding='utf-8')
    try:
        import yaml  # noqa: PLC0415 - optional, see docstring
    except ImportError:
        return _scan_matrix_include(text, workflow)

    # GitHub's `on:` key parses as the boolean True under YAML 1.1;
    # harmless here, we only read `jobs`.
    spec = yaml.safe_load(text)
    include = (spec.get('jobs', {}).get('regression-shard', {})
               .get('strategy', {}).get('matrix', {}).get('include'))
    if not include:
        raise SystemExit(
            f'{workflow}: no regression-shard matrix include block')
    ids = [entry['id'] for entry in include]
    dupes = sorted({i for i in ids if ids.count(i) > 1})
    return ({entry['id']: entry.get('corpus') for entry in include}, dupes)


def _scan_matrix_include(
        text: str, workflow: Path) -> tuple[dict[str, str], list[str]]:
    """PyYAML-free read of the regression-shard matrix `include:` list.

    Deliberately strict and deliberately fatal on anything it does not
    recognise: a silent empty result is the one outcome worse than a
    confusing failure, because it is indistinguishable from "the lists
    and the matrix agree".
    """
    lines = text.splitlines()
    try:
        job = next(i for i, line in enumerate(lines)
                   if line == '  regression-shard:')
    except StopIteration:
        raise SystemExit(
            f'{workflow}: no `  regression-shard:` job at indent 2'
        ) from None

    # End of the job block: the next line at indent 2 that is not blank.
    end = len(lines)
    for i in range(job + 1, len(lines)):
        line = lines[i]
        if line.strip() and not line.startswith('    '):
            end = i
            break

    include = None
    for i in range(job + 1, end):
        if lines[i].strip() == 'include:':
            include = i
            break
    if include is None:
        raise SystemExit(
            f'{workflow}: regression-shard has no `include:` under its matrix')

    entries: dict[str, str] = {}
    order: list[str] = []
    current = None
    item_indent = None
    for line in lines[include + 1:end]:
        if not line.strip() or line.lstrip().startswith('#'):
            continue
        indent = len(line) - len(line.lstrip())
        stripped = line.strip()
        if stripped.startswith('- '):
            if item_indent is None:
                item_indent = indent
            elif indent != item_indent:
                break  # dedented out of the include list
            key, _, value = stripped[2:].partition(':')
            if key.strip() != 'id':
                raise SystemExit(
                    f'{workflow}: expected each matrix item to start with '
                    f'`- id:`, got {stripped!r}')
            current = value.strip().strip("'\"")
            order.append(current)
            entries[current] = None
        elif item_indent is not None and indent > item_indent:
            key, _, value = stripped.partition(':')
            if key.strip() == 'corpus' and current is not None:
                entries[current] = value.strip().strip("'\"")
        elif item_indent is not None:
            break
    if not entries:
        raise SystemExit(
            f'{workflow}: parsed no entries from the regression-shard matrix')
    return entries, sorted({i for i in order if order.count(i) > 1})


def _matrix_errors(workflow: Path, corpora: dict[str, str]) -> list[str]:
    """Cross-check the shard files against the workflow's matrix.

    A shard list with no matrix entry silently never runs; a matrix entry
    whose `corpus` disagrees with the list's `# corpus:` header would
    resolve the wrong models repo.
    """
    matrix, duplicates = _matrix_entries(workflow)
    errors = [
        f'regression-shard matrix declares id {shard!r} more than once; '
        'both jobs would upload the artifact `regression-shard-'
        f'{shard}` and one would fail on the name clash'
        for shard in sorted(duplicates)
    ]
    # The cap is about JOBS, not files: ten lists with eleven matrix
    # entries is eleven shard jobs.
    if len(matrix) + len(duplicates) > MAX_SHARDS:
        errors.append(
            f'{len(matrix) + len(duplicates)} regression-shard matrix '
            f'entries, max is {MAX_SHARDS} (regression/shards/README.md)')
    for shard, corpus in sorted(corpora.items()):
        if shard not in matrix:
            errors.append(
                f'regression/shards/{shard}.txt has no regression-shard '
                'matrix entry, so it never runs')
        elif matrix[shard] != corpus:
            errors.append(
                f'{shard}: matrix says corpus {matrix[shard]!r}, '
                f'regression/shards/{shard}.txt says {corpus!r}')
    for shard in sorted(set(matrix) - set(corpora)):
        errors.append(
            f'matrix entry {shard!r} has no regression/shards/{shard}.txt')
    return errors


def cmd_pull(args: argparse.Namespace) -> None:
    _, names = parse_shard(args.shard)
    root = Path(args.root)
    paths = find_paths(root, names)
    stubs = [rel for rel in paths if is_lfs_stub(root / rel)]
    print(f'{len(paths)} shard models, {len(stubs)} LFS stubs to pull')
    if not stubs:
        return
    subprocess.check_call(['git', 'lfs', 'install', '--local'], cwd=root)
    subprocess.check_call(
        ['git', 'lfs', 'pull', '--include=' + ','.join(stubs)], cwd=root)
    left = [rel for rel in stubs if is_lfs_stub(root / rel)]
    if left:
        print(
            '::error::unsmudged LFS stubs after pull: ' + ', '.join(left),
            file=sys.stderr)
        raise SystemExit(1)


def main() -> None:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest='cmd', required=True)

    p_regex = sub.add_parser('regex')
    p_regex.add_argument('shard')
    p_regex.set_defaults(func=cmd_regex)

    p_corpus = sub.add_parser('corpus')
    p_corpus.add_argument('shard')
    p_corpus.set_defaults(func=cmd_corpus)

    p_names = sub.add_parser('names')
    p_names.add_argument('shard')
    p_names.set_defaults(func=cmd_names)

    p_pull = sub.add_parser('pull')
    p_pull.add_argument('shard')
    p_pull.add_argument('root')
    p_pull.set_defaults(func=cmd_pull)

    p_check = sub.add_parser('check')
    p_check.add_argument('--shard-dir', default='regression/shards')
    p_check.add_argument('--smoke', default='regression/smoke_models.txt')
    p_check.add_argument('--workflow', default='.github/workflows/build.yml')
    p_check.set_defaults(func=cmd_check)

    args = parser.parse_args()
    args.func(args)


if __name__ == '__main__':
    # github.com composite actions run with cwd = the caller workspace.
    os.chdir(os.environ.get('GITHUB_WORKSPACE', os.getcwd()))
    main()
