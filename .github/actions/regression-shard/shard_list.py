#!/usr/bin/env python3
"""Helpers for PR-regression shards (regression/shards/*.txt)."""

from __future__ import annotations

import argparse
import csv
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path


# A private shard list names CODES, never filenames: leading capitals
# plus the model's size in MB (PSB900, AHMAC555, O10). Conway is public,
# and a shard list is committed here, so a filename in one is published
# for good. Four of the seven were already public on main in design docs
# before sharding existed; three were not, and this is what keeps them
# that way.
CODE_RE = re.compile(r'^[A-Z][A-Z0-9]*[0-9]$')

# The code -> path mapping lives in the PRIVATE corpus, which only a run
# holding TEST_MODELS_PRIVATE_TOKEN has checked out. Versioned beside the
# models it names, so a corpus reshuffle updates the two together.
MANIFEST = 'regression/shard_codes.txt'


def shard_entries(path: str) -> tuple[str, list[str]]:
    """Return (corpus, raw entries) from a shard list file.

    Raw: a public list's entries are basenames, a private list's are
    codes. Use this where only the corpus or the unresolved entries are
    wanted (`check` runs in `build`, which has no corpus to resolve
    against); use parse_shard where real basenames are needed.
    """
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


def load_codes(root: Path) -> dict[str, str]:
    """{code: path relative to the corpus root} from the private manifest."""
    manifest = root / MANIFEST
    if not manifest.is_file():
        raise SystemExit(
            f'{manifest} not found. Private shard lists name codes rather '
            'than filenames, so the private corpus carries the mapping: '
            f'add {MANIFEST} to bldrs-ai/test-models-private with one '
            '"<CODE> <path>" line per headline model (e.g. '
            '"PSB900  ifc/<file>"). Without it a private shard cannot '
            'know which model it is for.')
    mapping: dict[str, str] = {}
    lines = manifest.read_text(encoding='utf-8').splitlines()
    for lineno, line in enumerate(lines, 1):
        text = line.split('#', 1)[0].strip()
        if not text:
            continue
        parts = text.split(None, 1)
        if len(parts) != 2:
            raise SystemExit(
                f'{MANIFEST}:{lineno}: expected "<CODE> <path>", got '
                f'{line.strip()!r}')
        code, rel = parts[0], parts[1].strip()
        if not CODE_RE.match(code):
            raise SystemExit(
                f'{MANIFEST}:{lineno}: {code!r} is not a shard code '
                '(leading capitals then a size, e.g. PSB900)')
        if code in mapping:
            raise SystemExit(f'{MANIFEST}:{lineno}: duplicate code {code!r}')
        mapping[code] = rel
    return mapping


def resolve_private(root: Path, codes: list[str]) -> list[tuple[str, str]]:
    """[(code, relative path)] for each code, or exit naming what is missing.

    Path-valued, unlike the public basename search: the manifest says
    exactly which file a code means, so a private shard cannot pick up a
    second file that happens to share a basename.
    """
    mapping = load_codes(root)
    missing = [c for c in codes if c not in mapping]
    if missing:
        raise SystemExit(
            f'{root / MANIFEST} has no entry for: '
            + ', '.join(sorted(missing)))
    resolved: list[tuple[str, str]] = []
    for code in codes:
        rel = mapping[code]
        if not (root / rel).is_file():
            # The code only: this message lands in a public job log.
            raise SystemExit(
                f'{MANIFEST} maps {code} to a path that is not in the '
                'corpus checkout')
        resolved.append((code, rel))
    return resolved


def parse_shard(path: str, root: str | None = None) -> tuple[str, list[str]]:
    """Return (corpus, real basenames) from a shard list file.

    A private list's codes are resolved through the corpus manifest, so
    `root` is required for one.
    """
    corpus, entries = shard_entries(path)
    if corpus == 'public':
        # A generated alsocheck list names corpus PATHS (a basename is
        # ambiguous there); the CSVs this feeds are keyed by basename.
        return corpus, [Path(e).name for e in entries]
    if root is None:
        raise SystemExit(
            f'{path} is a private shard, so resolving its codes needs the '
            'corpus root')
    return corpus, [Path(rel).name for _, rel in
                    resolve_private(Path(root), entries)]


