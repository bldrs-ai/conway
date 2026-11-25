/* eslint-disable no-magic-numbers */
// Boolean chains whose shape-defining half-space clips sit innermost.
//
// Exporters (ArchiCAD in particular) write a wall layer as an extrusion,
// trimmed to the roof by one or more IfcBooleanClippingResults, with the
// join and opening cuts as IfcBooleanResults on top of that:
//
//   ((((extrusion - clip) - clip) - cut) - cut) - ... - cut
//
// Two things went wrong on such chains:
//
//  1. The CSG depth budget (csgDepthLimit, default 20) is spent from the
//     representation item downwards and skipped every boolean past it. With
//     the clips innermost, a chain one link longer than the budget lost its
//     clips, and the layer rendered as the whole untrimmed extrusion —
//     metres of wall sticking up through the roof. Clips are now never
//     skipped by the budget.
//
//  2. ArchiCAD repeats the same clip as separate, identical entities (eight
//     in a row). Re-cutting the face the previous clip just made is a fully
//     coplanar boolean the kernel does not survive cleanly: on the real model
//     it emitted stray triangles more than a metre outside the solid. A
//     repeated identical half-space cut is now passed through, which is
//     exact: (A - H) - H = A - H.
//
// The fixture is inline rather than a data/*.ifc file because the Tier-A
// quick-check in build.yml globs data/*.ifc and would demand a committed
// golden for it.
import { describe, expect, test, beforeAll } from '@jest/globals'

import { ConwayGeometry } from '../../dependencies/conway-geom'
import { ExtractResult } from '../core/shared_constants'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ParseResult } from '../step/parsing/step_parser'
import { IfcGeometryExtraction } from './ifc_geometry_extraction'
import IfcStepParser from './ifc_step_parser'


/** Cuts on top of the clip: two more than the default CSG budget of 20. */
const CUT_COUNT = 22

/** How many times the repeated-clip product writes the same clip. */
const REPEAT_COUNT = 8

/** Where the 6 degree clip plane leaves the top of the 10 m long box. */
const CLIPPED_TOP = 1 + (10 * Math.tan(6 * Math.PI / 180))

/**
 * Build the fixture: a 10 x 1 x 3 m box, clipped to a 6 degree plane through
 * z = 1, under three products:
 *
 *   LongChain     the clip, then CUT_COUNT notch cuts along the bottom edge
 *   RepeatedClip  the clip written REPEAT_COUNT times as separate entities
 *   SingleClip    the clip once
 *
 * @return {string} The IFC text.
 */
function buildFixture(): string {

  const lines: string[] = []
  let next = 1000

  const add = (text: string): string => {

    const id = `#${++next}`

    lines.push(`${id}= ${text};`)

    return id
  }

  const clip = (): string => {

    // Normal pointing down with AgreementFlag .T.: the half-space's material
    // is above the plane, so the difference trims the box to below it.
    const plane = add(`IFCPLANE(${add(`IFCAXIS2PLACEMENT3D(${
      add('IFCCARTESIANPOINT((0.,0.,1.))')},${
      add('IFCDIRECTION((0.104528463268,0.,-0.994521895368))')},${
      add('IFCDIRECTION((0.,1.,0.))')})`)})`)
    const points = [ '-1.,-1.', '11.,-1.', '11.,2.', '-1.,2.' ].map(
        (point) => add(`IFCCARTESIANPOINT((${point}))`))
    const boundary = add(`IFCPOLYLINE((${[ ...points, points[0] ].join(',')}))`)

    return add(`IFCPOLYGONALBOUNDEDHALFSPACE(${plane},.T.,#6,${boundary})`)
  }

  const product = (name: string, item: string): void => {

    const representation = add(`IFCSHAPEREPRESENTATION(#7,'Body','CSG',(${item}))`)
    const shape = add(`IFCPRODUCTDEFINITIONSHAPE($,$,(${representation}))`)

    add(`IFCBUILDINGELEMENTPROXY('${name.padEnd(22, '0')}',$,'${name}',$,$,#9,${shape},$,$)`)
  }

  let chain = add(`IFCBOOLEANCLIPPINGRESULT(.DIFFERENCE.,#13,${clip()})`)

  for (let cut = 0; cut < CUT_COUNT; ++cut) {

    const centre = add(`IFCCARTESIANPOINT((${(0.3 + (0.4 * cut)).toFixed(2)},0.5))`)
    const profile =
      add(`IFCRECTANGLEPROFILEDEF(.AREA.,$,${add(`IFCAXIS2PLACEMENT2D(${centre},$)`)},0.2,2.)`)
    const position =
      add(`IFCAXIS2PLACEMENT3D(${add('IFCCARTESIANPOINT((0.,0.,-0.5))')},$,$)`)
    const cutter = add(`IFCEXTRUDEDAREASOLID(${profile},${position},#4,0.7)`)

    chain = add(`IFCBOOLEANRESULT(.DIFFERENCE.,${chain},${cutter})`)
  }

  product('LongChain', chain)

  let repeated = '#13'

  for (let repeat = 0; repeat < REPEAT_COUNT; ++repeat) {
    repeated = add(`IFCBOOLEANCLIPPINGRESULT(.DIFFERENCE.,${repeated},${clip()})`)
  }

  product('RepeatedClip', repeated)
  product('SingleClip', add(`IFCBOOLEANCLIPPINGRESULT(.DIFFERENCE.,#13,${clip()})`))

  return `ISO-10303-21;
HEADER;
FILE_DESCRIPTION((''),'2;1');
FILE_NAME('csg-clip-chain.ifc','2026-11-25T00:00:00',(''),(''),'','','');
FILE_SCHEMA(('IFC4'));
ENDSEC;
DATA;
#1= IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.);
#2= IFCUNITASSIGNMENT((#1));
#3= IFCCARTESIANPOINT((0.,0.,0.));
#4= IFCDIRECTION((0.,0.,1.));
#5= IFCDIRECTION((1.,0.,0.));
#6= IFCAXIS2PLACEMENT3D(#3,#4,#5);
#7= IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.E-05,#6,$);
#8= IFCPROJECT('0000000000000000000001',$,'P',$,$,$,$,(#7),#2);
#9= IFCLOCALPLACEMENT($,#6);
#10= IFCCARTESIANPOINT((5.,0.5));
#11= IFCAXIS2PLACEMENT2D(#10,$);
#12= IFCRECTANGLEPROFILEDEF(.AREA.,$,#11,10.,1.);
#13= IFCEXTRUDEDAREASOLID(#12,#6,#4,3.);
${lines.join('\n')}
ENDSEC;
END-ISO-10303-21;
`
}

