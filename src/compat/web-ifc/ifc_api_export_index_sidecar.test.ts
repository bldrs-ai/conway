/* eslint-disable no-magic-numbers */
// conway#756: an embedder that terminates an engine to free a model (Share's
// per-model worker) brings the next one up with `OpenModelFromIndex` from a
// sidecar the first one EXPORTED. That only works if what comes back is the
// model a fresh parse builds — so this file proves it on every in-repo IFC4
// fixture, through the compat surface Share calls, across every way a model
// is opened:
//
//  1. the exported sidecar is BYTE-IDENTICAL to one serialised off a fresh
//     parse's own columns (resident, streamed, windowed, spilled and
//     index-first opens alike), and re-exporting the reopened model returns
//     the same bytes;
//  2. the reopened model has the same express IDs, the same spatial tree and
//     the same property reads (`getItemProperties` over every line,
//     `getPropertySets` over every rooted entity) as a fresh parse;
//  3. those comparisons can FAIL: a sidecar with a field dropped (the inline
//     range, one express ID, one type) is caught by the comparison that
//     field feeds — the byte check aside, which would catch anything;
//  4. a sidecar for a different source fails the open as `INDEX_STALE`.
import * as fs from 'fs'

import { afterEach, beforeAll, describe, expect, jest, test } from '@jest/globals'

import { IfcAPI, Loadersettings } from './ifc_api'
import { IfcApiProxyIfc } from './ifc_api_proxy_ifc'
import StepEntityBase from '../../step/step_entity_base'
import { InMemoryStepByteStore } from '../../step/step_buffer_provider'
import { openStreamedIfcModelFromStore } from '../../ifc/ifc_stream_open'
import {
  deserializeIndexSidecarToColumns,
  hashSource,
  serializeIndexSidecarFromColumns,
} from '../../step/parsing/index_sidecar'
import { ParseResult } from '../../step/parsing/step_parser'
import { StepIndexColumns } from '../../step/parsing/columnar_index'
import EntityTypesIfc from '../../ifc/ifc4_gen/entity_types_ifc.gen'

const SETTINGS = { COORDINATE_TO_ORIGIN: false, USE_FAST_BOOLS: true }
const DEFER = { ...SETTINGS, DEFER_GEOMETRY: true, STREAMING_CONSUMER: true }
const VERIFY = { ...DEFER, VERIFY_INDEX_SOURCE_HASH: true }

// Every in-repo IFC fixture the index-first open can take. The IFC4X3 ones
// are excluded by design and have their own test below: the index-first
// open refuses IFC4X3 headers, and the compat route's masks have no slot.
const FIXTURES = fs.readdirSync( 'data' )
    .filter( ( name ) => name.endsWith( '.ifc' ) && !name.startsWith( 'ifc4x3_' ) )
    .sort()

let api: IfcAPI

beforeAll( async () => {
  api = new IfcAPI()
  await api.Init()
}, 120000 )

afterEach( () => {
  jest.restoreAllMocks()
} )


/**
 * @param name A file under `data/`.
 * @return {Uint8Array} Its bytes.
 */
function fixture( name: string ): Uint8Array {
  return new Uint8Array( fs.readFileSync( `data/${name}` ) )
}


/**
 * The reference: a sidecar serialised off a FRESH parse's own columns, the
 * way a coordinator built one before an export API existed.
 *
 * @param source The model bytes.
 * @return {Promise<Uint8Array>} The sidecar.
 */
async function referenceSidecar( source: Uint8Array ): Promise<Uint8Array> {

  const cold = await openStreamedIfcModelFromStore( new InMemoryStepByteStore( source ) )

  expect( cold.result ).toBe( ParseResult.COMPLETE )

  return serializeIndexSidecarFromColumns(
      cold.columns, source.byteLength, hashSource( source ) )
}


/**
 * A sidecar whose columns have been edited — the "field dropped from the
 * export" mutants the parity comparisons have to catch.
 *
 * @param sidecar A good sidecar.
 * @param edit Mutates the decoded columns (or returns replacements).
 * @return {Uint8Array} The mutant, with the original source identity.
 */
