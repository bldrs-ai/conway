/* eslint-disable no-magic-numbers */
// conway#541: an index-first open must produce the SAME MODEL a cold parse
// does — not a model that answers the easy queries. The hard part is the
// inline-entity range: v1 sidecars carried top-level rows only, so a restored
// model's `inlineAddressMap_` was empty and every inline-valued attribute
// resolved to `null` under the default `nullOnErrors`. That is not a crash, it
// is surface styles and measure-valued attributes quietly degrading — which is
// why this file asserts on a resolved inline VALUE and not only on row counts.
//
// The corpus number that makes this a correctness bug rather than a rounding
// error is D3D at 20.995 % of its index inline (720,661 rows); index.ifc's
// seven inline rows are the same defect at a size CI can run.
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import { InMemoryStepByteStore } from '../step/step_buffer_provider'
import {
  openIfcModelFromIndex,
  openStreamedIfcModelFromStore,
} from './ifc_stream_open'
import {
  hashSource,
  serializeIndexSidecarFromColumns,
} from '../step/parsing/index_sidecar'
import { ParseResult } from '../step/parsing/step_parser'
import IfcStepModel from './ifc_step_model'
import { IfcRoot, IfcSurfaceStyleRendering } from './ifc4_gen'
import { IfcNormalisedRatioMeasure } from './ifc4_gen/IfcNormalisedRatioMeasure.gen'
import { StepIndexColumns } from '../step/parsing/columnar_index'
import EntityTypesIfc from './ifc4_gen/entity_types_ifc.gen'

let bytes: Uint8Array

beforeAll( () => {
  bytes = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )
} )


/**
 * Cold-parse index.ifc from a store, the way a first visit does.
 *
 * @return {Promise<object>} The streamed open.
 */
function coldOpen() {
  return openStreamedIfcModelFromStore(
      new InMemoryStepByteStore( bytes ), { pool: 4 * 1024 } )
}


/**
 * Read every `DiffuseColour` an IfcSurfaceStyleRendering resolves to, keyed
 * by express ID. In index.ifc those are inline `IFCNORMALISEDRATIOMEASURE`
 * values (data/index.ifc:94,105) — the population a v1 sidecar dropped.
 *
 * @param model The model to read.
 * @return {Promise<Map<number, number | null>>} Express ID → resolved value,
 * or null where the reference did not resolve.
 */
async function inlineDiffuseColours(
    model: IfcStepModel ): Promise<Map<number, number | null>> {

  const values = new Map<number, number | null>()

  for ( const rendering of model.types( IfcSurfaceStyleRendering ) ) {

    await model.ensureResidentByLocalID( rendering.localID )

    const diffuse = rendering.DiffuseColour

    values.set(
        rendering.expressID as number,
        diffuse instanceof IfcNormalisedRatioMeasure ? diffuse.Value : null )
  }

  return values
}



/**
 * index.ifc with a long STEP comment injected into its header, so the header
 * no longer fits the prefix an index-first open reads first.
 *
 * @param padBytes Roughly how many bytes of comment to inject.
 * @return {Uint8Array} The padded source.
 */
function paddedHeaderSource( padBytes: number ): Uint8Array {

  const text = new TextDecoder().decode( bytes )
  const at = text.indexOf( 'FILE_DESCRIPTION' )

  expect( at ).toBeGreaterThan( 0 )

  const comment = `/* ${'x'.repeat( padBytes )} */\n`

  return new TextEncoder().encode(
      text.slice( 0, at ) + comment + text.slice( at ) )
}


