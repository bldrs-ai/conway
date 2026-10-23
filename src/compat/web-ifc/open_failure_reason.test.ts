/* eslint-disable no-magic-numbers */
// conway#741: production opens that returned a bare -1.
//
//  1. One undecodable unit in the project's IfcUnitAssignment threw out of
//     extractLinearScalingFactor, which runs inside EVERY open entry point,
//     so a file with fine geometry failed to open at all. The fix keeps the
//     readable units (and the length unit's scale) and skips the rest.
//  2. Every other -1 now says why, on the statistics an embedder can read
//     under the id the open was attempted with.
//  3. The synchronous demand pump let one throwing product escape
//     ExtractGeometryBatch; its async twin and the classic walk skip it.
import * as fs from 'fs'

import { afterEach, beforeAll, describe, expect, jest, test } from '@jest/globals'

import { InMemoryStepByteStore } from '../../step/step_buffer_provider'
import { openStreamedIfcModelFromStore } from '../../ifc/ifc_stream_open'
import { hashSource, serializeIndexSidecarFromColumns } from '../../step/parsing/index_sidecar'
import { ParseResult } from '../../step/parsing/step_parser'
import Logger, { DATA_DEFECT, LogEntry } from '../../logging/logger'
import { IfcGeometryExtraction } from '../../ifc/ifc_geometry_extraction'
import { IfcAPI } from './ifc_api'

const SETTINGS = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true }
const DEFER = { ...SETTINGS, DEFER_GEOMETRY: true, STREAMING_CONSUMER: true }

const INDEX_IFC = fs.readFileSync( 'data/index.ifc', 'latin1' )

// index.ifc's length unit is plain METRE; give it a MILLI prefix so the
// scale the fix must preserve is distinguishable from the default of 1.
const MILLI_INDEX_IFC = INDEX_IFC.replace(
    '#29= IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.);',
    '#29= IFCSIUNIT(*,.LENGTHUNIT.,.MILLI.,.METRE.);' )

/**
 * @param text Model text.
 * @return {Uint8Array} Its bytes.
 */
function bytes( text: string ): Uint8Array {
  return Uint8Array.from( text, ( character ) => character.charCodeAt( 0 ) & 0xff )
}

let api: IfcAPI

beforeAll( async () => {
  api = new IfcAPI()
  await api.Init()
}, 120000 )

afterEach( () => {
  jest.restoreAllMocks()
} )

/**
 * Open through each production entry point Share uses, plus classic.
 *
 * @param data Model bytes.
 * @return {Promise<{name: string, id: number}[]>} One id per entry point.
 */
async function openEveryWay( data: Uint8Array ): Promise<{ name: string, id: number }[]> {
  return [
    { name: 'OpenModel', id: api.OpenModel( data, SETTINGS ) },
    { name: 'OpenModelAsync', id: await api.OpenModelAsync( data, SETTINGS ) },
    { name: 'OpenModelStreamed deferred', id: await api.OpenModelStreamed( data, DEFER ) },
    {
      name: 'OpenModelStream deferred',
      id: await api.OpenModelStream( new InMemoryStepByteStore( data ), DEFER ),
    },
  ]
}

/**
 * Count meshes a model serves, draining a deferred model's async pump first.
 *
 * @param modelID An open model.
 * @return {Promise<number>} Meshes delivered.
 */
async function meshCount( modelID: number ): Promise<number> {
  let count = 0

  for ( ;; ) {
    const { extracted, remaining } =
      await api.ExtractGeometryBatchAsync( modelID, 8, () => ++count )

    if ( extracted === 0 && remaining === 0 ) {
      break
    }
  }

  if ( count === 0 ) {
    await api.StreamAllMeshesAsync( modelID, () => ++count )
  }

  return count
}