def exclude_regex(selectors: list[str]) -> str:
    """Batch CLI exclude regex: model FILES this shard does NOT want.

    A selector is a basename for a public shard and a corpus-relative
    PATH for a private one. The batch tests this against
    `path.join(parentPath, name)` (collectIFCFiles), so a path selector
    matches `models/ifc/<dir>/<file>` through the optional `.*/` prefix,
    and a basename selector still matches wherever it sits.

    Path selectors are why `cmd_regex` resolves a private shard rather
    than reducing it to basenames: a basename would admit a same-named
    file in another directory, which `cmd_pull` never materialized - so
    the batch would meet it as an LFS stub and fail the shard, or digest
    it and overwrite the selected model's same-stem outputs (codex
    review of this PR). Public shards keep basenames; their duplicate
    case is documented in find_paths and predates sharding.

    Extension-anchored on purpose: the batch applies this same regex to
    DIRECTORIES as it walks, and a pattern a directory could match would
    stop recursion entirely.
    """
    alts = '|'.join(re.escape(s) for s in selectors)
    return (
        rf'^(?!(?:.*/)?(?:{alts})$)'
        r'.*\.(?:[iI][fF][cC]|[sS][tT][eE][pP]|[sS][tT][pP])$'
    )


def find_paths(root: Path, names: list[str]) -> list[str]:
    """Relative posix paths under root/ifc and root/step matching basenames.

    An entry holding a `/` is already a corpus-relative path (the lists
    alsocheck generates), and is taken as exactly that file rather than
    searched for, so it cannot pick up a same-named file elsewhere.
    """
    exact = [n for n in names if '/' in n]
    names = [n for n in names if '/' not in n]
    absent = [n for n in exact if not (root / n).is_file()]
    if absent:
        raise SystemExit(
            'shard paths not in corpus: ' + ', '.join(sorted(absent)))
    if not names:
        return sorted(exact)
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
    return sorted(paths + exact)


def is_lfs_stub(path: Path) -> bool:
    """True if path is an unsmudged LFS pointer rather than the model.

    Reads only the pointer-sized prefix: these files run to ~900 MB, and
    slurping one to look at its first 200 bytes is a 900 MB allocation.
    """
    with path.open('rb') as fh:
        head = fh.read(200)
    return head.startswith(b'version https://git-lfs') or b'git-lfs.github.com' in head


def cmd_regex(args: argparse.Namespace) -> None:
    corpus, entries = shard_entries(args.shard)
    if corpus == 'private':
        if args.root is None:
            raise SystemExit(
                f'{args.shard} is a private shard, so building its filter '
                'needs the corpus root')
        # Resolved PATHS, not basenames: see exclude_regex.
        selectors = [rel for _, rel in
                     resolve_private(Path(args.root), entries)]
    else:
        selectors = entries
    print(exclude_regex(selectors), end='')


def cmd_corpus(args: argparse.Namespace) -> None:
    corpus, _ = shard_entries(args.shard)
    print(corpus, end='')