interface ProductMesh {
  vertexCount: number
  min: number[]
  max: number[]
}

const products = new Map<string, ProductMesh>()

/**
 * Parse the fixture, extract it, and record each product's placed vertex
 * count and bounds by product name.
 *
 * @return {Promise<ExtractResult>} The extraction result.
 */
async function extractFixture(): Promise<ExtractResult> {

  const parser = IfcStepParser.Instance
  const input = new ParsingBuffer(Buffer.from(buildFixture(), 'utf8'))

  if (parser.parseHeader(input)[1] !== ParseResult.COMPLETE) {
    return ExtractResult.INCOMPLETE
  }

  const conwayGeometry = new ConwayGeometry()

  if (!await conwayGeometry.initialize()) {
    return ExtractResult.INCOMPLETE
  }

  const [, model] = parser.parseDataToModel(input)

  if (model === void 0) {
    return ExtractResult.INCOMPLETE
  }

  // The defaults: CSG depth limited, budget 20.
  const extraction = new IfcGeometryExtraction(conwayGeometry, model)
  const [result, scene] = extraction.extractIFCGeometryData()

  for (const [, transform, geometry, , entity] of scene.walk()) {

    const placed = geometry.geometry.clone()

    if (transform !== void 0) {
      placed.applyTransform(transform)
    }

    const vertices =
      conwayGeometry.floatHeapSlice(placed.GetVertexData(), placed.GetVertexDataSize())
    const min = [Infinity, Infinity, Infinity]
    const max = [-Infinity, -Infinity, -Infinity]

    // Interleaved position + normal.
    for (let offset = 0; offset < vertices.length; offset += 6) {
      for (let axis = 0; axis < 3; ++axis) {
        min[axis] = Math.min(min[axis], vertices[offset + axis])
        max[axis] = Math.max(max[axis], vertices[offset + axis])
      }
    }

    placed.delete()

    const name = (entity as unknown as { Name: string | null } | undefined)?.Name ?? ''

    products.set(name, { vertexCount: vertices.length / 6, min, max })
  }

  return result
}

beforeAll(async () => {
  expect(await extractFixture()).toBe(ExtractResult.COMPLETE)
})

describe('boolean chains with innermost half-space clips', () => {

  test('a chain longer than the CSG depth budget keeps its clip', () => {

    const longChain = products.get('LongChain')

    expect(longChain).toBeDefined()

    // Unclipped, the top would be the extrusion's 3 m.
    expect(longChain!.max[2]).toBeCloseTo(CLIPPED_TOP, 3)
    expect(longChain!.min[2]).toBeCloseTo(0, 3)
  })

  test('a clip repeated as identical entities matches the clip written once', () => {

    const repeated = products.get('RepeatedClip')
    const single = products.get('SingleClip')

    expect(repeated).toBeDefined()
    expect(single).toBeDefined()

    expect(single!.max[2]).toBeCloseTo(CLIPPED_TOP, 3)

    // Before the repeat was passed through, the coplanar re-cuts left a
    // mesh more than ten times the size (526 vertices against 36).
    expect(repeated!.vertexCount).toBe(single!.vertexCount)

    for (let axis = 0; axis < 3; ++axis) {
      expect(repeated!.min[axis]).toBeCloseTo(single!.min[axis], 4)
      expect(repeated!.max[axis]).toBeCloseTo(single!.max[axis], 4)
    }
  })
})
