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
import { Ifc4x3CompatRouteRequired } from './ifc_schema_selection'

// An INELIGIBLE IFC4X3_RC2 file: the #713 road fixture plus one
// IFC4X3-only record (IFCALIGNMENT) that neither IFC4 nor the translation
// table can decode (see data/ifc4x3_expected_refusals.txt). The plain road
// fixture is eligible for the IFC4-compatible route since bldrs-ai/conway#280,
// so it no longer exercises a refusal everywhere. These native opens refuse
// every 4X3 file regardless (they stream records to caller callbacks, so
// they cannot take the route; see ifc_stream_open.ts), which the last test
// below pins with the eligible fixture.
const IFC4X3_FIXTURE_PATH = 'data/ifc4x3_road_entities_ineligible.ifc'
const IFC4X3_ELIGIBLE_FIXTURE_PATH = 'data/ifc4x3_road_geometry.ifc'
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

// The old (pre-seam) HEADER_PREFIX_RETRY_BYTES sniff cap this fixture must
// exceed to reproduce round 4 (codex review of bldrs-ai/conway#713,
// #discussion_r4050179873): a header that completes inside a real parse's
// window but not inside a smaller bounded sniff window used to slip the
// gate entirely, because the sniff reported non-COMPLETE and the entry
// point skipped the gate rather than refusing to open.
const OLD_SNIFF_CAP_BYTES = 4 * 1024 * 1024

/**
 * A synthetic IFC4X3_RC2 file whose HEADER section alone exceeds
 * `OLD_SNIFF_CAP_BYTES` — a large `FILE_DESCRIPTION` is legal STEP (see
 * `HEADER_PREFIX_BYTES`'s doc-comment in ifc_stream_open.ts), so this is a
 * valid file a real model could ship, not a malformed edge case.
 *
 * @return {Uint8Array} The synthetic file's bytes.
 */
function bigHeaderIfc4x3(): Uint8Array {

  // Comfortably over the old 4 MiB sniff cap, comfortably under the pool
  // the tests below give the real parse.
  const description = 'A'.repeat( OLD_SNIFF_CAP_BYTES + 1024 * 1024 )

  const text =
    'ISO-10303-21;\nHEADER;\n' +
    `FILE_DESCRIPTION(('${description}'),'2;1');\n` +
    "FILE_NAME('big_header.ifc','2026-01-01T00:00:00',(''),(''),'','','');\n" +
    "FILE_SCHEMA(('IFC4X3_RC2'));\nENDSEC;\nDATA;\n" +
    "#1=IFCROAD('0fixt0000000000000001x',$,'Road0','desc',$,$,$,$,.ELEMENT.);\n" +
    // Makes the file ineligible for the IFC4-compatible route, so every
    // entry point must refuse it (bldrs-ai/conway#280).
    "#2=IFCALIGNMENT('0fixt0000000000000002x',$,'A',$,$,$,$,.NOTDEFINED.);\n" +
    'ENDSEC;\nEND-ISO-10303-21;\n'

  return new TextEncoder().encode( text )
}

// Pool comfortably bigger than the header (and the old 4 MiB sniff cap),
// so the real parse's window completes the header where the old bounded
// sniff could not.
const BIG_HEADER_POOL_BYTES = 8 * 1024 * 1024