describe( 'openIfcModelFromIndex (conway#541)', () => {

  test( 'the fixture actually exercises the inline range', async () => {
    // Stated first and separately, because every assertion below is vacuous
    // if index.ifc has no inline entities: a census that silently returns
    // zero reads exactly like good news.
    const cold = await coldOpen()

    expect( cold.columns.count - cold.columns.firstInlineElement )
        .toBeGreaterThan( 0 )

    const colours = await inlineDiffuseColours( cold.model! )

    expect( colours.size ).toBeGreaterThan( 0 )

    for ( const value of colours.values() ) {
      expect( value ).toBeCloseTo( 0.8 )
    }
  } )

  test( 'restores the same index a cold parse built', async () => {
    const cold = await coldOpen()
    const store = new InMemoryStepByteStore( bytes )

    const sidecar = serializeIndexSidecarFromColumns(
        cold.columns, bytes.byteLength, hashSource( bytes ) )

    const opened = await openIfcModelFromIndex( store, sidecar )

    expect( opened.result ).toBe( ParseResult.COMPLETE )
    expect( opened.columns.count ).toBe( cold.columns.count )
    expect( opened.columns.firstInlineElement )
        .toBe( cold.columns.firstInlineElement )
    expect( opened.columns.complexEntries?.size ?? 0 )
        .toBe( cold.columns.complexEntries?.size ?? 0 )

    // The Model line's source. Blank here would only ever show on the
    // index-first path, which is the path with no other coverage.
    expect( opened.header.headers.size ).toBe( cold.header.headers.size )
  } )

  test( 'inline-valued attributes resolve identically to a cold parse', async () => {
    const cold = await coldOpen()

    const sidecar = serializeIndexSidecarFromColumns(
        cold.columns, bytes.byteLength, hashSource( bytes ) )

    const opened =
      await openIfcModelFromIndex( new InMemoryStepByteStore( bytes ), sidecar )

    expect( await inlineDiffuseColours( opened.model! ) )
        .toEqual( await inlineDiffuseColours( cold.model! ) )
  } )

  test( 'answers type and express-ID queries identically to a cold parse', async () => {
    const cold = await coldOpen()

    const sidecar = serializeIndexSidecarFromColumns(
        cold.columns, bytes.byteLength, hashSource( bytes ) )

    const opened =
      await openIfcModelFromIndex( new InMemoryStepByteStore( bytes ), sidecar )

    const coldRoots = [ ...cold.model!.expressIDsOfTypes( IfcRoot ) ]

    expect( [ ...opened.model!.expressIDsOfTypes( IfcRoot ) ] ).toEqual( coldRoots )

    const expressID = coldRoots[ 0 ] as number

    await opened.model!.ensureResidentByExpressID( expressID )
    await cold.model!.ensureResidentByExpressID( expressID )

    expect( opened.model!.getElementByExpressID( expressID )!.extractLineArguments() )
        .toEqual( cold.model!.getElementByExpressID( expressID )!.extractLineArguments() )
  } )

  test( 'a v1-shaped index degrades exactly the attributes v2 keeps', async () => {
    // The regression this format bump exists to prevent, made observable.
    // Truncating the columns to `[0, firstInlineElement)` is precisely what
    // restoring a v1 sidecar produced; if a future change quietly went back
    // to carrying the top-level range only, this test is what fails.
    const cold = await coldOpen()

    const topLevelOnly: StepIndexColumns<EntityTypesIfc> = {
      address: cold.columns.address.slice( 0, cold.columns.firstInlineElement ),
      length: cold.columns.length.slice( 0, cold.columns.firstInlineElement ),
      typeID: cold.columns.typeID.slice( 0, cold.columns.firstInlineElement ),
      expressID: cold.columns.expressID,
      count: cold.columns.firstInlineElement,
      firstInlineElement: cold.columns.firstInlineElement,
      expressIdsSorted: cold.columns.expressIdsSorted,
    }

    const sidecar = serializeIndexSidecarFromColumns(
        topLevelOnly, bytes.byteLength, hashSource( bytes ) )

    const degraded =
      await openIfcModelFromIndex( new InMemoryStepByteStore( bytes ), sidecar )

    const degradedColours = await inlineDiffuseColours( degraded.model! )
    const trueColours = await inlineDiffuseColours( cold.model! )

    expect( degradedColours.size ).toBe( trueColours.size )
    expect( degradedColours ).not.toEqual( trueColours )

    for ( const value of degradedColours.values() ) {
      expect( value ).toBeNull()
    }
  } )

  test( 'refuses a sidecar built against a different source length', async () => {
    const cold = await coldOpen()

    const sidecar = serializeIndexSidecarFromColumns(
        cold.columns, bytes.byteLength + 1, hashSource( bytes ) )

    await expect(
        openIfcModelFromIndex( new InMemoryStepByteStore( bytes ), sidecar ) )
        .rejects.toThrow( /built against/ )
  } )

  test( 'refuses a sidecar whose hash misses, when asked to check it', async () => {
    const cold = await coldOpen()

    const mutated = bytes.slice()
    mutated[ Math.floor( mutated.length / 2 ) ] ^= 0xFF

    const sidecar = serializeIndexSidecarFromColumns(
        cold.columns, bytes.byteLength, hashSource( bytes ) )

    // Same length, different bytes: the length gate cannot see this, which
    // is exactly the case `verifySourceHash` exists for.
    await expect( openIfcModelFromIndex(
        new InMemoryStepByteStore( mutated ), sidecar ) ).resolves.toBeDefined()

    await expect( openIfcModelFromIndex(
        new InMemoryStepByteStore( mutated ), sidecar,
        { verifySourceHash: true } ) ).rejects.toThrow( /hash does not match/ )
  } )

  test( 'grows the header prefix rather than refusing a long header', async () => {
    // A STEP header longer than the 64 KiB the store open reads for format
    // detection is legal (a large FILE_DESCRIPTION), and a valid model must
    // not be turned away by the size of a buffer — least of all here, the
    // path with no other coverage. Padded with a comment, which the header
    // parser skips, so the file stays the one the index describes.
    const padded = paddedHeaderSource( 80 * 1024 )

    // A pool bigger than the padded header: the streaming builder reports a
    // header that does not fit its FIRST window as-is and never grows for
    // it, so a 4 KiB pool would fail the cold open too and the test would be
    // about the fixture rather than about the index-first prefix.
    const cold = await openStreamedIfcModelFromStore(
        new InMemoryStepByteStore( padded ), { pool: 1024 * 1024 } )

    expect( cold.result ).toBe( ParseResult.COMPLETE )

    const sidecar = serializeIndexSidecarFromColumns(
        cold.columns, padded.byteLength, hashSource( padded ) )

    const opened =
      await openIfcModelFromIndex( new InMemoryStepByteStore( padded ), sidecar )

    expect( opened.header.headers.size ).toBe( cold.header.headers.size )
    expect( [ ...opened.model!.expressIDsOfTypes( IfcRoot ) ] )
        .toEqual( [ ...cold.model!.expressIDsOfTypes( IfcRoot ) ] )
  } )

  test( 'refuses bytes that are not the file the index describes', async () => {
    // Right length, wrong content, and no hash check asked for: the header
    // parse is the backstop, and it must be loud rather than build a model
    // over an index that addresses someone else's bytes.
    const cold = await coldOpen()

    const sidecar = serializeIndexSidecarFromColumns(
        cold.columns, bytes.byteLength, hashSource( bytes ) )

    await expect( openIfcModelFromIndex(
        new InMemoryStepByteStore( new Uint8Array( bytes.byteLength ) ), sidecar ) )
        .rejects.toThrow( /STEP header/ )
  } )
} )