describe( 'an unreadable unit no longer fails the whole open', () => {

  test.each( [
    [
      'an IfcSIUnit name that does not decode',
      MILLI_INDEX_IFC.replace(
          '#30= IFCSIUNIT(*,.AREAUNIT.,$,.SQUARE_METRE.);',
          '#30= IFCSIUNIT(*,.AREAUNIT.,$,.SQUARE_METER.);' ),
      'Skipping an IfcSIUnit whose unit type or name could not be read',
      '30',
    ],
    [
      'an IfcSIUnit unit type that does not decode',
      MILLI_INDEX_IFC.replace(
          '#31= IFCSIUNIT(*,.VOLUMEUNIT.,$,.CUBIC_METRE.);',
          '#31= IFCSIUNIT(*,.VOLUMEUNITS.,$,.CUBIC_METRE.);' ),
      'Skipping an IfcSIUnit whose unit type or name could not be read',
      '31',
    ],
    [
      'an assignment element that is not a unit',
      MILLI_INDEX_IFC.replace(
          '#72= IFCUNITASSIGNMENT((#29,#30,',
          '#72= IFCUNITASSIGNMENT((#29,#89,#30,' ),
      'Skipping an IfcUnitAssignment element that is not a unit',
      '72',
    ],
  ] )( '%s', async ( _label, text, message, expressID ) => {

    jest.spyOn( console, 'error' ).mockImplementation( () => {} )
    jest.spyOn( console, 'warn' ).mockImplementation( () => {} )

    // A proxy, not Logger.getDataDefects(): StreamAllMeshes* clears the log
    // buffer (ifc_api.ts), so the buffer is empty by the time a load ends.
    const skips: LogEntry[] = []
    const proxy = {
      log: ( entry: LogEntry ) => {
        if ( entry.message === message && entry.category === DATA_DEFECT ) {
          skips.push( entry )
        }
      },
    }

    Logger.addProxy( proxy )

    try {
      for ( const { name, id } of await openEveryWay( bytes( text ) ) ) {

        expect( { name, opened: id >= 0 } ).toEqual( { name, opened: true } )
        // The length unit survives its neighbour, so the model is still in mm.
        expect( { name, scale: api.GetLinearScalingFactor( id ) } )
            .toEqual( { name, scale: 0.001 } )
        expect( await meshCount( id ) ).toBe( 7 )

        api.CloseModel( id )
      }
    } finally {
      Logger.removeProxy( proxy )
    }

    expect( skips.length ).toBeGreaterThan( 0 )
    expect( skips.every( ( entry ) => entry.expressIDs.has( expressID ) ) ).toBe( true )
  } )

  test( 'an undecodable LENGTHUNIT opens at the default metre scale', async () => {

    jest.spyOn( console, 'error' ).mockImplementation( () => {} )

    const text = MILLI_INDEX_IFC.replace(
        '#29= IFCSIUNIT(*,.LENGTHUNIT.,.MILLI.,.METRE.);',
        '#29= IFCSIUNIT(*,.LENGTHUNIT.,.MILLI.,.METER.);' )
    const id = api.OpenModel( bytes( text ), SETTINGS )

    expect( id ).toBeGreaterThanOrEqual( 0 )
    expect( api.GetLinearScalingFactor( id ) ).toBe( 1 )

    api.CloseModel( id )
  } )
} )