describe( 'ifc_stream_open.ts: IFC4X3 schema gate on the native streamed-open API (#713 P1)', () => {

  test( 'openStreamedIfcModel rejects a 4X3 file rather than returning an ' +
      'ungated model', () => {

    expect( () => openStreamedIfcModel(
        new BufferByteSource( ifc4x3Bytes ),
        new InMemoryStepByteStore( ifc4x3Bytes ) ) )
        .toThrow( /IFC4X3/ )
  } )

  // codex review of bldrs-ai/conway#713 (P1, round 3): a test asserting
  // only the throw above would pass against a gate placed AFTER
  // buildColumnarIndexStreaming, because that gate still throws — it just
  // throws too late, after onRecordIndexed and indexSink have already
  // seen every record typed with IFC4's ordinals. This asserts the count
  // itself is zero, which only a pre-parse sniff can satisfy.
  test( 'openStreamedIfcModel fires zero onRecordIndexed callbacks and ' +
      'indexes zero records into a caller-owned sink before throwing on ' +
      'a 4X3 file', () => {

    let callbackCount = 0
    const indexSink = new ColumnarIndexSink<EntityTypesIfc>()

    expect( () => openStreamedIfcModel(
        new BufferByteSource( ifc4x3Bytes ),
        new InMemoryStepByteStore( ifc4x3Bytes ),
        {
          onRecordIndexed: () => {
            callbackCount++
          },
          indexSink,
        } ) )
        .toThrow( /IFC4X3/ )

    expect( callbackCount ).toBe( 0 )
    expect( indexSink.finalize().count ).toBe( 0 )
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

  // codex review of bldrs-ai/conway#713, P1 round 4
  // (#discussion_r4050179873): every entry point above used to gate off a
  // BOUNDED pre-parse sniff (HEADER_PREFIX_BYTES, retried once up to
  // HEADER_PREFIX_RETRY_BYTES = 4 MiB) that read the header independently
  // of the real parse. A header that completes inside `options.pool` but
  // not inside that smaller sniff window made the sniff report
  // non-COMPLETE, which every entry point treated as "leave it for the
  // real parse to report" — i.e. skip the gate — and the real parse then
  // parsed that same header fine in its larger window and ran the data
  // parse ungated. `onHeaderParsed` closes this because it fires from the
  // header the REAL parse produced, in the real parse's own window: there
  // is no second, smaller read left to disagree with it.
  test( 'openStreamedIfcModel rejects a 4X3 file whose header exceeds the ' +
      'old bounded-sniff cap but fits the real parse window, with zero ' +
      'onRecordIndexed callbacks', () => {

    const bytes = bigHeaderIfc4x3()
    let callbackCount = 0

    expect( () => openStreamedIfcModel(
        new BufferByteSource( bytes ),
        new InMemoryStepByteStore( bytes ),
        {
          pool: BIG_HEADER_POOL_BYTES,
          onRecordIndexed: () => { callbackCount++ },
        } ) )
        .toThrow( /IFC4X3/ )

    expect( callbackCount ).toBe( 0 )
  } )

  test( 'openStreamedIfcModelAsync rejects the same oversized-header 4X3 ' +
      'file, with zero onRecordIndexed callbacks', async () => {

    const bytes = bigHeaderIfc4x3()
    let callbackCount = 0

    await expect( openStreamedIfcModelAsync(
        new BufferByteSource( bytes ),
        new InMemoryStepByteStore( bytes ),
        {
          pool: BIG_HEADER_POOL_BYTES,
          onRecordIndexed: () => { callbackCount++ },
        } ) )
        .rejects.toThrow( /IFC4X3/ )

    expect( callbackCount ).toBe( 0 )
  } )

  // bldrs-ai/conway#280: these opens hand every record to `onRecordIndexed`
  // and `indexSink` as it is indexed, so they cannot index a 4X3 file
  // privately first, and so they cannot take the IFC4-compatible route. An
  // ELIGIBLE file must therefore be refused here too, still before a single
  // record is emitted, and with the route signal rather than an
  // eligibility verdict.
  test( 'openStreamedIfcModel refuses even an ELIGIBLE 4X3 file, with zero ' +
      'onRecordIndexed callbacks and zero sink rows', () => {

    const bytes = new Uint8Array( fs.readFileSync( IFC4X3_ELIGIBLE_FIXTURE_PATH ) )
    let callbackCount = 0
    const indexSink = new ColumnarIndexSink<EntityTypesIfc>()

    expect( () => openStreamedIfcModel(
        new BufferByteSource( bytes ),
        new InMemoryStepByteStore( bytes ),
        { onRecordIndexed: () => { callbackCount++ }, indexSink } ) )
        .toThrow( Ifc4x3CompatRouteRequired )

    expect( callbackCount ).toBe( 0 )
    expect( indexSink.finalize().count ).toBe( 0 )
  } )
} )
