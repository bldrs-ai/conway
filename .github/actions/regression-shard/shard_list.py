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
    return paths


def is_lfs_stub(path: Path) -> bool:
    head = path.read_bytes()[:200]
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

    args = parser.parse_args()
    args.func(args)


if __name__ == '__main__':
    # github.com composite actions run with cwd = the caller workspace.
    os.chdir(os.environ.get('GITHUB_WORKSPACE', os.getcwd()))
    main()