function mutateSidecar(
    sidecar: Uint8Array,
    edit: ( columns: StepIndexColumns<EntityTypesIfc> ) =>
      StepIndexColumns<EntityTypesIfc> | void ): Uint8Array {

  const decoded = deserializeIndexSidecarToColumns<EntityTypesIfc>( sidecar )
  const columns = edit( decoded.columns ) ?? decoded.columns

  return serializeIndexSidecarFromColumns(
      columns, decoded.sourceByteLength, decoded.sourceHash )
}


/**
 * Everything the parity claim covers, read off one open model through the
 * compat surface: express IDs (sorted), the spatial tree with properties,
 * every line's item properties, and every rooted entity's property sets.
 *
 * @param modelID An open model.
 * @return {Promise<object>} The readings.
 */
async function readings( modelID: number ): Promise<{
  expressIDs: number[],
  spatialTree: string,
  itemProperties: Map<number, string>,
  propertySets: Map<number, string>,
  typedReads: Map<number, string>,
}> {

  const lines = api.GetAllLines( modelID )
  const expressIDs: number[] = []

  for ( let where = 0; where < lines.size(); ++where ) {
    expressIDs.push( lines.get( where ) )
  }

  // Sorted, duplicates kept: GetAllLines reports an ID once per type index
  // that holds it, and that multiplicity is part of what must match.
  expressIDs.sort( ( a, b ) => a - b )

  const spatialTree =
    JSON.stringify( await api.properties.getSpatialStructure( modelID, true ) )

  const itemProperties = new Map<number, string>()

  for ( const expressID of new Set( expressIDs ) ) {
    itemProperties.set(
        expressID,
        String( JSON.stringify(
            await api.properties.getItemProperties( modelID, expressID, false ) ) ) )
  }

  // Property sets of every rooted entity (products, types, the project...),
  // picked off the item reads rather than a type query so this does not
  // depend on how the compat type filter treats abstract supertypes.
  const propertySets = new Map<number, string>()

  for ( const [ expressID, item ] of itemProperties ) {

    if ( !item.includes( '"GlobalId"' ) ) {
      continue
    }

    propertySets.set(
        expressID,
        String( JSON.stringify(
            await api.properties.getPropertySets( modelID, expressID, true ) ) ) )
  }

  return {
    expressIDs,
    spatialTree,
    itemProperties,
    propertySets,
    typedReads: await typedReads( modelID ),
  }
}


/**
 * Render one typed attribute value: a referenced record by express ID, an
 * inline entity by type and its own reading, anything else as JSON.
 *
 * @param value What a typed getter returned.
 * @param depth Inline nesting guard.
 * @return {unknown} A JSON-safe rendering.
 */
function renderTyped( value: unknown, depth: number = 0 ): unknown {

  if ( value instanceof StepEntityBase ) {

    const entity = value as StepEntityBase<number>

    return entity.expressID !== void 0 ?
      { ref: entity.expressID } :
      { inline: entity.type, value: depth < 2 ? typedFields( entity, depth + 1 ) : '...' }
  }

  if ( Array.isArray( value ) ) {
    return value.map( ( item ) => renderTyped( item, depth ) )
  }

  return typeof value === 'bigint' ? String( value ) : value ?? null
}


/**
 * Every PascalCase getter an entity's generated classes declare, read.
 *
 * @param entity The entity.
 * @param depth Inline nesting guard.
 * @return {Record<string, unknown>} Attribute name → rendering (or throw).
 */
function typedFields(
    entity: StepEntityBase<number>, depth: number ): Record<string, unknown> {

  const fields: Record<string, unknown> = {}

  for ( let prototype = Object.getPrototypeOf( entity );
    prototype !== null && prototype !== StepEntityBase.prototype;
    prototype = Object.getPrototypeOf( prototype ) ) {

    for ( const [ name, descriptor ] of
      Object.entries( Object.getOwnPropertyDescriptors( prototype ) ) ) {

      if ( descriptor.get === void 0 || !/^[A-Z]/.test( name ) || name in fields ) {
        continue
      }

      try {
        fields[ name ] = renderTyped( ( entity as any )[ name ], depth )
      } catch ( error ) {
        fields[ name ] = `throws: ${( error as Error ).message}`
      }
    }
  }

  return fields
}