describe( 'a -1 open says why on its statistics', () => {

  test.each( [
    [ 'zip', bytes( 'PK\x03\x04 not a model' ), 'zip archive (such as .ifczip), not STEP text' ],
    [ 'html', bytes( '\n<!DOCTYPE html><html></html>' ), 'XML or HTML, not STEP text' ],
    [ 'empty', new Uint8Array( 0 ), 'empty file' ],
    [
      'unescaped apostrophe in the header',
      bytes( INDEX_IFC.replace( /FILE_NAME\('/, 'FILE_NAME(\'O\'Brien ' ) ),
      /^STEP header syntax error at byte \d+$/,
    ],
    [
      'unknown schema',
      bytes( INDEX_IFC.replace( /FILE_SCHEMA\(\('[^']*'\)\)/, 'FILE_SCHEMA((\'CIS2\'))' ) ),
      'unrecognized FILE_SCHEMA CIS2',
    ],
  ] )( 'unrecognised bytes: %s', async ( _label, data, reason ) => {

    jest.spyOn( console, 'error' ).mockImplementation( () => {} )

    const attempts = [
      { open: () => api.OpenModel( data, SETTINGS ) },
      { open: () => api.OpenModelAsync( data, SETTINGS ) },
      { open: () => api.OpenModelStreamed( data, DEFER ) },
    ]

    for ( const { open } of attempts ) {

      const attemptedID = api.globalModelIDCounter
      const id = await open()

      expect( id ).toBe( -1 )

      const statistics = api.getStatistics( attemptedID )

      expect( statistics.getLoadStatus() ).toBe( 'UNRECOGNIZED_FORMAT' )

      if ( typeof reason === 'string' ) {
        expect( statistics.getLoadFailureReason() ).toBe( reason )
      } else {
        expect( statistics.getLoadFailureReason() ).toMatch( reason )
      }
    }
  } )

  test( 'a constructor throw records OPEN_FAIL and the message', async () => {

    jest.spyOn( console, 'error' ).mockImplementation( () => {} )
    jest.spyOn( console, 'warn' ).mockImplementation( () => {} )
    jest.spyOn( IfcGeometryExtraction.prototype, 'extractLinearScalingFactor' )
        .mockImplementation( () => {
          throw new Error( 'Value in STEP was incorrectly typed' )
        } )

    const data = bytes( INDEX_IFC )

    for ( const open of [
      () => api.OpenModel( data, SETTINGS ),
      () => api.OpenModelAsync( data, SETTINGS ),
      () => api.OpenModelStreamed( data, DEFER ),
    ] ) {

      const attemptedID = api.globalModelIDCounter

      expect( await open() ).toBe( -1 )

      const statistics = api.getStatistics( attemptedID )

      expect( statistics.getLoadStatus() ).toBe( 'OPEN_FAIL' )
      expect( statistics.getLoadFailureReason() )
          .toBe( 'Value in STEP was incorrectly typed' )
    }
  } )

  test( 'a more specific status (UNSUPPORTED_SCHEMA) is kept', async () => {

    jest.spyOn( console, 'error' ).mockImplementation( () => {} )
    jest.spyOn( console, 'warn' ).mockImplementation( () => {} )

    const data = new Uint8Array(
        fs.readFileSync( 'data/ifc4x3_road_entities_ineligible.ifc' ) )
    const attemptedID = api.globalModelIDCounter

    expect( api.OpenModel( data, SETTINGS ) ).toBe( -1 )

    const statistics = api.getStatistics( attemptedID )

    expect( statistics.getLoadStatus() ).toBe( 'UNSUPPORTED_SCHEMA' )
    expect( statistics.getLoadFailureReason() ).toMatch( /IFC4X3/ )
  } )

  test( 'an unverified IFC4X3 spelling (IFC4X3_RC4) records UNSUPPORTED_SCHEMA', async () => {

    jest.spyOn( console, 'error' ).mockImplementation( () => {} )
    jest.spyOn( console, 'warn' ).mockImplementation( () => {} )

    const data = bytes(
        INDEX_IFC.replace( /FILE_SCHEMA\(\('[^']*'\)\)/, 'FILE_SCHEMA((\'IFC4X3_RC4\'))' ) )

    for ( const open of [
      () => api.OpenModel( data, SETTINGS ),
      () => api.OpenModelAsync( data, SETTINGS ),
      () => api.OpenModelStreamed( data, DEFER ),
    ] ) {

      const attemptedID = api.globalModelIDCounter

      expect( await open() ).toBe( -1 )

      const statistics = api.getStatistics( attemptedID )

      expect( statistics.getLoadStatus() ).toBe( 'UNSUPPORTED_SCHEMA' )
      expect( statistics.getLoadFailureReason() ).toMatch( /'IFC4X3_RC4' is IFC4X3-family/ )
    }
  } )
} )

describe( 'a store open refused before the IFC branch does not inherit a stale status', () => {

  test( 'a fresh IfcAPI reusing id 0 gets its own statistics, not an earlier UNSUPPORTED_SCHEMA', async () => {

    jest.spyOn( console, 'error' ).mockImplementation( () => {} )
    jest.spyOn( console, 'warn' ).mockImplementation( () => {} )

    // Logger's statistics map is module-level and every IfcAPI numbers its
    // models from 0, so an earlier API's id-0 object is what a later
    // refusal would otherwise find.
    const earlier = new IfcAPI()

    await earlier.Init()

    const refused = new Uint8Array(
        fs.readFileSync( 'data/ifc4x3_road_entities_ineligible.ifc' ) )

    expect( earlier.OpenModel( refused, SETTINGS ) ).toBe( -1 )
    expect( earlier.getStatistics( 0 ).getLoadStatus() ).toBe( 'UNSUPPORTED_SCHEMA' )

    const later = new IfcAPI()

    await later.Init()

    // STEP AP214: not IFC, so the store open (IFC-only) returns -1 at the sniff.
    const step = new Uint8Array( fs.readFileSync( 'data/nema-23-76mm.step' ) )

    expect( await later.OpenModelStream( new InMemoryStepByteStore( step ), DEFER ) ).toBe( -1 )

    const statistics = later.getStatistics( 0 )

    expect( statistics.getLoadStatus() ).not.toBe( 'UNSUPPORTED_SCHEMA' )
    expect( statistics.getLoadFailureReason() ).toBeUndefined()
  }, 120000 )
} )

describe( 'an index-first open that fails says why', () => {

  test( 'a sidecar that does not match records the failure and its message', async () => {

    jest.spyOn( console, 'error' ).mockImplementation( () => {} )
    jest.spyOn( console, 'warn' ).mockImplementation( () => {} )

    const source = bytes( INDEX_IFC )
    const cold = await openStreamedIfcModelFromStore(
        new InMemoryStepByteStore( source ), { pool: 1024 * 1024 } )

    expect( cold.result ).toBe( ParseResult.COMPLETE )

    const sidecar = serializeIndexSidecarFromColumns(
        cold.columns, source.byteLength, hashSource( source ) )

    // A store one byte short of the file the sidecar was built from.
    const attemptedID = api.globalModelIDCounter
    const id = await api.OpenModelFromIndex(
        new InMemoryStepByteStore( source.subarray( 0, source.byteLength - 1 ) ),
        sidecar,
        SETTINGS )

    expect( id ).toBe( -1 )

    const statistics = api.getStatistics( attemptedID )

    expect( statistics.getLoadStatus() ).toBeDefined()
    expect( statistics.getLoadStatus() ).not.toBe( 'OK' )
    expect( statistics.getLoadFailureReason() ).toBeDefined()
    expect( statistics.getLoadFailureReason()!.length ).toBeGreaterThan( 0 )
  } )
} )

describe( 'the synchronous demand pump skips a throwing product', () => {

  test( 'grid_placement_tail_axes.ifc drains through ExtractGeometryBatch', async () => {

    jest.spyOn( console, 'error' ).mockImplementation( () => {} )

    const data = new Uint8Array( fs.readFileSync( 'data/grid_placement_tail_axes.ifc' ) )

    const classicID = api.OpenModel( data, SETTINGS )
    let classic = 0

    api.StreamAllMeshes( classicID, () => ++classic )
    api.CloseModel( classicID )

    const id = await api.OpenModelStreamed( data, DEFER )
    let pumped = 0

    for ( ;; ) {
      const { extracted, remaining } = api.ExtractGeometryBatch( id, 64, () => ++pumped )

      if ( extracted === 0 && remaining === 0 ) {
        break
      }
    }

    api.CloseModel( id )

    expect( classic ).toBe( 3 )
    expect( pumped ).toBe( classic )
  } )
} )
