/* eslint-disable no-magic-numbers */
// Phase B3: the release-facing streamed open — fixed-memory columnar parse
// over a ByteSource, model over a windowed store, columns exposed for the
// revisit sidecar — behaves like a resident open for reads once ranges are
// resident.
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import ParsingBuffer from '../parsing/parsing_buffer'
import IfcStepParser from './ifc_step_parser'
import { openStreamedIfcModel, openStreamedIfcModelFromStore } from './ifc_stream_open'
import { BufferByteSource } from '../step/parsing/byte_source'
import { InMemoryStepByteStore } from '../step/step_buffer_provider'
import { ParseResult } from '../step/parsing/step_parser'
import {
  hashSource,
  serializeIndexSidecarFromColumns,
  deserializeIndexSidecarToColumns,
  sidecarMatchesSource,
} from '../step/parsing/index_sidecar'
import { IfcRoot } from './ifc4_gen'

let bytes: Uint8Array
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let residentModel: any

beforeAll( () => {
  bytes = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )
  const input = new ParsingBuffer( bytes )
  IfcStepParser.Instance.parseHeader( input )
  residentModel = IfcStepParser.Instance.parseDataToModel( input )[ 1 ]
} )

describe( 'openStreamedIfcModel (Phase B3)', () => {

  test( 'opens a model matching the resident parse, with header and columns', () => {
    const open = openStreamedIfcModel(
        new BufferByteSource( bytes ),
        new InMemoryStepByteStore( bytes ),
        { pool: 4 * 1024 } )

    expect( open.result ).toBe( ParseResult.COMPLETE )
    expect( open.model ).toBeDefined()
    expect( open.header.headers.size ).toBeGreaterThan( 0 )
    expect( open.columns.firstInlineElement ).toBeGreaterThan( 0 )

    const streamedRoots = new Set( open.model!.expressIDsOfTypes( IfcRoot ) )
    const residentRoots = new Set( residentModel.expressIDsOfTypes( IfcRoot ) )
    expect( streamedRoots ).toEqual( residentRoots )
  } )

  test( 'reads work after ensureResident (the windowed contract)', async () => {
    const open = openStreamedIfcModel(
        new BufferByteSource( bytes ),
        new InMemoryStepByteStore( bytes ) )

    const model = open.model!
    const expressID = [ ...model.expressIDsOfTypes( IfcRoot ) ][ 0 ] as number

    await model.ensureResidentByExpressID( expressID )

    const element = model.getElementByExpressID( expressID )
    expect( element?.expressID ).toBe( expressID )
  } )

  test( 'record events fire live during the open', () => {
    let events = 0

    openStreamedIfcModel(
        new BufferByteSource( bytes ),
        new InMemoryStepByteStore( bytes ),
        { onRecordIndexed: () => void ++events } )

    expect( events ).toBe(
        openStreamedIfcModel(
            new BufferByteSource( bytes ),
            new InMemoryStepByteStore( bytes ) ).columns.firstInlineElement )
  } )

  test( 'the returned columns serialize to a trustable revisit sidecar', () => {
    const open = openStreamedIfcModel(
        new BufferByteSource( bytes ),
        new InMemoryStepByteStore( bytes ) )

    const hash = hashSource( bytes )
    const sidecar =
      serializeIndexSidecarFromColumns( open.columns, bytes.byteLength, hash )

    const restored = deserializeIndexSidecarToColumns<number>( sidecar )

    expect( sidecarMatchesSource(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        restored as any, bytes.byteLength, hash ) ).toBe( true )
    expect( restored.columns.count ).toBe( open.columns.firstInlineElement )
  } )

  test( 'rejects a store whose length disagrees with the source', () => {
    expect( () => openStreamedIfcModel(
        new BufferByteSource( bytes ),
        new InMemoryStepByteStore( bytes.subarray( 0, 100 ) ) ) )
        .toThrow( /does not match/ )
  } )

  test( 'releaseSourceViews still lets a later read re-acquire', async () => {

    const store = new InMemoryStepByteStore( bytes )
    const fromStore = await openStreamedIfcModelFromStore( store, { pool: 4 * 1024 } )
    const model = fromStore.model!
    const expressID = [ ...model.expressIDsOfTypes( IfcRoot ) ][ 0 ] as number
    const localID = model.resolveExpressID( expressID ) as number

    await model.ensureResidentByLocalID( localID )
    const first = model.getElementByExpressID( expressID )
    expect( first ).toBeDefined()
    const args = first!.extractLineArguments()
    expect( args.length ).toBeGreaterThan( 0 )

    model.releaseSourceViews( [ localID ] )

    await model.ensureResidentByLocalID( localID )
    const again = model.getElementByExpressID( expressID )
    expect( again!.extractLineArguments().length ).toBe( args.length )
  } )

  test( 'extractParseBuffer rematerialises after releaseSourceViews', async () => {

    const store = new InMemoryStepByteStore( bytes )
    const fromStore = await openStreamedIfcModelFromStore( store, { pool: 4 * 1024 } )
    const model = fromStore.model!
    const expressID = [ ...model.expressIDsOfTypes( IfcRoot ) ][ 0 ] as number
    const localID = model.resolveExpressID( expressID ) as number

    await model.ensureResidentByLocalID( localID )
    const first = model.getElementByExpressID( expressID )!

    // Populate vtable + buffer the way a first extract does.
    expect( first.extractLineArguments().length ).toBeGreaterThan( 0 )

    const copied: number[] = []
    const fakeResult = { resize: ( n: number ) => n }
    const fakeModule = { HEAPU8: { set: ( src: Uint8Array ) => {

      copied.push( src.length )
    } } }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    first.extractParseBuffer( 0, 0, 0, fakeResult as any, fakeModule as any, true )
    expect( copied[ 0 ] ).toBeGreaterThan( 0 )

    model.releaseSourceViews( [ localID ] )
    await model.ensureResidentByLocalID( localID )

    // Same entity object — vtable kept, buffer dropped. This is the
    // PSB "Cannot read properties of undefined (reading 'subarray')" path.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    first.extractParseBuffer( 0, 0, 0, fakeResult as any, fakeModule as any, true )
    expect( copied[ 1 ] ).toBe( copied[ 0 ] )
  } )

  test( 'ensureResidentClosureByLocalID visits every #ref hop', async () => {

    const store = new InMemoryStepByteStore( bytes )
    const fromStore = await openStreamedIfcModelFromStore( store, { pool: 4 * 1024 } )
    const model = fromStore.model!
    const expressID = [ ...model.expressIDsOfTypes( IfcRoot ) ][ 0 ] as number
    const localID = model.resolveExpressID( expressID ) as number

    await model.ensureResidentByLocalID( localID )
    const refs = model.referencedExpressIDs( localID )
    expect( refs.length ).toBeGreaterThan( 0 )

    const visited = await model.ensureResidentClosureByLocalID( localID )

    expect( visited.has( localID ) ).toBe( true )
    expect( model.typeIDOf( localID ) ).toBeDefined()

    for ( const refExpressID of refs ) {

      const refLocalID = model.resolveExpressID( refExpressID )

      if ( refLocalID !== void 0 ) {
        expect( visited.has( refLocalID ) ).toBe( true )
      }
    }
  } )

  test( 'ensureResidentClosureByLocalID skip-descend does not follow #refs', async () => {

    const store = new InMemoryStepByteStore( bytes )
    const fromStore = await openStreamedIfcModelFromStore( store, { pool: 4 * 1024 } )
    const model = fromStore.model!
    const expressID = [ ...model.expressIDsOfTypes( IfcRoot ) ][ 0 ] as number
    const localID = model.resolveExpressID( expressID ) as number

    await model.ensureResidentByLocalID( localID )
    const refs = model.referencedExpressIDs( localID )
    expect( refs.length ).toBeGreaterThan( 0 )

    const leafSpans: { address: number, length: number }[] = []
    const visited = await model.ensureResidentClosureByLocalID(
        localID,
        void 0,
        new Set< number >(),
        ( id ) => id === localID,
        leafSpans )

    expect( visited.has( localID ) ).toBe( true )
    expect( visited.size ).toBe( 1 )
    expect( leafSpans.length ).toBeGreaterThan( 0 )
    expect( leafSpans[ 0 ].length ).toBeGreaterThan( 0 )
  } )

  test( 'spanOfExpressIDExtremes covers a dense express-ID run', async () => {

    const store = new InMemoryStepByteStore( bytes )
    const fromStore = await openStreamedIfcModelFromStore( store, { pool: 4 * 1024 } )
    const model = fromStore.model!
    const expressIDs = [ ...model.expressIDsOfTypes( IfcRoot ) ]
    expect( expressIDs.length ).toBeGreaterThan( 1 )

    const span = model.spanOfExpressIDExtremes( expressIDs )

    expect( span ).toBeDefined()
    expect( span!.length ).toBeGreaterThan( 0 )

    const spanEnd = span!.address + span!.length

    for ( const refExpressID of expressIDs ) {

      const localID = model.resolveExpressID( refExpressID )!

      expect( model.recordAddress( localID )! ).toBeGreaterThanOrEqual( span!.address )
      expect(
          model.recordAddress( localID )! + model.recordLength( localID )! )
          .toBeLessThanOrEqual( spanEnd )
    }
  } )

  test( 'openStreamedIfcModelFromStore matches the sync open', async () => {
    const store = new InMemoryStepByteStore( bytes )
    const fromStore = await openStreamedIfcModelFromStore( store, { pool: 4 * 1024 } )
    const streamed = openStreamedIfcModel(
        new BufferByteSource( bytes ), store, { pool: 4 * 1024 } )

    expect( fromStore.result ).toBe( ParseResult.COMPLETE )
    expect( fromStore.model!.isSourceExternal ).toBe( true )
    expect( [ ...fromStore.model!.expressIDsOfTypes( IfcRoot ) ] )
        .toEqual( [ ...streamed.model!.expressIDsOfTypes( IfcRoot ) ] )
  } )
} )
