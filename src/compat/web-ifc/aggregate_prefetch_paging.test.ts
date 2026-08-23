/* eslint-disable no-magic-numbers */
// conway#561 §5: the demand pump's aggregates pass used to page EVERY
// related product's `#ref` closure of a relationship before the stepper's
// first step, and hold all of it pinned until the last step. The pass it
// serves has been incremental since conway#550 — only the prefetch was
// still per relationship — so on a model whose products are all aggregate
// targets (SKYLARK250: 1,992 products under two relationships) that pinned
// 384 MiB of a 400 MB file against a 64 MiB window, in one un-yielding
// `await` chain, before a single mesh existed.
//
// Both tests here drive the real windowed pump
// (OpenModelStream + DEFER_GEOMETRY + ExtractGeometryBatchAsync, which is
// Share's load path) over a fixture whose one relationship holds twelve
// related products with disjoint closures. Neither reaches into the paging
// itself: one counts the products the pump asks to have paged, the other
// counts the source pins it holds at once, and both are calibrated against
// the whole-relationship prefetch measured on the same fixture.
import * as fs from 'fs'

import { beforeAll, describe, expect, jest, test } from '@jest/globals'

import { IfcGeometryExtraction } from '../../ifc/ifc_geometry_extraction'
import IfcStepModel from '../../ifc/ifc_step_model'
import IfcStepParser from '../../ifc/ifc_step_parser'
import ParsingBuffer from '../../parsing/parsing_buffer'
import StepModelBase from '../../step/step_model_base'
import { InMemoryStepByteStore } from '../../step/step_buffer_provider'
import { FlatMesh, IfcAPI } from './ifc_api'
import Logger from '../../logging/logger'
import { IfcRelAggregates } from '../../ifc/ifc4_gen'
import { openStreamedIfcModelFromStore } from '../../ifc/ifc_stream_open'
import { ConwayGeometry } from '../../../dependencies/conway-geom'

const SETTINGS = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true }

/** Related products in data/aggregate_paged_prefetch.ifc's one relationship. */
const RELATED_PRODUCTS = 12

/**
 * The fixture's non-product related objects: one mid-list, a run of three
 * (the last of which is an IfcFurnitureType whose RepresentationMaps reach
 * 1,602 records), and one after the last product.
 */
const NON_PRODUCT_EXPRESS_IDS = [ 150, 160, 161, 170, 151 ]

let api: IfcAPI
let buffer: Uint8Array

/**
 * Capture a mesh as plain comparable data (the shape
 * ifc_api_streamed_open.test.ts uses).
 *
 * @param mesh The mesh to flatten.
 * @return {object} Express ID plus every placed geometry.
 */
function flatten( mesh: FlatMesh ): object {

  const geometries: object[] = []

  for ( let where = 0; where < mesh.geometries.size(); ++where ) {

    const placed = mesh.geometries.get( where )

    geometries.push( {
      color: placed.color,
      geometryExpressID: placed.geometryExpressID,
      flatTransformation: [ ...placed.flatTransformation ],
    } )
  }

  return { expressID: mesh.expressID, geometries }
}

/**
 * Every mesh a classic (fully resident, whole-model walk) open delivers.
 *
 * @return {object[]} Meshes by express ID.
 */
function classicMeshes(): object[] {

  const modelID = api.OpenModel( buffer, SETTINGS )

  expect( modelID ).toBeGreaterThanOrEqual( 0 )

  const captured: object[] = []

  api.StreamAllMeshes( modelID, ( mesh: FlatMesh ) => {
    captured.push( flatten( mesh ) )
  } )

  api.CloseModel( modelID )

  return captured
}

/**
 * Two calibrations read off the fixture itself rather than hard-coded, so
 * the bounds below describe the change instead of drifting with the file:
 * the pins the WHOLE-relationship prefetch takes, and the local IDs of the
 * related objects that are not products.
 *
 * @return {Promise<object>} `{ pins, nonProducts }`.
 */
