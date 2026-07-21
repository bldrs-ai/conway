/* eslint-disable no-magic-numbers */
// Phase B3: the release-facing streamed open — fixed-memory columnar parse
// over a ByteSource, model over a windowed store, columns exposed for the
// revisit sidecar — behaves like a resident open for reads once ranges are
// resident.
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import ParsingBuffer from '../parsing/parsing_buffer'
import IfcStepParser from './ifc_step_parser'
import { openStreamedIfcModel } from './ifc_stream_open'
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
} )