def cmd_link(args: argparse.Namespace) -> None:
    """Expose a private list's models under their CODES.

    Both the digest batch (`Current File: <path>`, every CSV's `file`
    column, the per-model digest name) and visual_diff_report.cjs (its
    log lines, its PNG names) name a model by its path or basename.
    Pointed at `<dir>/<CODE><ext>` instead of the real files, all of it
    says the code, which is already public, and never the private
    filename.

    HARD links, not symlinks: a symlink keeps the real path one
    `realpath()` away from any tool that resolves it, and a hard link has
    no other name to resolve to. Copied if the two paths are on different
    filesystems. Prints codes only.
    """
    corpus, entries = shard_entries(args.shard)
    if corpus != 'private':
        raise SystemExit(f'{args.shard} is not a private shard list')
    out_dir = Path(args.dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    lines = []
    for code, rel in resolve_private(Path(args.root), entries):
        ext = Path(rel).suffix.lower()
        if ext not in ('.ifc', '.step', '.stp'):
            raise SystemExit(f'{MANIFEST} maps {code} to a file that is not '
                             'an .ifc, .step or .stp model')
        link = out_dir / f'{code}{ext}'
        if link.is_symlink() or link.exists():
            link.unlink()
        source = (Path(args.root) / rel).resolve()
        try:
            os.link(source, link)
        except OSError:
            shutil.copyfile(source, link)
        lines.append(str(link))
    Path(args.out).write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f'{len(lines)} private model(s) linked by code: '
          + ', '.join(entries))


def cmd_names(args: argparse.Namespace) -> None:
    _, names = parse_shard(args.shard, args.root)
    print('\n'.join(names))


MAX_SHARDS = 10

# The regression-alsocheck job's ids (alsocheck-public, alsocheck-private).
# Generated per run, never committed, and outside MAX_SHARDS: see
# regression/shards/README.md, "alsocheck".
RESERVED_PREFIX = 'alsocheck'

# Which workflow job runs which corpus. The shard's corpus is now implied
# by the job that lists it - public coverage runs on every ready PR,
# private headlines only on merge and rc tags - so this mapping is the
# fact `check` holds the shard lists to.
MATRIX_JOBS = {
    'regression-shard': 'public',
    'regression-shard-private': 'private',
}


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
        if stem.startswith(RESERVED_PREFIX):
            errors.append(
                f'{path.name}: `{RESERVED_PREFIX}*` ids are reserved for '
                'the lists alsocheck generates at run time; a committed one '
                'would collide with its `regression-shard-<id>` artifact')
        corpus, names = shard_entries(str(path))
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
        if corpus == 'private':
            # No corpus to resolve against in `build`, so check the shape:
            # a filename here would be published for good, and a code that
            # the manifest cannot map fails the shard at run time with a
            # message naming it.
            for name in sorted(seen):
                if not CODE_RE.match(name):
                    errors.append(
                        f'{path.name}: {name!r} is not a shard code. A '
                        'private list names codes (leading capitals then a '
                        'size, e.g. PSB900), never filenames - this repo is '
                        'public and a committed filename stays published.')
            if len(seen) == 1 and stem not in seen:
                only = next(iter(seen))
                errors.append(
                    f'{path.name}: holds code {only!r} but is named after '
                    f'{stem!r}; the file name is the shard id and the matrix '
                    'entry, so the two must agree.')
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
        # Say which path ran. The previous version of this check printed
        # a notice and exited 0 when PyYAML was missing, and the step
        # still reported green - so "the step passed" was not evidence
        # the cross-check had run, and nobody could tell from a log.
        print('matrix read: strict include-block scan (no PyYAML)')
        return _scan_matrix_include(text, workflow)
    print(f'matrix read: PyYAML {yaml.__version__}')

    # GitHub's `on:` key parses as the boolean True under YAML 1.1;
    # harmless here, we only read `jobs`.
    spec = yaml.safe_load(text)
    entries: dict[str, str] = {}
    ids: list[str] = []
    for job, corpus in MATRIX_JOBS.items():
        include = (spec.get('jobs', {}).get(job, {})
                   .get('strategy', {}).get('matrix', {}).get('include'))
        if not include:
            raise SystemExit(f'{workflow}: no {job} matrix include block')
        for entry in include:
            ids.append(entry['id'])
            entries[entry['id']] = corpus
    return entries, sorted({i for i in ids if ids.count(i) > 1})