async function relationshipCalibration():
    Promise< { pins: number, nonProducts: number[] } > {

  const store = new InMemoryStepByteStore( buffer )
  const open = await openStreamedIfcModelFromStore( store )

  expect( open.model ).toBeDefined()

  const model = open.model as IfcStepModel
  const conwayGeometry = new ConwayGeometry()

  expect( await conwayGeometry.initialize() ).toBe( true )

  const extraction = new IfcGeometryExtraction( conwayGeometry, model )
  const relAggregates = [ ...model.types( IfcRelAggregates ) ]

  expect( relAggregates.length ).toBe( 1 )

  const prepPins = await extraction.ensureResidentForDemandPrep()

  try {
    extraction.prepareDemandExtraction()
  } finally {
    model.releaseSourceViews( prepPins )
    model.unpinLocalIDs( prepPins )
  }

  const leafSpans: { address: number, length: number }[] = []
  const pins =
    await extraction.ensureResidentForAggregateExtract( relAggregates[ 0 ], leafSpans )

  model.releaseSourceViews( pins )
  model.unpinLocalIDs( pins )

  for ( const span of leafSpans ) {
    model.unpinAddressRange( span.address, span.length )
  }

  // The fixture's four non-product related objects, resolved the same way
  // the extraction resolves them. Local IDs are the parse's dense record
  // index, so they are the same in the pump's own model instance.
  const nonProducts: number[] = []

  for ( const expressID of NON_PRODUCT_EXPRESS_IDS ) {

    const localID = model.resolveExpressID( expressID )

    expect( localID ).toBeDefined()
    nonProducts.push( localID! )
  }

  return { pins: pins.size, nonProducts }
}

/** Window a cramped pump runs behind: 512-byte chunks, 2 resident. */
const CRAMPED_CHUNK = 512
const CRAMPED_RESIDENT_CHUNKS = 2

/**
 * Pump a windowed deferred open to completion, one call at a time.
 *
 * `cramped` opens through OpenModelStreamed + SpillModelSource rather than
 * OpenModelStream, purely to get a window narrow enough that anything the
 * prefetch fails to page really is non-resident: the store-backed open
 * takes the provider's defaults (4 MiB chunks, 16 of them), and this
 * fixture fits in one of those, so nothing can ever be evicted and every
 * residency assertion over it is vacuous. The pump path is the same one
 * either way — `sourceIsExternal` is what selects it.
 *
 * @param batchSize The pump budget per call.
 * @param cramped Run behind a 512-byte window instead of the default.
 * @param onCall Called after each pump call.
 * @return {Promise<object[]>} Every mesh the pump delivered.
 */
async function pumpWindowed(
    batchSize: number,
    cramped: boolean = false,
    onCall?: () => void ): Promise< object[] > {

  const store = new InMemoryStepByteStore( buffer )
  let modelID: number

  if ( cramped ) {

    modelID = await api.OpenModelStreamed(
        buffer, { ...SETTINGS, DEFER_GEOMETRY: true } )

    expect( modelID ).toBeGreaterThanOrEqual( 0 )
    expect( api.SpillModelSource(
        modelID, store, CRAMPED_CHUNK, CRAMPED_RESIDENT_CHUNKS ) ).toBe( true )

  } else {

    modelID = await api.OpenModelStream(
        store, { ...SETTINGS, DEFER_GEOMETRY: true } )
  }

  expect( modelID ).toBeGreaterThanOrEqual( 0 )
  expect( api.getPassthrough( modelID )!.sourceIsExternal ).toBe( true )

  const captured: object[] = []

  for ( ; ; ) {

    // eslint-disable-next-line new-cap
    const { extracted, remaining } = await api.ExtractGeometryBatchAsync(
        modelID, batchSize, ( mesh ) => {
          captured.push( flatten( mesh ) )
        } )

    onCall?.()

    if ( remaining === 0 && extracted === 0 ) {
      break
    }
  }

  api.CloseModel( modelID )

  return captured
}

beforeAll( async () => {
  api = new IfcAPI()
  await api.Init()

  buffer = new Uint8Array(
      fs.readFileSync( 'data/aggregate_paged_prefetch.ifc' ) )
}, 240000 )

