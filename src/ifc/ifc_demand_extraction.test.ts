/* eslint-disable no-magic-numbers, @typescript-eslint/no-explicit-any */
// Phase B2: per-product demand extraction must produce the same meshes the
// whole-model walk produces — same products with geometry, same vertex and
// index counts per product — since both now run the same deduplicated
// per-product body (extractProductGeometry).
import fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import { IfcGeometryExtraction } from './ifc_geometry_extraction'
import { ParseResult } from '../step/parsing/step_parser'
import IfcStepParser from './ifc_step_parser'
import IfcStepModel from './ifc_step_model'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ConwayGeometry } from '../../dependencies/conway-geom'
import { ExtractResult } from '../core/shared_constants'
import {
  IfcProduct,
  IfcRelAssociatesMaterial,
  IfcRelDefinesByType,
  IfcStyledItem,
} from './ifc4_gen'
import EntityTypesIfc from './ifc4_gen/entity_types_ifc.gen'
import { openStreamedIfcModelFromStore } from './ifc_stream_open'
import {
  InMemoryStepByteStore,
  WindowedStepBufferProvider,
} from '../step/step_buffer_provider'

let conwayGeometry: ConwayGeometry

/**
 * Parse a fresh model from index.ifc (models are stateful; each extraction
 * mode gets its own).
 *
 * @return {IfcStepModel} The parsed model.
 */
function freshModel(): IfcStepModel {
  const bytes: Buffer = fs.readFileSync( 'data/index.ifc' )
  const input = new ParsingBuffer( bytes )

  expect( IfcStepParser.Instance.parseHeader( input )[ 1 ] )
      .toBe( ParseResult.COMPLETE )

  const [ , model ] = IfcStepParser.Instance.parseDataToModel( input )

  expect( model ).toBeDefined()
  return model as IfcStepModel
}

/**
 * Collect per-localID mesh signatures (vertex + triangle counts) from a
 * model's extracted geometry.
 *
 * @param extraction The extraction whose model geometry to summarise.
 * @return {Map<number, string>} localID → "vertexCount/triangleCount".
 */
function meshSignatures( extraction: IfcGeometryExtraction ): Map<number, string> {

  const signatures = new Map<number, string>()

  for ( const mesh of extraction.model.geometry ) {

    const geometry = ( mesh as any ).geometry

    if ( geometry === void 0 || typeof geometry.getVertexCount !== 'function' ) {
      continue
    }

    signatures.set(
        ( mesh as any ).localID,
        `${geometry.getVertexCount()}/${geometry.getTriangleCount()}` )
  }

  return signatures
}

beforeAll( async () => {
  conwayGeometry = new ConwayGeometry()
  expect( await conwayGeometry.initialize() ).toBe( true )
} )

describe( 'per-product demand extraction (Phase B2)', () => {

  test( 'demand extraction over all products matches the whole-model walk', () => {

    // Whole-model walk (the CI-anchored path).
    const wholeExtraction =
      new IfcGeometryExtraction( conwayGeometry, freshModel() )

    expect( wholeExtraction.extractIFCGeometryData()[ 0 ] )
        .toBe( ExtractResult.COMPLETE )

    const wholeSignatures = meshSignatures( wholeExtraction )
    expect( wholeSignatures.size ).toBeGreaterThan( 0 )

    // Demand path: prepare once, then extract every product individually.
    const demandModel = freshModel()
    const demandExtraction =
      new IfcGeometryExtraction( conwayGeometry, demandModel )

    demandExtraction.prepareDemandExtraction()

    let extractedProducts = 0

    for ( const product of demandModel.types( IfcProduct ) ) {
      if ( demandExtraction.extractProductGeometryByLocalID( product.localID ) ) {
        ++extractedProducts
      }
    }

    expect( extractedProducts ).toBeGreaterThan( 0 )

    const demandSignatures = meshSignatures( demandExtraction )

    // Same set of products with geometry, same mesh shape per product.
    expect( demandSignatures ).toEqual( wholeSignatures )
  } )

  test( 'a single product extracts on demand without the whole-model walk', () => {

    // Whole-model reference signatures (mesh localIDs key representation
    // items, not products — so parity is checked per matching key).
    const reference = new IfcGeometryExtraction( conwayGeometry, freshModel() )
    reference.extractIFCGeometryData()
    const referenceSignatures = meshSignatures( reference )

    const model = freshModel()
    const extraction = new IfcGeometryExtraction( conwayGeometry, model )

    // Extract single products on the fresh model until one yields a mesh —
    // proving a lone product materialises without the whole-model walk.
    let produced = 0

    for ( const product of model.types( IfcProduct ) ) {
      extraction.extractProductGeometryByLocalID( product.localID )
      produced = meshSignatures( extraction ).size

      if ( produced > 0 ) {
        break
      }
    }

    expect( produced ).toBeGreaterThan( 0 )
    expect( produced ).toBeLessThan( referenceSignatures.size )

    // Every mesh the single extraction produced matches the reference's
    // mesh for the same key exactly.
    for ( const [ localID, signature ] of meshSignatures( extraction ) ) {
      expect( referenceSignatures.get( localID ) ).toBe( signature )
    }
  } )

  test( 'a non-product local ID is refused', () => {

    const model = freshModel()
    const extraction = new IfcGeometryExtraction( conwayGeometry, model )

    // localID 0 in index.ifc is not an IfcProduct (first record is a root
    // non-product entity in this fixture; the assertion below guards that).
    const first = model.getElementByLocalID( 0 )
    expect( first instanceof IfcProduct ).toBe( false )

    expect( extraction.extractProductGeometryByLocalID( 0 ) ).toBe( false )
  } )

  test( 'styled-item Item local IDs resolve without hydrating the item', () => {

    const model = freshModel()
    let checked = 0

    for ( const styledItem of model.types( IfcStyledItem ) ) {

      const viaIndex = styledItem.extractReferenceLocalID( 0, 0, 1, true )
      const viaItem = styledItem.Item?.localID ?? null

      expect( viaIndex ).toBe( viaItem )
      ++checked
    }

    expect( checked ).toBeGreaterThan( 0 )
  } )
} )


