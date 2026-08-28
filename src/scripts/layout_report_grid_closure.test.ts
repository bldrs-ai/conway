import { execFileSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, test } from '@jest/globals'


/**
 * `scripts/layout_report.mjs`'s placement closure, over the grid chain
 * (conway#546) and the inverse `gridByAxis` lookup below it (conway#607).
 *
 * The script is the static analyser that produced conway#542's published
 * per-file "products deferring" percentages. It walks a product's placement
 * closure transitively and reports, per prefix, how many products could be
 * emitted — and which record arrived last in the chain that blocked the
 * rest. `IFCGRIDPLACEMENT` was in its `PLACEMENT_NAMES` set but nothing that
 * a grid placement references was, so the walk expanded exactly ONE hop and
 * stopped at `IFCVIRTUALGRIDINTERSECTION`, never reaching the axes, their
 * axis curves, or the points those bottom out in. conway#546 closed that
 * FORWARD half; conway#607 closed the inverse one, which no forward walk can
 * reach at all — see the second test.
 *
 * **The direction of that error is what makes it worth a test.** A closure
 * that stops early makes a grid-placed product look usable SOONER than it
 * is, so the deferral and sharded-readiness curves came out optimistic — a
 * silently flattering number, which is the same failure mode as the
 * fixed-point defect codex found in round 2 of #543.
 *
 * These tests carry more weight than a normal tool test, because **no corpus
 * model can stand in for them**: `IFCGRIDPLACEMENT` count is zero across all
 * 47 models of `bldrs-ai/test-models` and zero in PSB, D3D, DOWA and
 * MB-Khaya, measured on the real bytes (conway#607). Grids appear in real
 * exports as annotation, not as a placement mechanism, so `gridByAxis` is
 * never reached on the corpus and the hand-authored fixtures here are the
 * only thing exercising this path.
 *
 * Driven through the CLI rather than by import: the script's module body
 * runs the whole tool on `process.argv`, so importing it under Jest would
 * hand it Jest's own arguments. `render_glb_paths.test.ts` drives
 * `scripts/render_glb.cjs` the same way.
 */

/* The report's blocker block, verbatim enough to slice on. */
const BLOCKER_HEADING = 'deferred by (last record in the chain to arrive):'

/* Likewise the sharded table. */
const SHARDED_HEADING = 'sharded parse — placed products emittable'

/* Column indices into a `shardedRow`, which prints one column per simulated
 * shard count in the script's SHARD_COUNTS order. */
const SHARD_N1 = 0
const SHARD_N2 = 1

/* The band-boundary fixture, as fractions of its own size. Two axes of one
 * grid, one just short of the N=2 boundary and one just past it. */
const STRADDLE_TOTAL_BYTES = 4000
const STRADDLE_BEFORE_BOUNDARY = 0.49
const STRADDLE_AFTER_BOUNDARY = 0.52

/* What "just short of" and "just past" have to mean for that fixture to be
 * testing anything: the earlier axis nearly finishes its band, the later one
 * has barely started the next. */
const STRADDLE_LATE_IN_BAND = 0.9
const STRADDLE_EARLY_IN_BAND = 0.1

/* Progress rows read out of the sharded table. */
const ROW_ALL_SCANNED = 100
const ROW_NINE_TENTHS = 90

/* data/grid_placement_tail_axes.ifc, by construction. One of its four
 * deferring proxies — #500, whose own axes are at the tail — bottoms out in
 * an axis polyline's points LATER than the last grid axis record, so the
 * forward closure is still what names its blocker. */
const GRID_TAIL_LEAF_BLOCKED = 1

/* The other three, all held by the same single all-or-nothing scan. */
const GRID_TAIL_INVERSE_BLOCKED = 3


/* Header, units and the world placement every inline fixture below needs, and
 * nothing that bears on what they test. */