def _scan_matrix_include(
        text: str, workflow: Path) -> tuple[dict[str, str], list[str]]:
    """PyYAML-free read of the regression-shard matrix `include:` list.

    Deliberately strict and deliberately fatal on anything it does not
    recognise: a silent empty result is the one outcome worse than a
    confusing failure, because it is indistinguishable from "the lists
    and the matrix agree".
    """
    entries: dict[str, str] = {}
    order: list[str] = []
    for job_name, corpus in MATRIX_JOBS.items():
        for shard in _scan_one_job(text, workflow, job_name):
            order.append(shard)
            entries[shard] = corpus
    if not entries:
        raise SystemExit(
            f'{workflow}: parsed no entries from the shard matrices')
    return entries, sorted({i for i in order if order.count(i) > 1})


def _scan_one_job(text: str, workflow: Path, job_name: str) -> list[str]:
    """Shard ids from one job's matrix `include:` list, PyYAML-free."""
    lines = text.splitlines()
    try:
        job = next(i for i, line in enumerate(lines)
                   if line == f'  {job_name}:')
    except StopIteration:
        raise SystemExit(
            f'{workflow}: no `  {job_name}:` job at indent 2') from None

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
            f'{workflow}: {job_name} has no `include:` under its matrix')

    found: list[str] = []
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
            found.append(value.strip().strip("'\""))
        elif item_indent is not None and indent <= item_indent:
            break
    if not found:
        raise SystemExit(
            f'{workflow}: parsed no entries from the {job_name} matrix')
    return found


def _matrix_errors(workflow: Path, corpora: dict[str, str]) -> list[str]:
    """Cross-check the shard files against the workflow's matrix.

    A shard list with no matrix entry silently never runs; a matrix entry
    whose `corpus` disagrees with the list's `# corpus:` header would
    resolve the wrong models repo.
    """
    matrix, duplicates = _matrix_entries(workflow)
    errors = [
        f'the shard matrices declare id {shard!r} more than once; '
        'both jobs would upload the artifact `regression-shard-'
        f'{shard}` and one would fail on the name clash'
        for shard in sorted(duplicates)
    ]
    # The cap is about JOBS, not files: ten lists with eleven matrix
    # entries is eleven shard jobs.
    if len(matrix) + len(duplicates) > MAX_SHARDS:
        errors.append(
            f'{len(matrix) + len(duplicates)} shard matrix entries across '
            f'{", ".join(MATRIX_JOBS)}, max is {MAX_SHARDS} '
            '(regression/shards/README.md)')
    for shard, corpus in sorted(corpora.items()):
        if shard not in matrix:
            errors.append(
                f'regression/shards/{shard}.txt is in no shard matrix '
                f'({", ".join(MATRIX_JOBS)}), so it never runs')
        elif matrix[shard] != corpus:
            errors.append(
                f'{shard}: listed in the {matrix[shard]!r} matrix job, '
                f'but regression/shards/{shard}.txt says {corpus!r}')
    for shard in sorted(set(matrix) - set(corpora)):
        errors.append(
            f'matrix entry {shard!r} has no regression/shards/{shard}.txt')
    return errors


def redact(text: str, pairs: list[tuple[str, str]]) -> str:
    """Replace every private path, and its basename and stem, with its code.

    Longest first, so a path is replaced whole before its basename is.
    """
    subs = []
    for code, rel in pairs:
        name = Path(rel).name
        subs += [(rel, code), (name, code), (Path(rel).stem, code)]
    for old, new in sorted(subs, key=lambda kv: -len(kv[0])):
        if old:
            text = text.replace(old, new)
    return text


