/* eslint-disable no-magic-numbers */
// The builder's own contract for the `onHeaderParsed` seam (conway#713's
// fourth review round moved the IFC4X3 schema gate here, out of every
// entry point — see this module's doc-comment on buildIndexStreaming for
// why). This file is schema-agnostic on purpose: it proves the seam's
// mechanism — the hook fires once, after the header parses COMPLETE, and
// strictly before any record is emitted, and its throw leaves nothing
// emitted — without knowing anything about IFC.
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import IfcStepParser from '../../ifc/ifc_step_parser'
import EntityTypesIfc from '../../ifc/ifc4_gen/entity_types_ifc.gen'
import { BufferByteSource } from './byte_source'
import { ColumnarIndexSink } from './columnar_index'
import {
  buildIndexStreaming,
  buildIndexStreamingAsync,
} from './streaming_index_builder'
import { ParseResult, StepHeader } from './step_parser'

let bytes: Uint8Array

beforeAll( () => {
  bytes = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )
} )

describe( 'streaming_index_builder.ts: onHeaderParsed seam contract', () => {

  test( 'buildIndexStreaming invokes onHeaderParsed exactly once, with a ' +
      'COMPLETE header, before any onRecordIndexed callback fires', () => {

    const calls: StepHeader[] = []
    let firstRecordSeenAfterHook = false

    buildIndexStreaming(
        new BufferByteSource( bytes ),
        IfcStepParser.Instance,
        1024 * 1024,
        () => {
          firstRecordSeenAfterHook = calls.length > 0
        },
        void 0,
        ( header ) => {
          calls.push( header )
        } )

    expect( calls.length ).toBe( 1 )
    expect( firstRecordSeenAfterHook ).toBe( true )
  } )

  test( 'a throw from onHeaderParsed propagates out of buildIndexStreaming ' +
      'with zero onRecordIndexed callbacks and zero rows in the sink', () => {

    let callbackCount = 0
    const sink = new ColumnarIndexSink<EntityTypesIfc>()

    expect( () => buildIndexStreaming(
        new BufferByteSource( bytes ),
        IfcStepParser.Instance,
        1024 * 1024,
        () => { callbackCount++ },
        sink,
        () => {
          throw new Error( 'onHeaderParsed refused this header' )
        } ) )
        .toThrow( /onHeaderParsed refused this header/ )

    expect( callbackCount ).toBe( 0 )
    expect( sink.finalize().count ).toBe( 0 )
  } )

  test( 'onHeaderParsed fires exactly once even across a grow-and-restart ' +
      '(pool smaller than a single top-level record)', () => {

    let calls = 0

    // A pool below MIN_WINDOW's floor still forces at least one
    // grow-and-restart on this fixture (records exceed a few hundred
    // bytes), re-running the header parse from byte 0 each attempt.
    const result = buildIndexStreaming(
        new BufferByteSource( bytes ),
        IfcStepParser.Instance,
        1,
        void 0,
        void 0,
        () => { calls++ } )

    expect( result.result ).toBe( ParseResult.COMPLETE )
    expect( result.stats.windowBytes ).toBeGreaterThan( 1 )
    expect( calls ).toBe( 1 )
  } )

  test( 'buildIndexStreamingAsync invokes onHeaderParsed exactly once, ' +
      'before any onRecordIndexed callback fires', async () => {

    const calls: StepHeader[] = []
    let firstRecordSeenAfterHook = false

    await buildIndexStreamingAsync(
        new BufferByteSource( bytes ),
        IfcStepParser.Instance,
        1024 * 1024,
        () => {
          firstRecordSeenAfterHook = calls.length > 0
        },
        void 0,
        void 0,
        void 0,
        ( header ) => {
          calls.push( header )
        } )

    expect( calls.length ).toBe( 1 )
    expect( firstRecordSeenAfterHook ).toBe( true )
  } )

  test( 'a throw from onHeaderParsed propagates out of ' +
      'buildIndexStreamingAsync with zero onRecordIndexed callbacks and ' +
      'zero rows in the sink', async () => {

    let callbackCount = 0
    const sink = new ColumnarIndexSink<EntityTypesIfc>()

    await expect( buildIndexStreamingAsync(
        new BufferByteSource( bytes ),
        IfcStepParser.Instance,
        1024 * 1024,
        () => { callbackCount++ },
        sink,
        void 0,
        void 0,
        () => {
          throw new Error( 'onHeaderParsed refused this header (async)' )
        } ) )
        .rejects.toThrow( /onHeaderParsed refused this header \(async\)/ )

    expect( callbackCount ).toBe( 0 )
    expect( sink.finalize().count ).toBe( 0 )
  } )
} )