/**
 * The engine's TYPED attribute reads of every top-level record — the reads
 * geometry, styles and materials go through. Distinct from the compat
 * property reads above, which decode a record's raw bytes and so resolve an
 * inline value whether or not the index carries the inline range; the typed
 * path resolves it through the index, and is where a dropped inline range
 * shows (surface styles, transparency, measure-valued attributes).
 *
 * @param modelID An open model.
 * @return {Promise<Map<number, string>>} Express ID → rendered attributes.
 */
async function typedReads( modelID: number ): Promise<Map<number, string>> {

  const model = ( api.getPassthrough( modelID ) as unknown as IfcApiProxyIfc ).model[ 0 ]
  const reads = new Map<number, string>()

  for ( let localID = 0; localID < model.size; ++localID ) {

    await model.ensureResidentByLocalID( localID )

    const entity = model.getElementByLocalID( localID )

    if ( entity?.expressID === void 0 ) {
      continue
    }

    reads.set(
        entity.expressID,
        JSON.stringify( { type: entity.type, fields: typedFields( entity, 0 ) } ) )
  }

  return reads
}


/**
 * Express IDs whose reading differs between two maps (including absent).
 *
 * @param a One reading.
 * @param b The other.
 * @return {number[]} The differing IDs.
 */
function differingIDs( a: Map<number, string>, b: Map<number, string> ): number[] {

  const ids = new Set( [ ...a.keys(), ...b.keys() ] )

  return [ ...ids ].filter( ( id ) => a.get( id ) !== b.get( id ) )
}


/**
 * Open a model from a sidecar over an in-memory store of `source`.
 *
 * @param source The model bytes.
 * @param sidecar The sidecar.
 * @return {Promise<number>} The model ID (or -1).
 */
function openFromIndex( source: Uint8Array, sidecar: Uint8Array ): Promise<number> {
  return api.OpenModelFromIndex( new InMemoryStepByteStore( source ), sidecar, VERIFY )
}


describe( 'IfcAPI.ExportIndexSidecar parity with a fresh parse (conway#756)', () => {

  test( 'the fixture list is the IFC4 corpus, not an empty filter', () => {
    expect( FIXTURES.length ).toBeGreaterThanOrEqual( 10 )
    expect( FIXTURES ).toContain( 'index.ifc' )
  } )

  test.each( FIXTURES )( '%s: every open exports the fresh parse\'s sidecar', async ( name ) => {

    const source = fixture( name )
    const reference = await referenceSidecar( source )

    const spilled = api.OpenModel( source, SETTINGS )

    expect( api.SpillModelSource( spilled, new InMemoryStepByteStore( source ) ) ).toBe( true )

    const opens: [ string, number ][] = [
      [ 'OpenModel', api.OpenModel( source, SETTINGS ) ],
      [ 'OpenModelAsync', await api.OpenModelAsync( source, SETTINGS ) ],
      [ 'OpenModelStreamed', await api.OpenModelStreamed( source, DEFER ) ],
      [ 'OpenModelStream', await api.OpenModelStream( new InMemoryStepByteStore( source ), DEFER ) ],
      [ 'OpenModel + SpillModelSource', spilled ],
    ]

    for ( const [ how, modelID ] of opens ) {

      expect( [ how, modelID >= 0 ] ).toEqual( [ how, true ] )

      const exported = await api.ExportIndexSidecar( modelID )

      // `Buffer.equals` rather than toEqual: a byte mismatch then reports as
      // one boolean per open instead of a multi-megabyte array diff.
      expect( [ how, Buffer.from( exported! ).equals( Buffer.from( reference ) ) ] )
          .toEqual( [ how, true ] )

      // A second export reuses the hash and must not change a byte.
      expect( [ how, Buffer.from( ( await api.ExportIndexSidecar( modelID ) )! )
          .equals( Buffer.from( reference ) ) ] ).toEqual( [ how, true ] )

      api.CloseModel( modelID )
    }
  }, 120000 )

  test.each( FIXTURES )( '%s: a model reopened from its export reads like a fresh parse', async ( name ) => {

    const source = fixture( name )

    const fresh = await api.OpenModelStream( new InMemoryStepByteStore( source ), DEFER )
    const sidecar = ( await api.ExportIndexSidecar( fresh ) )!

    const reopened = await openFromIndex( source, sidecar )

    expect( reopened ).toBeGreaterThanOrEqual( 0 )

    // Byte-identical index: the reopened model's own columns re-serialise
    // to the sidecar it was opened from.
    expect( Buffer.from( ( await api.ExportIndexSidecar( reopened ) )! )
        .equals( Buffer.from( sidecar ) ) ).toBe( true )

    const expected = await readings( fresh )
    const actual = await readings( reopened )

    expect( expected.expressIDs.length ).toBeGreaterThan( 0 )

    // Some fixtures are geometry-only (block.ifc has no project); the main
    // one must actually exercise the property-set comparison.
    if ( name === 'index.ifc' ) {
      expect( expected.propertySets.size ).toBeGreaterThan( 0 )
    }
    expect( actual.expressIDs ).toEqual( expected.expressIDs )
    expect( actual.spatialTree ).toBe( expected.spatialTree )
    expect( differingIDs( expected.itemProperties, actual.itemProperties ) ).toEqual( [] )
    expect( differingIDs( expected.propertySets, actual.propertySets ) ).toEqual( [] )
    expect( expected.typedReads.size ).toBe( new Set( expected.expressIDs ).size )
    expect( differingIDs( expected.typedReads, actual.typedReads ) ).toEqual( [] )

    api.CloseModel( fresh )
    api.CloseModel( reopened )
  }, 120000 )
} )


