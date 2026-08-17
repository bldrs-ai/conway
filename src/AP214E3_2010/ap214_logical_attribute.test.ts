// ISO 10303-42 declares `b_spline_surface.u_closed`, `v_closed` and
// `self_intersect` (and the matching attributes on `b_spline_curve`,
// `composite_curve`, `offset_curve_2d/3d`, `offset_surface` and
// `shape_aspect`) as LOGICAL, which is three-valued - `.T.`, `.F.`, `.U.`.
// The generator used to emit `extractBoolean` for them, so a `.U.` threw
// 'Value in STEP was incorrectly typed' out of the getter and took the whole
// face - and in the NIST AP242 exports, whole solids - with it.
//
// The generator now carries a distinct `logical` token, so a bare EXPRESS
// LOGICAL selects `extractLogical` and reads `.U.` as null. This test pins
// that against the regenerated tree: it fails on the pre-regen output, where
// the `.U.` reads throw. BOOLEAN attributes are asserted alongside, because
// the failure mode of an over-broad fix is every BOOLEAN quietly becoming a
// LOGICAL. See bldrs-ai/conway#480 and IFC-gen-internal#2.
import { beforeAll, describe, expect, test } from '@jest/globals'

import AP214StepParser from './ap214_step_parser'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ParseResult } from '../step/parsing/step_parser'
import { b_spline_surface_with_knots, edge_curve } from './AP214E3_2010_gen'
import { ConwayGeometry } from '../../dependencies/conway-geom'


const conwayGeom = new ConwayGeometry()

/**
 * Initialize the wasm.
 */
async function initializeWasm() {

  await conwayGeom.initialize()
}

const parser = AP214StepParser.Instance

// A bilinear patch, so the fixture stays readable, carrying the same
// attribute shape as the bicubic patches in `nist_ftc_07_asme1_ap242-e2.stp`
// that this defect dropped: `.UNSPECIFIED.` surface form followed by
// u_closed / v_closed / self_intersect all written `.U.`. That file has 20
// such surfaces, and each one lost an ADVANCED_FACE.
const UNKNOWN_SURFACE = `
#1 = CARTESIAN_POINT('',(0.,0.,0.));
#2 = CARTESIAN_POINT('',(1.,0.,0.));
#3 = CARTESIAN_POINT('',(0.,1.,0.));
#4 = CARTESIAN_POINT('',(1.,1.,0.));
#10 = B_SPLINE_SURFACE_WITH_KNOTS('',1,1,((#1,#2),(#3,#4)),.UNSPECIFIED.,
  .U.,.U.,.U.,(2,2),(2,2),(0.,1.),(0.,1.),.UNSPECIFIED.);
`

// The same surface with the three LOGICALs written as the two determinate
// values. A fix that read every LOGICAL as null would pass the `.U.` case
// and fail here.
const DETERMINATE_SURFACE = `
#1 = CARTESIAN_POINT('',(0.,0.,0.));
#2 = CARTESIAN_POINT('',(1.,0.,0.));
#3 = CARTESIAN_POINT('',(0.,1.,0.));
#4 = CARTESIAN_POINT('',(1.,1.,0.));
#10 = B_SPLINE_SURFACE_WITH_KNOTS('',1,1,((#1,#2),(#3,#4)),.UNSPECIFIED.,
  .T.,.F.,.F.,(2,2),(2,2),(0.,1.),(0.,1.),.UNSPECIFIED.);
`

const SURFACE_EXPRESS_ID = 10

// `edge_curve.same_sense` is a genuine BOOLEAN and must keep reading as one.
// The edge's vertex and curve references are left dangling: only the trailing
// BOOLEAN is read here, and resolving the rest would need a curve definition
// that has nothing to do with what is being pinned.
const BOOLEAN_EDGES = `
#20 = EDGE_CURVE('',#21,#22,#23,.T.);
#30 = EDGE_CURVE('',#21,#22,#23,.F.);
`

const TRUE_EDGE_EXPRESS_ID = 20
const FALSE_EDGE_EXPRESS_ID = 30

/**
 * Parse a STEP fragment and return the model it produced.
 *
 * @param source The STEP text to parse.
 * @return {ReturnType< typeof parser.parseDataToModel >[ 1 ]} The model.
 */
function modelOf( source: string ) {

  const [ result, model ] =
    parser.parseDataToModel( new ParsingBuffer( new TextEncoder().encode( source ) ) )

  // INCOMPLETE is expected for the edge fixture, whose references dangle.
  if ( model === void 0 ||
    ( result !== ParseResult.COMPLETE && result !== ParseResult.INCOMPLETE ) ) {
    throw new Error( `parse failed with result ${result}` )
  }

  return model
}

/**
 * Parse a surface fixture and read back its three LOGICAL attributes.
 *
 * @param source The STEP text to parse.
 * @return {Array< boolean | null >} u_closed, v_closed, self_intersect.
 */
function surfaceLogicalsOf( source: string ): Array< boolean | null > {

  const surface = modelOf( source ).getElementByExpressID( SURFACE_EXPRESS_ID )

  if ( !( surface instanceof b_spline_surface_with_knots ) ) {
    throw new Error( 'expected a b_spline_surface_with_knots' )
  }

  return [ surface.u_closed, surface.v_closed, surface.self_intersect ]
}


beforeAll( async () => {
  await initializeWasm()
})

describe( 'a LOGICAL attribute', () => {

  test( '.U. reads as null instead of throwing', () => {

    expect( surfaceLogicalsOf( UNKNOWN_SURFACE ) ).toEqual( [ null, null, null ] )
  })

  test( '.T. and .F. still read as true and false', () => {

    expect( surfaceLogicalsOf( DETERMINATE_SURFACE ) ).toEqual( [ true, false, false ] )
  })
})

describe( 'a BOOLEAN attribute', () => {

  test( '.T. and .F. are unaffected', () => {

    const model = modelOf( BOOLEAN_EDGES )

    const trueEdge = model.getElementByExpressID( TRUE_EDGE_EXPRESS_ID )
    const falseEdge = model.getElementByExpressID( FALSE_EDGE_EXPRESS_ID )

    if ( !( trueEdge instanceof edge_curve ) || !( falseEdge instanceof edge_curve ) ) {
      throw new Error( 'expected two edge_curves' )
    }

    expect( trueEdge.same_sense ).toBe( true )
    expect( falseEdge.same_sense ).toBe( false )
  })
})