const FIXTURE_HEAD = [
  'ISO-10303-21;',
  'HEADER;',
  'FILE_DESCRIPTION((\'\'),\'2;1\');',
  'FILE_NAME(\'n.ifc\',\'2026-01-01T00:00:00\',(\'\'),(\'\'),\'\',\'\',\'\');',
  'FILE_SCHEMA((\'IFC4\'));',
  'ENDSEC;',
  'DATA;',
  '#1=IFCPROJECT(\'0kF0kSTOX3ovkcpuOhkPrX\',$,\'N\',$,$,$,$,(#20),#10);',
  '#10=IFCUNITASSIGNMENT((#11));',
  '#11=IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.);',
  '#20=IFCGEOMETRICREPRESENTATIONCONTEXT($,\'Model\',3,1.0E-05,#21,$);',
  '#21=IFCAXIS2PLACEMENT3D(#22,$,$);',
  '#22=IFCCARTESIANPOINT((0.,0.,0.));',
]

const FIXTURE_TAIL = ['ENDSEC;', 'END-ISO-10303-21;', '']

/* Grid #100 and the grid placement #200 hangs off, written in dependency
 * order — every record before the one that references it — so the product's
 * FORWARD closure is complete at its own record and the only thing that can
 * defer it is the inverse scan. #100 carries no ObjectPlacement, so it is not
 * itself a placed product and cannot muddy a deferral count. */
const LOCAL_GRID_AND_PRODUCT_CHAIN = [
  '#100=IFCGRID(\'1kF0kSTOX3ovkcpuOhkPrX\',$,\'Near\',$,$,$,$,(#110),(#130),$,.RECTANGULAR.);',
  '#112=IFCCARTESIANPOINT((0.,0.));',
  '#113=IFCCARTESIANPOINT((1.,0.));',
  '#111=IFCPOLYLINE((#112,#113));',
  '#110=IFCGRIDAXIS(\'A\',#111,.T.);',
  '#132=IFCCARTESIANPOINT((0.,0.));',
  '#133=IFCCARTESIANPOINT((0.,1.));',
  '#131=IFCPOLYLINE((#132,#133));',
  '#130=IFCGRIDAXIS(\'1\',#131,.T.);',
  '#202=IFCVIRTUALGRIDINTERSECTION((#110,#130),(0.,0.));',
  '#201=IFCGRIDPLACEMENT(#202,$);',
]

/* Grid #300's axes and their curves. */
const FAR_GRID_AXES_TAIL = [
  '#310=IFCGRIDAXIS(\'B\',#311,.T.);',
  '#330=IFCGRIDAXIS(\'2\',#331,.T.);',
  '#311=IFCPOLYLINE((#312,#313));',
  '#312=IFCCARTESIANPOINT((0.,0.));',
  '#313=IFCCARTESIANPOINT((1.,0.));',
  '#331=IFCPOLYLINE((#332,#333));',
  '#332=IFCCARTESIANPOINT((0.,0.));',
  '#333=IFCCARTESIANPOINT((0.,1.));',
]


/**
 * Run the report and return everything below the blocker heading.
 *
 * @param file The model to report on.
 * @return The blocker attribution lines, or '' when there are none.
 */
function blockerBlock(file: string): string {

  const script = path.resolve(process.cwd(), 'scripts/layout_report.mjs')
  const out =
    execFileSync(process.execPath, [script, file], { stdio: 'pipe' }).toString()

  const at = out.indexOf(BLOCKER_HEADING)

  return at < 0 ? '' : out.slice(at + BLOCKER_HEADING.length)
}


/**
 * The sharded table's row for one progress percentage, as counts per shard
 * count in `SHARD_COUNTS` order (N=1, 2, 4, 8).
 *
 * @param file The model to report on.
 * @param pct The progress row to read, e.g. 50.
 * @return The four cumulative counts on that row.
 */