describe( 'the parity comparisons can fail (conway#756)', () => {

  // Each mutant drops or damages one field of an otherwise good sidecar,
  // keeping its source identity so the open itself succeeds — the case the
  // parity checks exist for: a model that opens and is quietly wrong.

  let source: Uint8Array
  let sidecar: Uint8Array
  let expected: Awaited<ReturnType<typeof readings>>

  beforeAll( async () => {

    source = fixture( 'index.ifc' )

    const fresh = await api.OpenModelStream( new InMemoryStepByteStore( source ), DEFER )

    sidecar = ( await api.ExportIndexSidecar( fresh ) )!
    expected = await readings( fresh )

    api.CloseModel( fresh )
  }, 120000 )

  test( 'dropping the inline range changes typed attribute reads', async () => {

    const mutant = mutateSidecar( sidecar, ( columns ) => {

      // The fixture has to have an inline range for this to mean anything.
      expect( columns.count ).toBeGreaterThan( columns.firstInlineElement )

      return {
        ...columns,
        count: columns.firstInlineElement,
        address: columns.address.slice( 0, columns.firstInlineElement ),
        length: columns.length.slice( 0, columns.firstInlineElement ),
        typeID: columns.typeID.slice( 0, columns.firstInlineElement ),
      }
    } )

    const reopened = await openFromIndex( source, mutant )

    expect( reopened ).toBeGreaterThanOrEqual( 0 )

    const actual = await readings( reopened )

    // Same IDs — inline entities have none — but their values are gone
    // from the typed reads. (Not from the compat property reads, which
    // decode raw bytes: that is why the parity check carries both.)
    expect( actual.expressIDs ).toEqual( expected.expressIDs )
    expect( differingIDs( expected.typedReads, actual.typedReads ).length )
        .toBeGreaterThan( 0 )

    api.CloseModel( reopened )
  }, 120000 )

  test( 'damaging one express ID changes the express IDs', async () => {

    const mutant = mutateSidecar( sidecar, ( columns ) => {
      columns.expressID[ 0 ] += 1_000_000
    } )

    const reopened = await openFromIndex( source, mutant )

    expect( reopened ).toBeGreaterThanOrEqual( 0 )
    expect( ( await readings( reopened ) ).expressIDs ).not.toEqual( expected.expressIDs )

    api.CloseModel( reopened )
  }, 120000 )

  test( 'untyping the storey changes the spatial tree', async () => {

    const mutant = mutateSidecar( sidecar, ( columns ) => {

      const storey = columns.typeID.indexOf( EntityTypesIfc.IFCBUILDINGSTOREY )

      expect( storey ).toBeGreaterThanOrEqual( 0 )

      columns.typeID[ storey ] = -1
    } )

    const reopened = await openFromIndex( source, mutant )

    expect( reopened ).toBeGreaterThanOrEqual( 0 )
    expect( ( await readings( reopened ) ).spatialTree ).not.toBe( expected.spatialTree )

    api.CloseModel( reopened )
  }, 120000 )
} )


