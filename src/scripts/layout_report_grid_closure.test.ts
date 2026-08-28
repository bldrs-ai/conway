import { execFileSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, test } from '@jest/globals'


/**
 * `scripts/layout_report.mjs`'s placement closure, over the grid chain
 * (conway#546).
 *
 * The script is the static analyser that produced conway#542's published
 * per-file "products deferring" percentages. It walks a product's placement
 * closure transitively and reports, per prefix, how many products could be
 * emitted — and which record arrived last in the chain that blocked the
 * rest. `IFCGRIDPLACEMENT` was in its `PLACEMENT_NAMES` set but nothing that
 * a grid placement references was, so the walk expanded exactly ONE hop and
 * stopped at `IFCVIRTUALGRIDINTERSECTION`, never reaching the axes, their
 * axis curves, or the points those bottom out in.
 *
 * **The direction of that error is what makes it worth a test.** A closure
 * that stops early makes a grid-placed product look usable SOONER than it
 * is, so the deferral and sharded-readiness curves came out optimistic — a
 * silently flattering number, which is the same failure mode as the
 * fixed-point defect codex found in round 2 of #543.
 *
 * Driven through the CLI rather than by import: the script's module body
 * runs the whole tool on `process.argv`, so importing it under Jest would
 * hand it Jest's own arguments. `render_glb_paths.test.ts` drives
 * `scripts/render_glb.cjs` the same way.
 */

/* The report's blocker block, verbatim enough to slice on. */
const BLOCKER_HEADING = 'deferred by (last record in the chain to arrive):'

/* data/grid_placement_tail_axes.ifc, by construction. Three of its four
 * deferring proxies bottom out in an axis polyline's points, which is what
 * the extended closure now reaches. */
const GRID_TAIL_LEAF_BLOCKED = 3

/* The one that does NOT: product #1000, whose engine-side blocker is an
 * INVERSE lookup the forward closure structurally cannot follow. See the
 * residual test below. */
const GRID_TAIL_INVERSE_BLOCKED = 1


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

    // What actually arrives last for three of them: the axis polylines'
    // points. conway#542 measured that the last record in a blocked chain is
    // a leaf on 100% of the corpus files that defer, and this is the grid
    // spelling of it.
    expect(blockers).toMatch(
        new RegExp(`\\s${GRID_TAIL_LEAF_BLOCKED}\\s+\\(\\s*\\d+%\\)\\s+IFCCARTESIANPOINT`))
  })

  test('the inverse gridByAxis dependency is a known, unmodelled residual', () => {

    // Deliberately pinning a GAP, so it cannot be quietly forgotten and so
    // the follow-up that closes it fails here rather than passing silently.
    //
    // extractGridPlacement resolves the intersection and then calls
    // gridByAxis, which scans EVERY IfcGrid's UAxes/VAxes/WAxes because
    // IfcGridAxis carries no schema route back to its grid (PartOfU/V/W are
    // INVERSE attributes the generated layer drops). Those lists are
    // reference arrays, so conway#546 classifies their throw too — meaning
    // the engine additionally requires every IfcGrid record AND its axis
    // lists to be indexed before ANY grid placement resolves.
    //
    // This walker cannot see that. Its closure runs forward from a product
    // through the records it references, and a product never references the
    // grid — the grid references the axis, not the reverse. So product
    // #1000, whose own intersection and axis curves are entirely inside the
    // prefix, is reported as blocked only on its own intersection record,
    // while the engine holds it until grid #400's axis list arrives at the
    // tail. The report is therefore still OPTIMISTIC for it, in the same
    // silently-flattering direction conway#546 exists to correct.
    //
    // Closing this needs an inverse pass (grid -> axes) rather than another
    // entry in a type set, which is why it is tracked separately.
    const blockers = blockerBlock('data/grid_placement_tail_axes.ifc')

    expect(blockers).toMatch(
        new RegExp(`\\s${GRID_TAIL_INVERSE_BLOCKED}\\s+\\(\\s*\\d+%\\)\\s+IFCVIRTUALGRIDINTERSECTION`))
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

    // And the file does defer, so the assertion above is not vacuous —
    // #200's own placement chain bottoms out at #203, written after it.
    expect(blockers).toContain('IFCCARTESIANPOINT')
  })
})