function shardedRow(file: string, pct: number): number[] {

  const script = path.resolve(process.cwd(), 'scripts/layout_report.mjs')
  const out =
    execFileSync(process.execPath, [script, file], { stdio: 'pipe' }).toString()

  const table = out.slice(out.indexOf(SHARDED_HEADING))
  const row = new RegExp(`^\\s*${pct}% \\|(.*)$`, 'm').exec(table)

  if (row === null) {
    throw new Error(`no ${pct}% row in the sharded table of ${file}`)
  }

  return row[1].trim().split(/\s+/).map(Number)
}


/**
 * A comment line of exactly `bytes` bytes including the newline `join` adds.
 *
 * Padding is how these fixtures put a record at a chosen FRACTION of the
 * file, which is the only way to exercise a shard band boundary. Comments are
 * inert to the report — `eachRecord` and `eachRef` both skip them — so they
 * move offsets without adding records or references.
 *
 * @param bytes Total size to occupy, newline included.
 * @return The comment line.
 */
function padTo(bytes: number): string {

  const overhead = 5

  if (bytes < overhead) {
    throw new Error(`padding of ${bytes} bytes is below the comment overhead`)
  }

  return `/*${'x'.repeat(bytes - overhead)}*/`
}


describe('layout_report grid-placement closure', () => {

  let workDir: string

  beforeEach(() => {
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'layout-report-'))
  })

  afterEach(() => {
    fs.rmSync(workDir, { recursive: true, force: true })
  })

  test('the closure runs past the intersection to the axis leaf points', () => {

    // The fixture writes the axis chain after the products that need it, so
    // on a leading prefix every grid-placed product is blocked and the
    // report has to say WHICH record it is blocked on. Before conway#546 the
    // walk stopped at IFCVIRTUALGRIDINTERSECTION and attributed all four to
    // it — which is the report saying "these are ready once the intersection
    // is scanned", exactly the optimistic claim, since an intersection is
    // useless without the axes it names.
    const blockers = blockerBlock('data/grid_placement_tail_axes.ifc')

    // What actually arrives last for #500: its axis polylines' points, which
    // the fixture writes after every grid axis record. conway#542 measured
    // that the last record in a blocked chain is a leaf on 100% of the corpus
    // files that defer, and this is the grid spelling of it. Reaching it at
    // all needs the whole forward chain — intersection, axes, axis curves,
    // points — so a walk that stops at the intersection fails here.
    expect(blockers).toMatch(
        new RegExp(`\\s${GRID_TAIL_LEAF_BLOCKED}\\s+\\(\\s*\\d+%\\)\\s+IFCCARTESIANPOINT`))
  })

  test('the inverse gridByAxis scan gates every grid-placed product', () => {

    // conway#607, the half conway#546 deliberately left open.
    //
    // extractGridPlacement resolves the intersection and then calls
    // gridByAxis, which scans EVERY IfcGrid's UAxes/VAxes/WAxes because
    // IfcGridAxis carries no schema route back to its grid (PartOfU/V/W are
    // INVERSE attributes the generated layer drops). Those lists are
    // reference arrays, so conway#546 classifies their throw too — meaning
    // the engine additionally requires every IfcGrid's axis list to be
    // indexed before ANY grid placement resolves.
    //
    // A forward closure structurally cannot see that: it runs from a product
    // through the records it references, and a product never references the
    // grid — the grid references the axis, not the reverse. So product #1000,
    // whose own intersection, axes and axis curves are entirely inside the
    // head, used to be reported as blocked on its own intersection record,
    // while the engine holds it until grid #400's axis list arrives at the
    // tail. That is the silently-flattering direction again, and it is why
    // the fix is an inverse pre-pass rather than another entry in a type set.
    //
    // All three of the fixture's remaining deferring products land here
    // rather than only #1000, and that is the point of consequence 2 in the
    // issue: the scan visits every grid, so grid #400's tail axes hold back
    // #200 and #800 too, whose own chains complete earlier.
    const blockers = blockerBlock('data/grid_placement_tail_axes.ifc')

    expect(blockers).toMatch(
        new RegExp(`\\s${GRID_TAIL_INVERSE_BLOCKED}\\s+\\(\\s*\\d+%\\)\\s+IFCGRIDAXIS`))

    // And nothing is attributed to the intersection any more. Before the fix
    // #1000 was, which is the report claiming it is ready as soon as its own
    // intersection is scanned — the optimistic claim this closes.
    expect(blockers).not.toContain('IFCVIRTUALGRIDINTERSECTION')
  })

  test('a grid-placed product whose own chain is local still waits on a VISIBLE grid', () => {

    // The inverse gate in isolation. Everything product #200 references —
    // placement, intersection, axes, curves, points — is written BEFORE it,
    // so its forward closure is complete the moment the product record is
    // scanned and the report said, correctly for that closure and wrongly for
    // the engine, that nothing in this file defers at all.
    //
    // Grid #300 is the only thing that changes that, and the ORDER of its
    // record is the whole point: it sits in the same prefix as #200 while its
    // axes are at the tail, so `model.types(IfcGrid)` hands it to the scan,
    // reading its axis list throws, and the scan fails as a whole. A grid
    // placement is held by a grid it has nothing to do with — that is the
    // all-or-nothing property, stated as consequence 2 of the issue.
    const file = path.join(workDir, 'local_chain_visible_grid.ifc')

    fs.writeFileSync(file, [
      ...FIXTURE_HEAD,
      // Grid #100 and product #200's whole placement chain, in dependency
      // order, so the product's forward closure resolves at its own record.
      ...LOCAL_GRID_AND_PRODUCT_CHAIN,
      // Grid #300 BEFORE the product it gates. Placed against nothing, and
      // ObjectPlacement is absent so it is not itself a placed product — that
      // keeps the deferral count below unambiguous.
      '#300=IFCGRID(\'3kF0kSTOX3ovkcpuOhkPrX\',$,\'Far\',$,$,$,$,(#310),(#330),$,.RECTANGULAR.);',
      '#200=IFCBUILDINGELEMENTPROXY(\'2kF0kSTOX3ovkcpuOhkPrX\',$,\'Local\',$,$,#201,$,$,.NOTDEFINED.);',
      // ---- tail: grid #300's axes, and nothing #200 references
      ...FAR_GRID_AXES_TAIL,
      ...FIXTURE_TAIL,
    ].join('\n'))

    const blockers = blockerBlock(file)

    // #330 is the last axis record grid #300 lists. Naming it as the blocker
    // is only possible through the inverse pass — no forward walk from #200
    // reaches #300 or anything it references.
    expect(blockers).toMatch(/\s1\s+\(\s*\d+%\)\s+IFCGRIDAXIS/)
  })

  test('the gate reaches a product through IfcLocalPlacement.PlacementRelTo', () => {

    // The nesting the seeding is built for, and the one path round 2 could
    // only verify by hand. A product's ObjectPlacement is an
    // IfcLocalPlacement whose PlacementRelTo is the IfcGridPlacement, so the
    // product does not reference the grid placement directly and the flag has
    // to travel up the chain through the fixed point to reach it.
    //
    // Same shape as the VISIBLE-grid test otherwise: #300 is in the prefix
    // with its axes at the tail, and #200's own chain is entirely behind it.
    const file = path.join(workDir, 'nested_grid_placement.ifc')

    fs.writeFileSync(file, [
      ...FIXTURE_HEAD,
      ...LOCAL_GRID_AND_PRODUCT_CHAIN,
      '#203=IFCLOCALPLACEMENT(#201,#21);',
      '#300=IFCGRID(\'3kF0kSTOX3ovkcpuOhkPrX\',$,\'Far\',$,$,$,$,(#310),(#330),$,.RECTANGULAR.);',
      '#200=IFCBUILDINGELEMENTPROXY(\'2kF0kSTOX3ovkcpuOhkPrX\',$,\'Nested\',$,$,#203,$,$,.NOTDEFINED.);',
      ...FAR_GRID_AXES_TAIL,
      ...FIXTURE_TAIL,
    ].join('\n'))

    // Without the propagation the product is gated by nothing at all and the
    // report prints no blocker block, since every record it references is
    // already behind it.
    expect(blockerBlock(file)).toMatch(/\s1\s+\(\s*\d+%\)\s+IFCGRIDAXIS/)
  })

  test('a grid the prefix has not reached yet gates nothing', () => {

    // The counterweight, and the correction codex found in round 1 of #607.
    //
    // `gridByAxis` scans `model.types(IfcGrid)`, which iterates the TYPE
    // INDEX — so a grid record the prefix has not reached is never handed to
    // the scan and cannot throw. Gating on "the last axis of any grid in the
    // FILE" would defer #200 here anyway, which is over-deferral: for a tool
    // whose entire output is a deferral measurement that is exactly as wrong
    // as the optimism this issue exists to remove, just less flattering.
    //
    // Nothing is sticky across prefixes either — both preview channels build
    // a fresh IfcGeometryExtraction per generation, so `gridByAxis_` never
    // survives into the next prefix and each one re-runs the scan over the
    // grids it can see.
    //
    // Byte-for-byte the file above with ONE record moved: grid #300 now sits
    // after the product instead of before it.
    const file = path.join(workDir, 'unreached_grid.ifc')

    fs.writeFileSync(file, [
      ...FIXTURE_HEAD,
      ...LOCAL_GRID_AND_PRODUCT_CHAIN,
      '#200=IFCBUILDINGELEMENTPROXY(\'2kF0kSTOX3ovkcpuOhkPrX\',$,\'Local\',$,$,#201,$,$,.NOTDEFINED.);',
      // ---- everything below is outside the prefix that already holds #200
      '#300=IFCGRID(\'3kF0kSTOX3ovkcpuOhkPrX\',$,\'Far\',$,$,$,$,(#310),(#330),$,.RECTANGULAR.);',
      ...FAR_GRID_AXES_TAIL,
      ...FIXTURE_TAIL,
    ].join('\n'))

    // Nothing in this file defers: #200's own chain is behind it, and the one
    // grid that could gate it is not visible until after it is emitted. So
    // the report prints no blocker block at all.
    expect(blockerBlock(file)).toBe('')
  })

  test('the sharded gate takes the max in BAND PROGRESS, not of the byte offset', () => {

    // The second finding of codex round 1, and it is invisible on every other
    // fixture here: `bandProgress` resets at each band boundary, so it is NOT
    // monotonic in absolute offset. Taking one file-wide "last axis by byte
    // offset" and converting THAT to band progress therefore answers a
    // different question from "the last axis any reader reaches" — the max has
    // to be taken after the mapping, per shard count.
    //
    // Why a fixture of its own: on data/grid_placement_tail_axes.ifc the two
    // formulas agree to 0.0000 at N=1, 2, 4 and 8, so a test written against
    // that file would pin nothing. The reason is not that grid #400's axes are
    // contiguous — it is that they all FIT WITHIN A SINGLE BAND at every
    // simulated shard count, which is what makes the mapping monotone over the
    // set being maxed. A grid whose axes span a boundary is the case that
    // separates the two, and this fixture is the smallest such grid.
    //
    // Two axes of one grid, placed either side of the N=2 boundary: #410 at
    // ~49% of the file (band 0, nearly done) and #420 at ~52% (band 1, barely
    // started). #420 is last by byte offset and FIRST to be reached with two
    // readers, so the two formulas differ by most of a band.
    //
    // Nothing else in the file straddles anything: product #200's own chain
    // and grid #400's record are all early in band 0, and grid #400 carries no
    // ObjectPlacement so #200 is the only placed product in the file.
    const file = path.join(workDir, 'band_boundary_axes.ifc')

    const head = [
      ...FIXTURE_HEAD,
      '#400=IFCGRID(\'4kF0kSTOX3ovkcpuOhkPrX\',$,\'Straddle\',$,$,$,$,(#410),(#420),$,.RECTANGULAR.);',
      ...LOCAL_GRID_AND_PRODUCT_CHAIN.slice(1),
      '#200=IFCBUILDINGELEMENTPROXY(\'2kF0kSTOX3ovkcpuOhkPrX\',$,\'Local\',$,$,#201,$,$,.NOTDEFINED.);',
    ]
    const axisA = '#410=IFCGRIDAXIS(\'B\',#111,.T.);'
    const axisB = '#420=IFCGRIDAXIS(\'2\',#131,.T.);'

    // Solve the padding for a chosen total: the head runs to 49% of it, one
    // axis follows, a short pad carries the next past the 50% boundary, and
    // the rest of the file is trailing pad.
    const total = STRADDLE_TOTAL_BYTES
    const headBytes = head.join('\n').length + 1
    const paddingBefore = Math.round(total * STRADDLE_BEFORE_BOUNDARY) - headBytes
    const paddingBetween = Math.round(total * STRADDLE_AFTER_BOUNDARY) -
      (headBytes + paddingBefore + axisA.length + 1)
    const tailBytes = FIXTURE_TAIL.join('\n').length
    const paddingAfter = total -
      (Math.round(total * STRADDLE_AFTER_BOUNDARY) + axisB.length + 1 + tailBytes)

    fs.writeFileSync(file, [
      ...head,
      padTo(paddingBefore),
      axisA,
      padTo(paddingBetween),
      axisB,
      padTo(paddingAfter),
      ...FIXTURE_TAIL,
    ].join('\n'))

    // The fixture validates ITSELF before it validates the script: padding
    // arithmetic that drifted would otherwise leave both formulas agreeing
    // and the assertion below passing for no reason.
    const written = fs.readFileSync(file)
    const size = written.length
    const text = written.toString('latin1')
    const bandProgress = (offset: number, shards: number): number => {
      const band = Math.min(shards - 1, Math.floor(offset / size * shards))
      return (offset - band * size / shards) / (size / shards)
    }
    const atA = bandProgress(text.indexOf('#410='), 2)
    const atB = bandProgress(text.indexOf('#420='), 2)

    expect(text.indexOf('#420=')).toBeGreaterThan(text.indexOf('#410='))
    expect(atA).toBeGreaterThan(STRADDLE_LATE_IN_BAND)
    expect(atB).toBeLessThan(STRADDLE_EARLY_IN_BAND)

    // With one reader there is no boundary to straddle and both formulas
    // agree, so this column is the control: the product is emittable by the
    // last decile either way.
    expect(shardedRow(file, ROW_ALL_SCANNED)[SHARD_N1]).toBe(1)

    // With two readers the gate is #410's 0.98, not #420's 0.04. The product
    // is therefore NOT emittable at 90% of per-shard progress — which is
    // exactly what the old formula claimed, and it claimed it from the start.
    expect(shardedRow(file, ROW_NINE_TENTHS)[SHARD_N2]).toBe(0)
    expect(shardedRow(file, ROW_ALL_SCANNED)[SHARD_N2]).toBe(1)
  })

  test('a grid nothing is placed against does not gate its own product', () => {

    // The counterweight, and the reason the grid types live in their own
    // set rather than in PLACEMENT_NAMES. An IFCGRID references its axes
    // and is itself a placed product, so folding the axis chain into the
    // set that gates a REFERENCING product made every grid look unusable
    // until its axis points were scanned. The engine requires no such
    // thing: a grid places off its own IfcLocalPlacement and carries no
    // representation.
    //
    // The polyline here is the shape the corpus actually has thousands of
    // — a swept-solid profile curve — and it must stay off the placement
    // closure too.
    const file = path.join(workDir, 'polyline_no_grid_placement.ifc')

    fs.writeFileSync(file, [
      'ISO-10303-21;',
      'HEADER;',
      'FILE_DESCRIPTION((\'\'),\'2;1\');',
      'FILE_NAME(\'n.ifc\',\'2026-01-01T00:00:00\',(\'\'),(\'\'),\'\',\'\',\'\');',
      'FILE_SCHEMA((\'IFC4\'));',
      'ENDSEC;',
      'DATA;',
      '#1=IFCPROJECT(\'0kF0kSTOX3ovkcpuOhkPrX\',$,\'N\',$,$,$,$,(#20),#10);',
      '#10=IFCUNITASSIGNMENT((#11));',
      '#11=IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.);',
      '#20=IFCGEOMETRICREPRESENTATIONCONTEXT($,\'Model\',3,1.0E-05,#21,$);',
      '#21=IFCAXIS2PLACEMENT3D(#22,$,$);',
      '#22=IFCCARTESIANPOINT((0.,0.,0.));',
      '#23=IFCDIRECTION((0.,0.,1.));',
      // A grid with a polyline axis and a line axis. No product is placed
      // against it, so none of this is on any placement closure.
      '#100=IFCGRID(\'1kF0kSTOX3ovkcpuOhkPrX\',$,\'G\',$,$,#101,$,(#110),(#130),$,.RECTANGULAR.);',
      '#101=IFCLOCALPLACEMENT($,#21);',
      '#110=IFCGRIDAXIS(\'A\',#111,.T.);',
      '#111=IFCPOLYLINE((#112,#113));',
      '#112=IFCCARTESIANPOINT((0.,0.));',
      '#113=IFCCARTESIANPOINT((1.,0.));',
      '#130=IFCGRIDAXIS(\'1\',#131,.T.);',
      '#131=IFCLINE(#132,#134);',
      '#132=IFCCARTESIANPOINT((0.,0.));',
      // The axis leaf that only an over-broad closure reaches, and it is
      // written LAST so an over-broad walk would name it as the blocker.
      '#134=IFCVECTOR(#135,1.);',
      // An ordinary local-placed product whose GEOMETRY uses a polyline.
      '#200=IFCBUILDINGELEMENTPROXY(\'2kF0kSTOX3ovkcpuOhkPrX\',$,\'S\',$,$,#201,#210,$,.NOTDEFINED.);',
      '#201=IFCLOCALPLACEMENT($,#202);',
      '#202=IFCAXIS2PLACEMENT3D(#203,$,$);',
      '#203=IFCCARTESIANPOINT((1.,2.,3.));',
      '#210=IFCPRODUCTDEFINITIONSHAPE($,$,(#211));',
      '#211=IFCSHAPEREPRESENTATION(#20,\'Body\',\'SweptSolid\',(#212));',
      '#212=IFCEXTRUDEDAREASOLID(#213,#21,#23,2.);',
      '#213=IFCARBITRARYCLOSEDPROFILEDEF(.AREA.,$,#214);',
      '#214=IFCPOLYLINE((#215,#216,#217,#215));',
      '#215=IFCCARTESIANPOINT((0.,0.));',
      '#216=IFCCARTESIANPOINT((1.,0.));',
      '#217=IFCCARTESIANPOINT((1.,1.));',
      '#135=IFCDIRECTION((0.,1.));',
      'ENDSEC;',
      'END-ISO-10303-21;',
      '',
    ].join('\n'))

    const blockers = blockerBlock(file)

    // #135 is the grid axis' direction and the last record in the file. It
    // may only be named here if the walk followed IFCGRID -> IFCGRIDAXIS,
    // which is the over-correction this asserts is absent.
    expect(blockers).not.toContain('IFCDIRECTION')

    // The same counterweight for the inverse gate of conway#607: this file
    // has an IFCGRID with axes, but no IFCGRIDPLACEMENT, so gridByAxis is
    // never called and nothing may be gated on the axis scan. That is the
    // property the corpus depends on — every model in it has grids and none
    // has a grid placement, so every published figure must be untouched.
    expect(blockers).not.toContain('IFCGRIDAXIS')

    // And the file does defer, so the assertion above is not vacuous —
    // #200's own placement chain bottoms out at #203, written after it.
    expect(blockers).toContain('IFCCARTESIANPOINT')
  })
})
