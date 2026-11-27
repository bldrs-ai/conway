#!/usr/bin/env python3
"""`alsocheck`: models a PR (or a manual dispatch) asks CI to also check.

A PR that fixes an error reported on particular models names them in its
description, on a line of its own:

    alsocheck: ILNA250, ifc/foo/bar.ifc

and CI runs regression on exactly those models and renders them
before/after, whether or not they are in a shard list and whether or not
their digest moved. See regression/shards/README.md, "alsocheck".

Every byte this script parses is attacker-controlled: a fork's author
writes the PR body. So the rules are:

- It is only ever read from a file or the environment, never
  interpolated into a script by `${{ }}`.
- Every entry is held to a strict shape: a shard CODE
  (`shard_list.CODE_RE`), or a safe relative path to an `.ifc`,
  `.step` or `.stp` file. Anything else is rejected.
- A rejected entry is reported by POSITION and REASON only, never by
  its text. Echoing it would let a body write workflow commands
  (`::add-mask::`, `::set-output`) into the log, and an entry that is
  rejected because it looks like a private path is exactly the text that
  must not be repeated in a public log.
- At most MAX_ENTRIES entries, so a body cannot fan a run out.

Private models are named by code only. Conway is public, and a private
filename in its logs, comments or artifacts stays published. A path is
accepted only when it names a model in the PUBLIC corpus at the run's
pinned commit, which is also what rejects a private path typed by
mistake (without saying what it was).
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path, PurePosixPath

sys.path.insert(0, str(Path(__file__).resolve().parent))

from shard_list import CODE_RE, shard_entries  # noqa: E402 - path above

MAX_ENTRIES = 5
# Longest accepted entry. The longest model path in the public corpus is
# well under this; the cap exists so a body cannot hand us megabytes.
MAX_ENTRY_LEN = 200
MAX_CODE_LEN = 16
# Only this much of a body is scanned. GitHub caps a body at 65536
# characters; this is a backstop, not a feature.
MAX_BODY = 70000
EXTENSIONS = ('.ifc', '.step', '.stp')

# The key, at the start of a line, any case. At most three leading
# spaces and no tab: four spaces or a tab make an indented code block,
# which GitHub shows as code, not as a request.
KEY_RE = re.compile(r'^ {0,3}alsocheck[ \t]*:(.*)$', re.IGNORECASE)
# One path segment. ASCII only (no lookalikes), no shell or glob
# metacharacters, no `,` (git-lfs `--include` takes a comma list), no
# `:` (cannot start a workflow command), no quotes, no `\`.
SEGMENT_RE = re.compile(r'^[A-Za-z0-9_.+-]+$')
# Inside double quotes a segment may also hold spaces and parentheses:
# about a fifth of the public corpus has one in its path.
QUOTED_SEGMENT_RE = re.compile(r'^[A-Za-z0-9_.+() -]+$')
TOKEN_RE = re.compile(r'"([^"\n]*)"|([^\s,]+)')
# A fence opener or closer: three or more backticks or tildes, after any
# indentation or blockquote/list markers. Deliberately looser than
# CommonMark (a fence in a list item or quote counts too): a line wrongly
# taken as fenced is ignored, which is the safe direction.
FENCE_RE = re.compile(r'^[ \t>*+\-0-9.)]*(`{3,}|~{3,})(.*)$')
# Spans GitHub hides or shows as code. An unclosed one runs to the end of
# the body, as an unclosed `<!--` does on GitHub.
HIDDEN_RE = re.compile(
    r'<!--.*?(?:-->|\Z)'
    r'|<(pre|code|script|style|textarea|template|xmp)\b[^>]*>.*?'
    r'(?:</\1\s*>|\Z)',
    re.DOTALL | re.IGNORECASE)
# Line breaks other than LF/CR that Python's splitlines() would split on
# but GitHub renders inside a line. A line holding one is ignored whole.
ODD_BREAKS_RE = re.compile('[\x0b\x0c\x1c\x1d\x1e\x85\u2028\u2029]')

ALSOCHECK_PUBLIC_ID = 'alsocheck-public'
ALSOCHECK_PRIVATE_ID = 'alsocheck-private'
ALSOCHECK_IDS = (ALSOCHECK_PUBLIC_ID, ALSOCHECK_PRIVATE_ID)


class Rejected(ValueError):
    """An entry failed validation. The message never contains the entry."""


@dataclass
class Selection:
    codes: list[str] = field(default_factory=list)
    paths: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)

    @property
    def count(self) -> int:
        return len(self.codes) + len(self.paths)


def request_lines(body: str) -> list[str]:
    """The values of every `alsocheck:` line in a PR body.

    Lines inside HTML comments and fenced code blocks do not count: a PR
    template can carry a commented-out example, and a PR that documents
    the syntax (this feature's own did) shows it in a code block. Neither
    is a request.
    """
    values: list[str] = []
    fence: tuple[str, int] | None = None
    for line in visible_lines(body):
        opener = FENCE_RE.match(line)
        if fence is None:
            if opener:
                mark = opener.group(1)
                fence = (mark[0], len(mark))
                continue
        else:
            # Closed only by the same character, at least as long, and
            # nothing else on the line: a ~~~ inside a ``` fence, or ```
            # inside a ```` fence, is content. Unclosed runs to the end.
            if (opener and opener.group(1)[0] == fence[0]
                    and len(opener.group(1)) >= fence[1]
                    and not opener.group(2).strip()):
                fence = None
            continue
        match = KEY_RE.match(line)
        if match:
            values.append(match.group(1))
    return values


def visible_lines(body: str) -> list[str]:
    """The body's lines with hidden spans masked out, split as GitHub does.

    A hidden span (HTML comment, <pre>, <code>...) is replaced by NUL
    markers around the newlines it contained, so a line that it starts,
    ends or covers can never begin with the key: "when in doubt, ignore
    the line". Only LF, CRLF and CR end a line.
    """
    body = body[:MAX_BODY].replace('\r\n', '\n').replace('\r', '\n')

    def mask(match: re.Match) -> str:
        return '\0' + '\0\n'.join([''] * (match.group(0).count('\n') + 1)) + '\0'

    body = HIDDEN_RE.sub(mask, body)
    return [line for line in body.split('\n')
            if not ODD_BREAKS_RE.search(line)]


def dispatch_lines(value: str) -> list[str]:
    """A dispatch input: the entry list, with or without the key."""
    lines = []
    for line in value[:MAX_BODY].replace('\r', '\n').split('\n'):
        match = KEY_RE.match(line)
        lines.append(match.group(1) if match else line)
    return lines


def tokens(value: str) -> list[tuple[str, bool]]:
    """(entry, was it quoted) for one line's value: comma/space separated.

    Characters TOKEN_RE cannot place - a lone `"` - become their own
    token, so they are rejected rather than silently dropped.
    """
    out: list[tuple[str, bool]] = []
    pos = 0
    for match in TOKEN_RE.finditer(value):
        gap = value[pos:match.start()]
        if gap.strip(' \t,'):
            out.append((gap.strip(), False))
        pos = match.end()
        if match.group(1) is not None:
            out.append((match.group(1), True))
        else:
            out.append((match.group(2), False))
    tail = value[pos:]
    if tail.strip(' \t,'):
        out.append((tail.strip(), False))
    return out


def classify(entry: str, quoted: bool) -> tuple[str, str]:
    """('code', CODE) or ('path', path), or raise Rejected.

    Rejected messages describe the problem in words only: see the module
    docstring for why the entry itself is never repeated.
    """
    # A path in backticks is how markdown renders one; accept a single
    # enclosing pair and validate what is inside.
    if (len(entry) >= 2 and entry.startswith('`') and entry.endswith('`')
            and not quoted):
        entry = entry[1:-1]
    if not entry:
        raise Rejected('empty entry')
    if len(entry) > MAX_ENTRY_LEN:
        raise Rejected(f'longer than {MAX_ENTRY_LEN} characters')
    if not entry.isascii():
        raise Rejected('non-ASCII characters')
    if not quoted and CODE_RE.match(entry):
        if len(entry) > MAX_CODE_LEN:
            raise Rejected(f'a code is at most {MAX_CODE_LEN} characters')
        return 'code', entry

    lowered = entry.lower()
    if not lowered.endswith(EXTENSIONS):
        if '/' not in entry and '.' not in entry:
            raise Rejected(
                'neither a shard code (capitals then a size, e.g. ILNA250 '
                '- codes are upper case) nor a model path')
        raise Rejected(
            'not a model path: only ' + ', '.join(EXTENSIONS)
            + ' files can be checked')
    if entry.startswith('/'):
        raise Rejected('absolute path; give it relative to the '
                       'bldrs-ai/test-models root')
    segments = entry.split('/')
    pattern = QUOTED_SEGMENT_RE if quoted else SEGMENT_RE
    for segment in segments:
        if segment in ('', '.', '..'):
            raise Rejected('empty, `.` or `..` path segment')
        if segment.startswith('-'):
            raise Rejected('a path segment starts with `-`')
        if segment != segment.strip():
            raise Rejected('a path segment starts or ends with a space')
        if not pattern.match(segment):
            raise Rejected(
                'characters outside [A-Za-z0-9_.+-/]'
                + (' (plus space and parentheses inside quotes)'
                   if quoted else '; quote a path that has spaces'))
    # A private model named by path instead of code, most likely typed as
    # its code plus an extension. No part of the entry is repeated, not
    # even the code-shaped stem: a rejected entry is never echoed.
    stem = PurePosixPath(entry).stem
    if CODE_RE.match(stem) and len(segments) == 1:
        raise Rejected(
            'looks like a private model given as a file; name a private '
            'model by its shard code alone, with no extension')
    return 'path', entry


def parse(lines: list[str]) -> Selection:
    """Validate every entry on the given `alsocheck:` values."""
    sel = Selection()
    seen: set[str] = set()
    raw = [tok for line in lines for tok in tokens(line)]
    if len(raw) > MAX_ENTRIES:
        # Not validated one by one: past the cap the request is refused
        # whole, so there is no partial selection to reason about.
        sel.errors.append(
            f'{len(raw)} entries; at most {MAX_ENTRIES} are allowed')
        return sel
    for index, (entry, quoted) in enumerate(raw, 1):
        try:
            kind, value = classify(entry, quoted)
        except Rejected as why:
            sel.errors.append(f'entry {index}: {why}')
            continue
        if value in seen:
            continue
        seen.add(value)
        (sel.codes if kind == 'code' else sel.paths).append(value)
    return sel


def headline_codes(shard_dir: Path) -> list[str]:
    """Ids of the committed private shards: the regression-shard-private
    matrix (`shard_list.py check` holds the two to each other)."""
    codes = []
    for path in sorted(shard_dir.glob('*.txt')):
        corpus, _ = shard_entries(str(path))
        if corpus == 'private':
            codes.append(path.stem)
    return codes


def read_tree(listing: Path) -> set[str]:
    """Paths from `git ls-tree -r -z --name-only <sha>`."""
    data = listing.read_bytes().decode('utf-8', errors='replace')
    return {p for p in data.split('\0') if p}


def _truthy(value: str | None) -> bool:
    return (value or '').strip().lower() == 'true'


def resolve(env: dict[str, str], shard_dir: Path,
            tree: set[str] | None) -> tuple[dict[str, str], list[str],
                                             list[str]]:
    """Decide this run's private scope and alsocheck selection.

    Returns (outputs, summary lines, errors). Pure, so it is testable
    without a runner: `cmd_resolve` does the I/O.
    """
    event = env.get('EVENT_NAME', '')
    # True for a PR whose head is not this repository - a fork, or a head
    # repo that has since been deleted (`head.repo` null). The workflow
    # computes it from `head.repo.full_name`, not `head.repo.fork`.
    is_fork = _truthy(env.get('IS_FORK'))
    read_token = _truthy(env.get('TOKEN_PRESENT'))

    if event == 'pull_request':
        lines = request_lines(env.get('PR_BODY', ''))
        source = 'the PR description'
    elif event == 'workflow_dispatch':
        lines = dispatch_lines(env.get('DISPATCH_ALSOCHECK', ''))
        source = 'the `alsocheck` dispatch input'
    else:
        lines = []
        source = ''
    sel = parse(lines)
    errors = list(sel.errors)

    if sel.paths:
        if tree is None:
            errors.append('no public corpus listing to check paths against')
        else:
            kept = []
            for index, path in enumerate(sel.paths, 1):
                if path in tree:
                    kept.append(path)
                else:
                    # Not repeated: a path that is not public may well be
                    # a private one.
                    errors.append(
                        f'path {index} of {len(sel.paths)} is not a file in '
                        'bldrs-ai/test-models at this run\'s pinned commit. '
                        'Public models are named by their path in that '
                        'repo; private models by shard code only (e.g. '
                        'ILNA250), never by path, because this repo is '
                        'public')
            sel.paths = kept
            # Regression digests are keyed by file stem and the renderer
            # names its PNGs by basename, so two selected paths sharing a
            # file name would overwrite each other's results. Compared
            # case-insensitively, as the renderer's slug may fold case.
            # Entries are named by position only, as everywhere here.
            seen: dict[str, int] = {}
            for index, path in enumerate(kept, 1):
                stem = path.rsplit('/', 1)[-1].rsplit('.', 1)[0].lower()
                if stem in seen:
                    errors.append(
                        f'public paths {seen[stem]} and {index} have the same '
                        'file name, so their digests and renders would '
                        'overwrite each other; name one of them per run')
                else:
                    seen[stem] = index

    headline = headline_codes(shard_dir)
    if event == 'push':
        full_private = True
    elif event == 'workflow_dispatch':
        full_private = _truthy(env.get('RUN_PRIVATE_SHARDS'))
    else:
        full_private = False

    requested_private = list(sel.codes)
    private_skipped = ''
    codes = list(sel.codes)
    if codes and is_fork:
        # A fork's run has no secrets. Skip, say so, never fail: failing
        # would make every fork PR that copies a template red, and there
        # is nothing the author could do about it.
        private_skipped = 'fork'
        codes = []
    elif codes and event == 'pull_request' and not read_token:
        # A same-repo PR that still has no secrets: Dependabot's runs get
        # only Dependabot secrets. Same answer as a fork - a note, not a
        # red check. (On push and dispatch a missing token is still a
        # loud failure: resolve-models' "Require the private-models
        # token" step.)
        private_skipped = 'no-token'
        codes = []

    selected = [] if full_private else [c for c in codes if c in headline]
    extra = [c for c in codes if c not in headline]
    if full_private:
        scope = 'all'
    elif selected:
        scope = 'selected'
    else:
        scope = 'none'

    matrix = []
    if sel.paths:
        matrix.append({'id': ALSOCHECK_PUBLIC_ID, 'corpus': 'public'})
    if extra:
        matrix.append({'id': ALSOCHECK_PRIVATE_ID, 'corpus': 'private'})

    # Whether the write token exists is decided by visual-diff-private,
    # the only job that uses it, which also reports a missing one.
    if private_skipped:
        render = 'skipped'
    elif codes and event in ('pull_request', 'workflow_dispatch'):
        render = 'true'
    else:
        render = 'none'

    outputs = {
        'private_scope': scope,
        'private_expected': 'true' if scope != 'none' else 'false',
        'private_selected': ' '.join(selected),
        'private_needed': 'true' if (scope != 'none' or extra) else 'false',
        'alsocheck_public': json.dumps(sel.paths),
        'alsocheck_public_count': str(len(sel.paths)),
        'alsocheck_private': json.dumps(codes),
        'alsocheck_private_count': str(len(codes)),
        'alsocheck_private_extra': json.dumps(extra),
        'alsocheck_private_requested': json.dumps(requested_private),
        'alsocheck_private_skipped': private_skipped,
        'alsocheck_matrix': json.dumps(matrix),
        'private_render': render,
    }
    summary = [f'**Private headline shards:** {scope}'
               + (f' ({", ".join(selected)})' if selected else '')]
    if sel.count or sel.errors:
        summary.append(f'**alsocheck** (from {source}):')
        for code in requested_private:
            where = ('headline shard' if code in headline
                     else 'alsocheck-private job')
            summary.append(f'- `{code}` (private, {where})')
        for path in sel.paths:
            summary.append(f'- `{path}` (public)')
        if private_skipped == 'fork':
            summary.append(
                '- Private entries **skipped**: a PR from a fork (or a '
                'deleted head repo) has no access to the private corpus.')
        elif private_skipped == 'no-token':
            summary.append(
                '- Private entries **skipped**: this PR\'s run has no '
                '`TEST_MODELS_PRIVATE_TOKEN` (e.g. a Dependabot PR).')
        if render == 'true':
            summary.append(
                '- Private renders: `visual-diff-private` pushes them to '
                '`bldrs-ai/test-models-private` (branch '
                '`visual-diff-assets`) if `TEST_MODELS_PRIVATE_WRITE_TOKEN` '
                'is set as a repo secret, and says so '
                'if not. Never to this repo.')
    return outputs, summary, errors


def _write_outputs(outputs: dict[str, str]) -> None:
    target = os.environ.get('GITHUB_OUTPUT')
    for key, value in outputs.items():
        # Every value is built from validated entries or literals, and
        # json.dumps escapes control characters, so none holds a newline
        # that could start a second key. Asserted, not assumed.
        if '\n' in value or '\r' in value:
            raise SystemExit(f'refusing a multi-line output for {key}')
    if target:
        with open(target, 'a', encoding='utf-8') as fh:
            for key, value in outputs.items():
                fh.write(f'{key}={value}\n')
    else:
        for key, value in outputs.items():
            print(f'{key}={value}')


def _append_summary(lines: list[str]) -> None:
    target = os.environ.get('GITHUB_STEP_SUMMARY')
    if target:
        with open(target, 'a', encoding='utf-8') as fh:
            fh.write('\n'.join(lines) + '\n\n')


def cmd_resolve(args: argparse.Namespace) -> None:
    env = dict(os.environ)
    if args.body_file:
        body_path = Path(args.body_file)
        env['PR_BODY'] = (body_path.read_text(encoding='utf-8',
                                              errors='replace')
                          if body_path.is_file() else '')
    tree = read_tree(Path(args.public_tree)) if args.public_tree else None
    outputs, summary, errors = resolve(env, Path(args.shard_dir), tree)
    if errors:
        for message in errors:
            print(f'::error::alsocheck: {message}.')
        print('::error::alsocheck: fix the `alsocheck:` line and push, or '
              're-run all jobs (the description is read when the run '
              'starts). Syntax: regression/shards/README.md.')
        _append_summary(['**alsocheck:** rejected - see the job log.'])
        raise SystemExit(1)
    _write_outputs(outputs)
    _append_summary(summary)
    for key, value in outputs.items():
        print(f'{key}: {value}')


def validated_entries(corpus: str, raw: str) -> list[str]:
    """Re-validate a job output on the consuming side.

    The producer already validated these, but they cross a job boundary
    as text, and a consumer that writes them into a shard list should not
    have to trust that nothing in between was edited.
    """
    try:
        entries = json.loads(raw or '[]')
    except json.JSONDecodeError:
        raise SystemExit('alsocheck entries are not a JSON list') from None
    if not isinstance(entries, list) or len(entries) > MAX_ENTRIES:
        raise SystemExit(f'alsocheck entries: expected a list of at most '
                         f'{MAX_ENTRIES}')
    out = []
    for index, entry in enumerate(entries, 1):
        if not isinstance(entry, str):
            raise SystemExit(f'alsocheck entry {index} is not a string')
        try:
            # Quoted rules for anything that is not a code: the producer
            # stripped the quotes, and they are a superset of the bare ones.
            kind, value = classify(entry, quoted=not CODE_RE.match(entry))
        except Rejected as why:
            raise SystemExit(f'alsocheck entry {index}: {why}') from None
        want = 'code' if corpus == 'private' else 'path'
        if kind != want:
            raise SystemExit(
                f'alsocheck entry {index} is a {kind}, but this list is '
                f'{corpus}')
        out.append(value)
    return out


def cmd_write_list(args: argparse.Namespace) -> None:
    entries = validated_entries(args.corpus, os.environ.get('ENTRIES', ''))
    if not entries:
        raise SystemExit(f'no {args.corpus} alsocheck entries to write')
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(
        f'# corpus: {args.corpus}\n'
        '# Generated from this run\'s alsocheck request; not committed.\n'
        + '\n'.join(entries) + '\n', encoding='utf-8')
    # Codes and public paths only, so both are safe to print.
    print(f'{out}: {len(entries)} {args.corpus} model(s): '
          + ', '.join(entries))


def verify_artifacts(artifacts: Path, shard_dir: Path, scope: str,
                     selected: list[str], matrix: list[dict]) -> list[str]:
    """Which shards uploaded results, against which were supposed to.

    The job result alone cannot say this any more: an unselected
    regression-shard-private entry skips its steps and reports success,
    so a selected entry that skipped by mistake would look the same. Its
    artifact is the evidence that it digested something - and an
    unselected entry WITH one spent private LFS a PR did not ask for.
    """
    errors = []
    headline = headline_codes(shard_dir)
    if scope == 'all':
        expected = set(headline)
    elif scope == 'selected':
        expected = set(selected)
    else:
        expected = set()
    for code in sorted(set(selected) - set(headline)):
        errors.append(f'{code} is selected but is not a headline shard')
    for code in headline:
        present = (artifacts / f'regression-shard-{code}').is_dir()
        if code in expected and not present:
            errors.append(
                f'headline shard {code} was expected to run (scope '
                f'{scope}) but uploaded no results')
        elif code not in expected and present:
            errors.append(
                f'headline shard {code} uploaded results but was not '
                f'selected (scope {scope}); private LFS was spent on a run '
                'that did not ask for it')
    want = {entry['id'] for entry in matrix}
    for shard in ALSOCHECK_IDS:
        present = (artifacts / f'regression-shard-{shard}').is_dir()
        if shard in want and not present:
            errors.append(f'{shard} was expected to run but uploaded no '
                          'results')
        elif shard not in want and present:
            errors.append(f'{shard} uploaded results but was not requested')
    return errors


def cmd_verify_artifacts(args: argparse.Namespace) -> None:
    matrix = json.loads(os.environ.get('ALSOCHECK_MATRIX', '[]') or '[]')
    selected = os.environ.get('PRIVATE_SELECTED', '').split()
    errors = verify_artifacts(Path(args.artifacts), Path(args.shard_dir),
                              os.environ.get('PRIVATE_SCOPE', 'none'),
                              selected, matrix)
    for message in errors:
        print(f'::error::{message}')
    if errors:
        raise SystemExit(1)
    print('shard artifacts match the selection.')


def rendered_codes(codes: list[str], png_dir: Path) -> tuple[list[str],
                                                             list[str]]:
    """(codes with at least one image, codes with none).

    A side may legitimately have no image (the base engine cannot load a
    model the fix makes loadable), so one image is enough; a code with
    NONE rendered nothing, and the job must not go green over it.
    """
    done, none = [], []
    for code in codes:
        sides = [(png_dir / f'{code}-{side}.png').is_file()
                 for side in ('before', 'after')]
        (done if any(sides) else none).append(code)
    return done, none


def private_render_comment(codes: list[str], png_dir: Path, repo: str,
                           branch: str, dest: str,
                           write_token: bool) -> list[str]:
    """The PUBLIC comment for private renders: codes and links only.

    No image is embedded (a private raw URL cannot be fetched by GitHub's
    image proxy anyway, and an embed would be the wrong habit to start),
    no pixel-diff figure and no export diagnostic: the private fragment
    rule is counts only, and the full report lives beside the images in
    the private repo.

    Built BEFORE the push, so that no script from the PR branch runs once
    the write token is in the job: the links name the branch path, which
    is per run and append-only, rather than the commit the push makes.
    """
    lines = ['## Visual Diff (alsocheck, private models)', '']
    if not write_token:
        lines += [
            'Private renders **skipped**: `TEST_MODELS_PRIVATE_WRITE_TOKEN` '
            'is not set as a repo secret, and private '
            'renders have no other destination. Regression ran; nothing '
            'was rendered or published.']
        return lines
    tree = f'https://github.com/{repo}/tree/{branch}/{dest}'
    blob = f'https://github.com/{repo}/blob/{branch}/{dest}'
    done, none = rendered_codes(codes, png_dir)
    rows = ['| code | before | after |', '| --- | --- | --- |']
    for code in codes:
        cells = []
        for side in ('before', 'after'):
            if (png_dir / f'{code}-{side}.png').is_file():
                cells.append(f'[{side}]({blob}/{code}-{side}.png)')
            else:
                cells.append('_not rendered_')
        rows.append(f'| `{code}` | {cells[0]} | {cells[1]} |')
    lines += [
        f'{len(done)} of {len(codes)} private model(s) rendered. Images and '
        f'the full report are in [`{repo}`]({tree}), and open only for '
        'people with access to that repo. Nothing here is published to '
        'this repo. The links work once this run\'s `visual-diff-private` '
        'job has finished green: its last step is the push.', '']
    if none:
        lines += ['> [!WARNING]',
                  '> Rendered nothing for: '
                  + ', '.join(f'`{c}`' for c in none)
                  + '. `visual-diff-private` fails for this.', '']
    lines += rows
    return lines


def cmd_private_render_comment(args: argparse.Namespace) -> None:
    codes = validated_entries('private', os.environ.get('ENTRIES', ''))
    png_dir = Path(args.png_dir)
    lines = private_render_comment(codes, png_dir, args.repo, args.branch,
                                   args.dest, args.write_token == 'true')
    Path(args.out).write_text('\n'.join(lines) + '\n', encoding='utf-8')
    _, none = rendered_codes(codes, png_dir)
    # Codes only (public), for the final push step to fail on.
    _write_outputs({'unrendered': ' '.join(none)})


def main() -> None:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest='cmd', required=True)

    p_resolve = sub.add_parser(
        'resolve', help='decide private scope and alsocheck selection; '
        'reads EVENT_NAME, PR_BODY, DISPATCH_ALSOCHECK, RUN_PRIVATE_SHARDS, '
        'IS_FORK, TOKEN_PRESENT from the environment')
    p_resolve.add_argument('--shard-dir', default='regression/shards')
    p_resolve.add_argument('--body-file',
                           help='read the PR body from this file')
    p_resolve.add_argument('--public-tree',
                           help='`git ls-tree -r -z --name-only` output')
    p_resolve.set_defaults(func=cmd_resolve)

    p_list = sub.add_parser('write-list',
                            help='write ENTRIES (JSON) as a shard list')
    p_list.add_argument('--corpus', required=True,
                        choices=('public', 'private'))
    p_list.add_argument('--out', required=True)
    p_list.set_defaults(func=cmd_write_list)

    p_verify = sub.add_parser('verify-artifacts')
    p_verify.add_argument('--artifacts', required=True)
    p_verify.add_argument('--shard-dir', default='regression/shards')
    p_verify.set_defaults(func=cmd_verify_artifacts)

    p_comment = sub.add_parser('private-render-comment')
    p_comment.add_argument('--png-dir', required=True)
    p_comment.add_argument('--repo', required=True)
    p_comment.add_argument('--branch', required=True)
    p_comment.add_argument('--dest', required=True)
    p_comment.add_argument('--write-token', default='false',
                           choices=('true', 'false'))
    p_comment.add_argument('--out', required=True)
    p_comment.set_defaults(func=cmd_private_render_comment)

    args = parser.parse_args()
    args.func(args)


if __name__ == '__main__':
    main()
