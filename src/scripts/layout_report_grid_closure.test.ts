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

/* data/grid_placement_tail_axes.ifc, by construction. One of its four
 * deferring proxies — #500, whose own axes are at the tail — bottoms out in
 * an axis polyline's points LATER than the last grid axis record, so the
 * forward closure is still what names its blocker. */
const GRID_TAIL_LEAF_BLOCKED = 1

/* The other three, all held by the same single all-or-nothing scan. */
const GRID_TAIL_INVERSE_BLOCKED = 3


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

  test('a grid-placed product whose own chain is local still waits on a distant grid', () => {

    // The inverse gate in isolation. Everything product #200 references —
    // placement, intersection, axes, curves, points — is written BEFORE it,
    // so its forward closure is complete the moment the product record is
    // scanned and the report said, correctly for that closure and wrongly for
    // the engine, that nothing in this file defers at all.
    //
    // Grid #300 is the only thing that changes that. It is placed against
    // nothing and shares no record with #200; its axes merely sit at the tail.
    // gridByAxis scans it anyway, so the engine holds #200 until those axes
    // arrive.
    const file = path.join(workDir, 'local_chain_distant_grid.ifc')

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
      // Grid #100 and product #200's whole placement chain, in dependency
      // order, so the product's forward closure resolves at its own record.
      '#100=IFCGRID(\'1kF0kSTOX3ovkcpuOhkPrX\',$,\'Near\',$,$,#101,$,(#110),(#130),$,.RECTANGULAR.);',
      '#101=IFCLOCALPLACEMENT($,#21);',
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
      '#200=IFCBUILDINGELEMENTPROXY(\'2kF0kSTOX3ovkcpuOhkPrX\',$,\'Local\',$,$,#201,$,$,.NOTDEFINED.);',
      // Grid #300: unrelated to #200, axes at the tail.
      '#300=IFCGRID(\'3kF0kSTOX3ovkcpuOhkPrX\',$,\'Far\',$,$,#301,$,(#310),(#330),$,.RECTANGULAR.);',
      '#301=IFCLOCALPLACEMENT($,#21);',
      '#310=IFCGRIDAXIS(\'B\',#311,.T.);',
      '#330=IFCGRIDAXIS(\'2\',#331,.T.);',
      '#311=IFCPOLYLINE((#312,#313));',
      '#312=IFCCARTESIANPOINT((0.,0.));',
      '#313=IFCCARTESIANPOINT((1.,0.));',
      '#331=IFCPOLYLINE((#332,#333));',
      '#332=IFCCARTESIANPOINT((0.,0.));',
      '#333=IFCCARTESIANPOINT((0.,1.));',
      'ENDSEC;',
      'END-ISO-10303-21;',
      '',
    ].join('\n'))

    const blockers = blockerBlock(file)

    // #330 is the last axis record grid #300 lists. Naming it as the blocker
    // is only possible through the inverse pass — no forward walk from #200
    // reaches #300 or anything it references.
    expect(blockers).toMatch(/\s1\s+\(\s*\d+%\)\s+IFCGRIDAXIS/)
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