describe( 'a stale sidecar fails the open as INDEX_STALE (conway#756)', () => {

  let source: Uint8Array
  let sidecar: Uint8Array

  beforeAll( async () => {

    source = fixture( 'index.ifc' )

    const fresh = await api.OpenModelStream( new InMemoryStepByteStore( source ), DEFER )

    sidecar = ( await api.ExportIndexSidecar( fresh ) )!

    api.CloseModel( fresh )
  }, 120000 )

  /**
   * Open `bytes` from the shared sidecar and read back the attempt's status.
   *
   * @param bytes What the store holds.
   * @param settings Open settings.
   * @return {Promise<object>} The id, status and failure reason.
   */
  async function attempt( bytes: Uint8Array, settings: Loadersettings ) {

    jest.spyOn( console, 'warn' ).mockImplementation( () => {} )

    const attemptedID = api.globalModelIDCounter
    const modelID =
      await api.OpenModelFromIndex( new InMemoryStepByteStore( bytes ), sidecar, settings )
    const statistics = api.getStatistics( attemptedID )

    return {
      modelID,
      status: statistics.getLoadStatus(),
      reason: statistics.getLoadFailureReason() as string,
    }
  }

  test( 'a truncated source is stale by length', async () => {

    const { modelID, status, reason } =
      await attempt( source.subarray( 0, source.length - 1 ), DEFER )

    expect( modelID ).toBe( -1 )
    expect( status ).toBe( 'INDEX_STALE' )
    expect( reason ).toMatch( /built against \d+ bytes but the store holds \d+/ )
  } )

  test( 'a same-length rewrite is stale by hash when verified', async () => {

    // Change one byte of a string value: same length, same record bounds.
    const text = new TextDecoder().decode( source )
    const at = text.indexOf( '\'' ) + 1
    const rewritten = source.slice()

    rewritten[ at ] = rewritten[ at ] === 0x41 ? 0x42 : 0x41

    const { modelID, status, reason } = await attempt( rewritten, VERIFY )

    expect( modelID ).toBe( -1 )
    expect( status ).toBe( 'INDEX_STALE' )
    expect( reason ).toMatch( /hash does not match/ )

    // Without the full gate the length check alone cannot see it — which is
    // why a persisted sidecar is opened with VERIFY_INDEX_SOURCE_HASH.
    const unverified = await api.OpenModelFromIndex(
        new InMemoryStepByteStore( rewritten ), sidecar, DEFER )

    expect( unverified ).toBeGreaterThanOrEqual( 0 )

    api.CloseModel( unverified )
  } )

  test( 'a sidecar that is not stale but broken is not INDEX_STALE', async () => {

    jest.spyOn( console, 'warn' ).mockImplementation( () => {} )

    const attemptedID = api.globalModelIDCounter
    const broken = sidecar.slice()

    new DataView( broken.buffer ).setUint32( 4, 1, true ) // version 1

    expect( await api.OpenModelFromIndex(
        new InMemoryStepByteStore( source ), broken, DEFER ) ).toBe( -1 )
    expect( api.getStatistics( attemptedID ).getLoadStatus() ).not.toBe( 'INDEX_STALE' )
  } )
} )


describe( 'what ExportIndexSidecar refuses (conway#756)', () => {

  test( 'an IFC4X3 model on the compat route', async () => {

    jest.spyOn( console, 'warn' ).mockImplementation( () => {} )

    const source = fixture( 'ifc4x3_road_entities.ifc' )
    const modelID = await api.OpenModelStreamed( source, DEFER )

    expect( modelID ).toBeGreaterThanOrEqual( 0 )
    expect( await api.ExportIndexSidecar( modelID ) ).toBeUndefined()

    api.CloseModel( modelID )
  } )

  test( 'a STEP model', async () => {

    jest.spyOn( console, 'warn' ).mockImplementation( () => {} )

    const modelID = await api.OpenModelAsync( fixture( 'as1-oc-214.stp' ), SETTINGS )

    expect( modelID ).toBeGreaterThanOrEqual( 0 )
    expect( await api.ExportIndexSidecar( modelID ) ).toBeUndefined()

    api.CloseModel( modelID )
  } )

  test( 'an unknown model id', async () => {

    jest.spyOn( console, 'warn' ).mockImplementation( () => {} )

    expect( await api.ExportIndexSidecar( 987654 ) ).toBeUndefined()
  } )
} )