describe( 'wave-paged aggregate prefetch (conway#561 §5)', () => {

  test( 'no single pump call pages the whole relationship, and no call ' +
    'pages a non-product at all', async () => {

    const { nonProducts } = await relationshipCalibration()

    const extractionPrototype = IfcGeometryExtraction.prototype as any
    const realEnsure = extractionPrototype.ensureResidentForProductExtract

    let pagedThisCall = new Set< number >()
    let mostPagedInOneCall = 0
    let pagedOverall = new Set< number >()

    extractionPrototype.ensureResidentForProductExtract =
      function ( localID: number, ...rest: unknown[] ) {

        pagedThisCall.add( localID )
        pagedOverall.add( localID )

        return realEnsure.call( this, localID, ...rest )
      }

    try {

      await pumpWindowed( 4, false, () => {

        mostPagedInOneCall = Math.max( mostPagedInOneCall, pagedThisCall.size )
        pagedThisCall = new Set< number >()
      } )

    } finally {
      extractionPrototype.ensureResidentForProductExtract = realEnsure
    }

    // A probe that never fires looks exactly like a clean model: the pump
    // has to have paged the whole relationship over the run for the bounds
    // below to mean anything.
    expect( pagedOverall.size ).toBeGreaterThanOrEqual( RELATED_PRODUCTS )

    // The relationship is now stepped across pump calls at the pump's own
    // budget. Pre-fix the call that starts a relationship pages every
    // related product plus the relating one, so this is RELATED_PRODUCTS + 1
    // and the assertion fails by 3x on this fixture alone.
    expect( mostPagedInOneCall ).toBeLessThanOrEqual( 5 )

    // And what makes that budget a BOUND rather than a target: a wave is
    // waveSize related PRODUCTS, so a run of non-products between two of
    // them costs nothing. Deciding an entry is not a product reads no
    // source bytes — only extractProductGeometry reads a record — so paging
    // one is pure waste, and unbounded waste: #170's RepresentationMaps
    // alone reach 1,602 records, which one wave would have had to span to
    // reach the next part (conway#566 review).
    expect( nonProducts.length ).toBe( NON_PRODUCT_EXPRESS_IDS.length )

    for ( const localID of nonProducts ) {
      expect( pagedOverall.has( localID ) ).toBe( false )
    }
  }, 240000 )

  test( 'peak simultaneous pins stay under the whole-relationship prefetch, ' +
    'with identical meshes', async () => {

    const { pins: wholePins } = await relationshipCalibration()

    expect( wholePins ).toBeGreaterThan( RELATED_PRODUCTS )

    const modelPrototype = StepModelBase.prototype as any
    const realPin = modelPrototype.pinByLocalID
    const realUnpin = modelPrototype.unpinByLocalID

    let live = 0
    let peak = 0

    modelPrototype.pinByLocalID = function ( localID: number ) {
      peak = Math.max( peak, ++live )
      return realPin.call( this, localID )
    }

    modelPrototype.unpinByLocalID = function ( localID: number ) {
      --live
      return realUnpin.call( this, localID )
    }

    // The aggregates pass is permissive: a record it cannot read throws
    // StepBufferNotResidentError into its own catch, which logs and
    // abandons the REST of the relationship. A wave that fell behind the
    // stepper — by an entry, or by miscounting the IfcGroup that sits
    // between two products — surfaces there and nowhere else, so the log is
    // an assertion, not decoration.
    const errors = jest.spyOn( Logger, 'error' ).mockImplementation( () => {} )

    let pumped: object[]

    try {
      pumped = await pumpWindowed( 1, true )
    } finally {
      modelPrototype.pinByLocalID = realPin
      modelPrototype.unpinByLocalID = realUnpin
      errors.mockRestore()
    }

    expect( errors.mock.calls ).toEqual( [] )

    expect( peak ).toBeGreaterThan( 0 )

    // Windowed residency is only residency if the prefetch respects it.
    // Pre-fix the pump's peak IS the whole-relationship prefetch (it takes
    // exactly those pins and holds them for every step), so this fails.
    expect( peak ).toBeLessThan( wholePins / 2 )

    // And paging a wave at a time must deliver what paging the relationship
    // whole delivers — including past the IfcGroup the fixture plants in
    // RelatedObjects, which the aggregates pass walks over without
    // extracting, and which therefore makes "the n-th related object" and
    // "the n-th extracted product" different indices.
    const byExpressID = ( entries: object[] ) =>
      [ ...entries ].sort( ( first, second ) =>
        ( first as any ).expressID - ( second as any ).expressID )

    const classic = classicMeshes()

    expect( classic.length ).toBe( RELATED_PRODUCTS )
    expect( byExpressID( pumped ) ).toEqual( byExpressID( classic ) )
  }, 240000 )
} )