// conway#526. `extractGeometryBatchAsync` prefetches a batch of products
// through one Promise.all over ONE shared `seen` set, so the closure walk
// skips any record a sibling product already claimed — that sibling has
// pinned the range, but a pin reserves a chunk against eviction, it does
// not make it resident, and its read may still be in flight. The faceset
// payload pass then scanned the shared set and synchronously acquired a
// record nobody had finished reading:
//
//   StepBufferNotResidentError: STEP source range [164128495, 164187850)
//   is not resident — call ensureResident before synchronous extraction
//
// which escaped the prefetch and aborted the whole load on a large model.
describe( 'concurrent windowed product prefetch (conway#526)', () => {

  const CHUNK = 4 * 1024

  /**
   * A store-backed model over a deliberately cramped window: 4 KiB
   * chunks with 2 resident, so a sibling's chunks are gone by the time
   * anyone else looks for them.
   *
   * @param store The backing store.
   * @return {Promise<IfcStepModel>} The windowed model.
   */
  async function windowedModel( store: InMemoryStepByteStore ):
      Promise< IfcStepModel > {

    const open = await openStreamedIfcModelFromStore( store, { pool: CHUNK } )

    expect( open.model ).toBeDefined()

    return new IfcStepModel(
        void 0,
        open.columns as any,
        new WindowedStepBufferProvider( store, CHUNK, 2 ) )
  }

  test( 'a shared seen set does not make one product read records it never paged',
      async () => {

        const store = new InMemoryStepByteStore(
            new Uint8Array( fs.readFileSync( 'data/index.ifc' ) ) )
        const model = await windowedModel( store )
        const extraction = new IfcGeometryExtraction( conwayGeometry, model )

        extraction.quietRecoverableLogging = true
        extraction.deferDanglingPlacements = true

        const prepPins = await extraction.ensureResidentForDemandPrep()

        try {
          extraction.prepareDemandExtraction( true )
        } finally {
          model.releaseSourceViews( prepPins )
          model.unpinLocalIDs( prepPins )
        }

        const products = [ ...model.types( IfcProduct ) ].map( ( p ) => p.localID )

        expect( products.length ).toBeGreaterThan( 1 )

        // The pump's shape: one shared pin set across the batch.
        const pins = new Set< number >()
        const leafSpans: { address: number, length: number }[] = []

        // Seed the shared set until it holds facesets — not every
        // product carries tessellated geometry, and the payload pass is
        // what this is about.
        let seeded = 0
        let claimedFacesets: number[] = []

        while ( seeded < products.length && claimedFacesets.length === 0 ) {

          await extraction.ensureResidentForProductExtract(
              products[ seeded++ ], pins, leafSpans )

          claimedFacesets = [ ...pins ].filter( ( id ) =>
            model.typeIDOf( id ) === EntityTypesIfc.IFCPOLYGONALFACESET )
        }

        expect( claimedFacesets.length ).toBeGreaterThan( 0 )
        expect( seeded ).toBeLessThan( products.length )

        // Now force the state the production race produced by timing:
        // records that are IN the shared set but NOT resident from the
        // next caller's point of view. Dropping the pins and filling the
        // 2-chunk window with an unrelated range evicts them, which is
        // the same invariant violation as a sibling's read still being
        // in flight — and unlike the race, it happens every run.
        model.releaseSourceViews( pins )
        model.unpinLocalIDs( pins )

        for ( const span of leafSpans ) {
          model.unpinAddressRange( span.address, span.length )
        }

        leafSpans.length = 0

        const facesetAt = model.recordAddress( claimedFacesets[ 0 ] )!
        const far = facesetAt >= CHUNK * 4 ? 0 : store.byteLength - CHUNK * 2

        await model.ensureResidentRange( far, CHUNK * 2 )

        // Pre-#526 the payload pass walked the shared set, synchronously
        // acquired those evicted facesets and threw
        // StepBufferNotResidentError out of the prefetch, killing the load.
        await expect( Promise.all( products.slice( seeded ).map( ( localID ) =>
          extraction.ensureResidentForProductExtract(
              localID, pins, leafSpans ) ) ) ).resolves.toBeDefined()

        expect( pins.size ).toBeGreaterThan( 0 )

        model.releaseSourceViews( pins )
        model.unpinLocalIDs( pins )

        for ( const span of leafSpans ) {
          model.unpinAddressRange( span.address, span.length )
        }
      }, 120000 )

  test( 'the closure walk reports only what THIS call claimed', async () => {

    const model = await windowedModel(
        new InMemoryStepByteStore( new Uint8Array( fs.readFileSync( 'data/index.ifc' ) ) ) )
    const products = [ ...model.types( IfcProduct ) ].map( ( p ) => p.localID )

    expect( products.length ).toBeGreaterThan( 1 )

    // The invariant the payload pass now rests on: with a shared set,
    // a second walk claims only what the first left unclaimed, so
    // `claimed` is what this call has actually awaited residency for.
    const shared = new Set< number >()
    const firstClaimed = new Set< number >()
    const secondClaimed = new Set< number >()

    await model.ensureResidentClosureByLocalID(
        products[ 0 ], void 0, shared, void 0, void 0, void 0, firstClaimed )
    await model.ensureResidentClosureByLocalID(
        products[ 0 ], void 0, shared, void 0, void 0, void 0, secondClaimed )

    expect( firstClaimed.size ).toBeGreaterThan( 0 )
    expect( secondClaimed.size ).toBe( 0 )

    for ( const id of firstClaimed ) {
      expect( shared.has( id ) ).toBe( true )
    }

    model.unpinLocalIDs( shared )
  }, 120000 )

  test( 'a product whose paging fails is skipped, not fatal to the batch', async () => {

    const model = await windowedModel(
        new InMemoryStepByteStore( new Uint8Array( fs.readFileSync( 'data/index.ifc' ) ) ) )
    const extraction = new IfcGeometryExtraction( conwayGeometry, model )

    const products = [ ...model.types( IfcProduct ) ].map( ( p ) => p.localID )
    const failing = products[ 0 ]

    // A store read that rejects for one product's closure must not take
    // the batch — the pump's Promise.all would otherwise reject and the
    // load dies where a missing product would do.
    const realEnsure = model.ensureResidentClosureByLocalID.bind( model )

    ;( model as any ).ensureResidentClosureByLocalID =
      ( localID: number, ...rest: unknown[] ) => {

        if ( localID === failing ) {
          return Promise.reject( new Error( 'simulated store read failure' ) )
        }

        return ( realEnsure as any )( localID, ...rest )
      }

    const pins = new Set< number >()

    await expect( Promise.all( products.slice( 0, 4 ).map( ( localID ) =>
      extraction.ensureResidentForProductExtract(
          localID, pins ) ) ) ).resolves.toBeDefined()

    ;( model as any ).ensureResidentClosureByLocalID = realEnsure

    model.releaseSourceViews( pins )
    model.unpinLocalIDs( pins )
  }, 120000 )

  test( 'the style-seed scan costs one pass over the model, not one per product',
      async () => {

        // conway#561: the closure walk RETURNS the caller's `seen` set, and
        // ensureResidentForAggregateExtract shares one set across every
        // related product of a relationship. Scanning that set for style
        // seeds per product is therefore O(products x model): on SKYLARK250
        // it was 5m16s of dead air between the end of parsing and the first
        // mesh. Scanning `claimed` — what THIS call paged — makes the total
        // work one pass over the shared set no matter how many products
        // share it.
        const model = await windowedModel(
            new InMemoryStepByteStore(
                new Uint8Array( fs.readFileSync( 'data/index.ifc' ) ) ) )
        const extraction = new IfcGeometryExtraction( conwayGeometry, model )

        extraction.quietRecoverableLogging = true
        extraction.deferDanglingPlacements = true

        const prepPins = await extraction.ensureResidentForDemandPrep()

        try {
          extraction.prepareDemandExtraction()
        } finally {
          model.releaseSourceViews( prepPins )
          model.unpinLocalIDs( prepPins )
        }

        const products = [ ...model.types( IfcProduct ) ].map( ( p ) => p.localID )

        expect( products.length ).toBeGreaterThan( 2 )

        // Counted after prepare, so only the prefetch's own lookups land here.
        const styledItemMap = ( extraction as any ).materials.styledItemMap
        const realGet = styledItemMap.get.bind( styledItemMap )
        let lookups = 0

        styledItemMap.get = ( key: number ) => {
          ++lookups
          return realGet( key )
        }

        // The aggregate prefetch's shape: ONE set for every product.
        const pins = new Set< number >()
        const leafSpans: { address: number, length: number }[] = []

        try {

          for ( const localID of products ) {
            await extraction.ensureResidentForProductExtract(
                localID, pins, leafSpans )
          }

        } finally {
          styledItemMap.get = realGet
        }

        expect( pins.size ).toBeGreaterThan( 0 )

        // Each record is scanned by the one call that claimed it, so the
        // lookups never exceed the shared set. Pre-fix this was
        // products.length x |pins| and the assertion fails by ~an order of
        // magnitude on this fixture alone.
        expect( lookups ).toBeLessThanOrEqual( pins.size )

        model.releaseSourceViews( pins )
        model.unpinLocalIDs( pins )

        for ( const span of leafSpans ) {
          model.unpinAddressRange( span.address, span.length )
        }
      }, 120000 )

  test( 'an aborted walk still pages the style seeds for what it claimed',
      async () => {

        // conway#561 review (codex P2): `claimed` partitions the shared set
        // only across walks that COMPLETE. The closure walk claims and pins
        // each record into `seen` BEFORE awaiting residency, and has no
        // internal catch — so a store rejection leaves its claims in `seen`
        // and unwinds, the guard contains the failure without retrying
        // (conway#526), and no sibling can ever claim those records again.
        // Scanning the cumulative set used to recover their style seeds by
        // accident; scanning `claimed` does not, which would silently strip
        // colours from every product sharing geometry with the failed one.
        const model = await windowedModel(
            new InMemoryStepByteStore(
                new Uint8Array( fs.readFileSync( 'data/index.ifc' ) ) ) )
        const extraction = new IfcGeometryExtraction( conwayGeometry, model )

        extraction.quietRecoverableLogging = true
        extraction.deferDanglingPlacements = true

        const prepPins = await extraction.ensureResidentForDemandPrep()

        try {
          extraction.prepareDemandExtraction()
        } finally {
          model.releaseSourceViews( prepPins )
          model.unpinLocalIDs( prepPins )
        }

        const products = [ ...model.types( IfcProduct ) ].map( ( p ) => p.localID )

        expect( products.length ).toBeGreaterThan( 1 )

        const failing = products[ 0 ]
        const sibling = products[ 1 ]

        // A seed owned by a record the aborted walk is GUARANTEED to claim:
        // the product's own record is wave 1, added to `seen` before the
        // first await. Planted rather than discovered so the test does not
        // depend on where index.ifc happens to put a styled item.
        const sentinel = products[ products.length - 1 ]

        ;( extraction as any ).materials.styledItemMap.set( failing, sentinel )

        // Reject partway through the BFS, after wave 1 has been claimed.
        const realEnsureResident = model.ensureResidentByLocalID.bind( model )
        let countdown = -1
        let injected = false

        ;( model as any ).ensureResidentByLocalID = ( id: number ) => {

          if ( countdown > 0 && --countdown === 0 ) {
            injected = true
            return Promise.reject( new Error( 'simulated store read failure' ) )
          }

          return realEnsureResident( id )
        }

        // Every seed list handed to the closure walk, so "was the sentinel
        // paged" is observable without reaching into the walk.
        const realClosure = model.ensureResidentClosureByLocalID.bind( model )
        const seedLists: number[][] = []

        ;( model as any ).ensureResidentClosureByLocalID =
          ( id: number, extraLocalIDs?: Iterable< number >, ...rest: unknown[] ) => {

            if ( extraLocalIDs !== void 0 ) {
              seedLists.push( [ ...extraLocalIDs ] )
            }

            return ( realClosure as any )( id, extraLocalIDs, ...rest )
          }

        const pins = new Set< number >()
        const leafSpans: { address: number, length: number }[] = []

        try {

          countdown = 5

          await extraction.ensureResidentForProductExtract(
              failing, pins, leafSpans )

          countdown = -1

          // A probe that never fires looks exactly like a clean model: if
          // the closure finished before the fifth read the scenario never
          // happened and the assertions below prove nothing.
          expect( injected ).toBe( true )
          expect( pins.has( failing ) ).toBe( true )

          const sentinelPagings =
            seedLists.filter( ( seeds ) => seeds.includes( sentinel ) ).length

          // Pre-fix this is 0: the aborted walk never reaches the style
          // pass, and `failing` is in the shared set forever.
          expect( sentinelPagings ).toBe( 1 )

          // The sibling skips `failing` (it is already in `seen`), which is
          // exactly why the aborted walk had to page the seed itself — and
          // it must not re-page it either.
          await extraction.ensureResidentForProductExtract(
              sibling, pins, leafSpans )

          expect( seedLists.filter(
              ( seeds ) => seeds.includes( sentinel ) ).length ).toBe( 1 )

        } finally {
          ;( model as any ).ensureResidentByLocalID = realEnsureResident
          ;( model as any ).ensureResidentClosureByLocalID = realClosure
        }

        model.releaseSourceViews( pins )
        model.unpinLocalIDs( pins )

        for ( const span of leafSpans ) {
          model.unpinAddressRange( span.address, span.length )
        }
      }, 120000 )
} )