def cmd_pull(args: argparse.Namespace) -> None:
    corpus, entries = shard_entries(args.shard)
    root = Path(args.root)
    pairs: list[tuple[str, str]] = []
    if corpus == 'private':
        pairs = resolve_private(root, entries)
        paths = [rel for _, rel in pairs]
        names = dict((rel, code) for code, rel in pairs)
    else:
        paths = find_paths(root, entries)
        names = {rel: rel for rel in paths}
    stubs = [rel for rel in paths if is_lfs_stub(root / rel)]
    print(f'{len(paths)} shard models, {len(stubs)} LFS stubs to pull')
    if not stubs:
        return
    subprocess.check_call(['git', 'lfs', 'install', '--local'], cwd=root)
    pull = ['git', 'lfs', 'pull', '--include=' + ','.join(stubs)]
    if corpus == 'private':
        # git-lfs names the file it failed on; this log is public. Its
        # output is passed through with every private path replaced by
        # its code.
        done = subprocess.run(pull, cwd=root, capture_output=True,
                              text=True, check=False)
        out = redact(done.stdout + done.stderr, pairs).strip()
        if out:
            print(out)
        if done.returncode != 0:
            raise SystemExit(f'git lfs pull failed (exit {done.returncode})')
    else:
        subprocess.check_call(pull, cwd=root)
    left = [names[rel] for rel in stubs if is_lfs_stub(root / rel)]
    if left:
        print(
            '::error::unsmudged LFS stubs after pull: ' + ', '.join(left),
            file=sys.stderr)
        raise SystemExit(1)


def cmd_digested(args: argparse.Namespace) -> None:
    """Fail unless every model in the list has a row in main.csv or
    failed.csv: the batch exiting 0 is not evidence it digested anything.

    A row is matched on the batch's `file` column, a basename: the real
    one for a committed list, `<CODE><ext>` for a list run through
    `link` (--by-code). Reports by entry (codes for a private list),
    never by private filename.
    """
    corpus, entries = shard_entries(args.shard)
    expect: list[tuple[str, str]] = []  # (what to report, basename)
    if corpus == 'private':
        for code, rel in resolve_private(Path(args.root), entries):
            name = (f'{code}{Path(rel).suffix.lower()}' if args.by_code
                    else Path(rel).name)
            expect.append((code, name))
    else:
        expect = [(e, Path(e).name) for e in entries]
    seen: set[str] = set()
    for csv_path in (args.main, args.failed):
        path = Path(csv_path)
        if not path.is_file():
            continue
        with path.open(newline='', encoding='utf-8') as fh:
            for row in csv.DictReader(fh):
                seen.add(row.get('file', ''))
    missing = [label for label, name in expect if name not in seen]
    if missing:
        print('::error::The batch exited without a result row for: '
              + ', '.join(missing) + '. A model it never read cannot pass.')
        raise SystemExit(1)
    print(f'{len(expect)} of {len(expect)} listed model(s) have a result row.')


def main() -> None:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest='cmd', required=True)

    p_regex = sub.add_parser('regex')
    p_regex.add_argument('shard')
    p_regex.add_argument('root', nargs='?',
                         help='corpus root; required for a private shard')
    p_regex.set_defaults(func=cmd_regex)

    p_corpus = sub.add_parser('corpus')
    p_corpus.add_argument('shard')
    p_corpus.set_defaults(func=cmd_corpus)

    p_names = sub.add_parser('names')
    p_names.add_argument('shard')
    p_names.add_argument('root', nargs='?',
                         help='corpus root; required for a private shard')
    p_names.set_defaults(func=cmd_names)

    p_pull = sub.add_parser('pull')
    p_pull.add_argument('shard')
    p_pull.add_argument('root')
    p_pull.set_defaults(func=cmd_pull)

    p_dig = sub.add_parser('digested')
    p_dig.add_argument('shard')
    p_dig.add_argument('root')
    p_dig.add_argument('main')
    p_dig.add_argument('failed')
    p_dig.add_argument('--by-code', action='store_true')
    p_dig.set_defaults(func=cmd_digested)

    p_link = sub.add_parser('link')
    p_link.add_argument('shard')
    p_link.add_argument('root')
    p_link.add_argument('dir')
    p_link.add_argument('--out', required=True,
                        help='write the linked model paths here, one a line')
    p_link.set_defaults(func=cmd_link)

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
