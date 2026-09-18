/* eslint-disable no-magic-numbers */
// codex review of bldrs-ai/conway#713 (P1): the four public opens in
// ifc_stream_open.ts each hard-coded IfcStepParser.Instance and returned an
// IfcStepModel with NO schema check at all — a native consumer feeding the
// result straight into IfcGeometryExtraction would silently misidentify a
// 4X3 file's reordered entity space under IFC4's ordinals. This file pins
// that every one of the four entry points now rejects a 4X3 file (and that
// an ordinary IFC4 file is unaffected), matching the compat surface's
// coverage in ifc4x3_schema_gate.test.ts (which exercises the same fixture
// through IfcApiProxyIfc's web-ifc-shaped entry points instead).
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import {
  openIfcModelFromIndex,
  openStreamedIfcModel,
  openStreamedIfcModelAsync,
  openStreamedIfcModelFromStore,
} from './ifc_stream_open'
import { BufferByteSource } from '../step/parsing/byte_source'
import { InMemoryStepByteStore } from '../step/step_buffer_provider'
import { ColumnarIndexSink } from '../step/parsing/columnar_index'
import { buildColumnarIndexStreaming } from '../step/parsing/streaming_index_builder'
import { hashSource, serializeIndexSidecarFromColumns } from '../step/parsing/index_sidecar'
import EntityTypesIfc from './ifc4_gen/entity_types_ifc.gen'
import IfcStepParser from './ifc_step_parser'

// The same small synthetic IFC4X3_RC2 fixture the web-ifc-compat-surface
// gate test (ifc4x3_schema_gate.test.ts) and ifc4x3_step_model.test.ts use.
const IFC4X3_FIXTURE_PATH = 'data/ifc4x3_road_entities.ifc'
const IFC4_FIXTURE_PATH = 'data/index.ifc'

let ifc4x3Bytes: Uint8Array
let ifc4Bytes: Uint8Array

/**
 * Build a sidecar for `bytes` by parsing it directly with the plain
 * (ungated) columnar builder — deliberately bypassing the four public opens
 * under test here, since those are exactly the paths whose gate this file
 * exercises. Stands in for a sidecar written by an older build, or by a
 * coordinator process this repo does not control, of a file that reads as
 * IFC4X3 today — precisely the case the index-first open's own gate must
 * still catch.
 *
 * @param bytes The source bytes to parse and serialise a sidecar for.
 * @return {Uint8Array} The serialised sidecar.
 */
function sidecarFor( bytes: Uint8Array ): Uint8Array {

  const sink = new ColumnarIndexSink<EntityTypesIfc>()

  buildColumnarIndexStreaming(
      new BufferByteSource( bytes ), IfcStepParser.Instance, 1024 * 1024, void 0, sink )

  const columns = sink.finalize()

  return serializeIndexSidecarFromColumns( columns, bytes.byteLength, hashSource( bytes ) )
}

beforeAll( () => {
  ifc4x3Bytes = new Uint8Array( fs.readFileSync( IFC4X3_FIXTURE_PATH ) )
  ifc4Bytes = new Uint8Array( fs.readFileSync( IFC4_FIXTURE_PATH ) )
} )

describe( 'ifc_stream_open.ts: IFC4X3 schema gate on the native streamed-open API (#713 P1)', () => {

  test( 'openStreamedIfcModel rejects a 4X3 file rather than returning an ' +
      'ungated model', () => {

    expect( () => openStreamedIfcModel(
        new BufferByteSource( ifc4x3Bytes ),
        new InMemoryStepByteStore( ifc4x3Bytes ) ) )
        .toThrow( /IFC4X3/ )
  } )

  test( 'openStreamedIfcModel still opens an ordinary IFC4 file', () => {

    const open = openStreamedIfcModel(
        new BufferByteSource( ifc4Bytes ),
        new InMemoryStepByteStore( ifc4Bytes ) )

    expect( open.model ).toBeDefined()
  } )

  test( 'openStreamedIfcModelAsync rejects a 4X3 file rather than ' +
      'returning an ungated model', async () => {

    await expect( openStreamedIfcModelAsync(
        new BufferByteSource( ifc4x3Bytes ),
        new InMemoryStepByteStore( ifc4x3Bytes ) ) )
        .rejects.toThrow( /IFC4X3/ )
  } )

  test( 'openStreamedIfcModelAsync still opens an ordinary IFC4 file',
      async () => {

        const open = await openStreamedIfcModelAsync(
            new BufferByteSource( ifc4Bytes ),
            new InMemoryStepByteStore( ifc4Bytes ) )

        expect( open.model ).toBeDefined()
      } )

  test( 'openStreamedIfcModelFromStore rejects a 4X3 file rather than ' +
      'returning an ungated model', async () => {

    const store = new InMemoryStepByteStore( ifc4x3Bytes )

    await expect( openStreamedIfcModelFromStore( store ) ).rejects.toThrow( /IFC4X3/ )
  } )

  test( 'openStreamedIfcModelFromStore still opens an ordinary IFC4 file',
      async () => {

        const store = new InMemoryStepByteStore( ifc4Bytes )
        const open = await openStreamedIfcModelFromStore( store )

        expect( open.model ).toBeDefined()
      } )

  test( 'openIfcModelFromIndex rejects a 4X3 file rather than returning an ' +
      'ungated model', async () => {

    const store = new InMemoryStepByteStore( ifc4x3Bytes )
    const sidecar = sidecarFor( ifc4x3Bytes )

    await expect( openIfcModelFromIndex( store, sidecar ) ).rejects.toThrow( /IFC4X3/ )
  } )

  test( 'openIfcModelFromIndex still opens an ordinary IFC4 file',
      async () => {

        const store = new InMemoryStepByteStore( ifc4Bytes )
        const sidecar = sidecarFor( ifc4Bytes )

        const open = await openIfcModelFromIndex( store, sidecar )

        expect( open.model ).toBeDefined()
      } )
} )