// codex finding on bldrs-ai/conway#704: the map-prep residency contract is a
// list, and a sweep added to prepareExtractionMaps_ without a matching entry
// in ensureResidentForDemandPrep's `recordOnlyTypes` fails SILENTLY on a
// windowed source. Its field reads throw StepBufferNotResidentError,
// handleMapPrepError_ swallows the throw (MATERIAL_RELATED_OBJECTS_PERMISSIVE
// is true), and the sweep contributes nothing — while the same model opened
// classically is correct, so nothing downstream reports a difference.
//
// Measured on the Renga convenience-store model
// (bldrs-ai/test-models-private#61) with IfcRelDefinesByType missing from the
// list: 0 of its 103 records pinned, and 5 / 11 / 17 swallowed
// not-resident errors as the window tightened from 4 KiB x 16 to 1 KiB x 2.
// That model's inheritance survived anyway — a Renga export writes each
// IfcRelDefinesByType on the line after its type object, so the 1-hop pin of
// the type dragged in the relationship's chunk — which is precisely why this
// asserts the pin set rather than a colour: the colour is right by adjacency
// luck that no other file owes us.
describe( 'windowed demand-prep residency (conway#704)', () => {

  /** 4 KiB chunks, 2 resident — the cramped window the suite above uses. */
  const CHUNK = 4 * 1024

  test( 'prep pins every record of every relationship its sweeps read',
      async () => {

        const store = new InMemoryStepByteStore(
            new Uint8Array( fs.readFileSync( 'data/surface_style_shading_mapped.ifc' ) ) )
        const open = await openStreamedIfcModelFromStore( store, { pool: CHUNK } )

        expect( open.model ).toBeDefined()

        const model = new IfcStepModel(
            void 0,
            open.columns as any,
            new WindowedStepBufferProvider( store, CHUNK, 2 ) )

        expect( model.isSourceExternal ).toBe( true )

        const extraction = new IfcGeometryExtraction( conwayGeometry, model )
        const prepPins = await extraction.ensureResidentForDemandPrep()

        try {

          // IfcRelAssociatesMaterial is the control: it has been in
          // `recordOnlyTypes` since the map prep existed, so it holds whether
          // or not the type-material work landed. If it ever stops holding,
          // the assertion below is measuring the harness, not the list.
          for ( const type of [ IfcRelAssociatesMaterial, IfcRelDefinesByType ] ) {

            // Materialising to read `.localID` costs no source bytes:
            // descriptors come from the index columns and the generated
            // constructors have empty bodies.
            const localIDs = [ ...model.types( type ) ].map( ( record ) => record.localID )

            // Guard the guard — an empty fixture would satisfy any
            // "nothing unpinned" claim.
            expect( localIDs.length ).toBeGreaterThan( 0 )
            expect( localIDs.filter( ( localID ) => !prepPins.has( localID ) ) ).toEqual( [] )
          }

        } finally {
          model.releaseSourceViews( prepPins )
          model.unpinLocalIDs( prepPins )
        }
      }, 120000 )
} )
