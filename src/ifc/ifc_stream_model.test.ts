/* eslint-disable no-magic-numbers */
// M1 core: a model built by streaming the source through a bounded window
// (parseStreamToModel) must decode records byte-identically to the resident
// parse — reading them on demand through the windowed provider after
// ensureResident, with the source never held fully resident.
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import ParsingBuffer from '../parsing/parsing_buffer'
import IfcStepParser from './ifc_step_parser'
import { BufferByteSource } from '../step/parsing/byte_source'
import { InMemoryStepByteStore } from '../step/step_buffer_provider'
import { ParseResult } from '../step/parsing/step_parser'
import { IfcRoot } from './ifc4_gen'

// The same small synthetic IFC4X3_RC2 fixture ifc4x3_schema_gate_stream_open.test.ts
// uses for ifc_stream_open.ts's gate — parseStreamToModel/parseStreamToModelAsync
// are the sibling wrappers in this file that bypassed the schema gate
// entirely (codex review of bldrs-ai/conway#713, P1, round 5): they called
// buildColumnarIndexStreaming(Async) without passing `onHeaderParsed`, so a
// 4X3 file parsed COMPLETE and returned an IfcStepModel keyed to IFC4's
// entity ordinals instead of refusing.
//
// Since bldrs-ai/conway#280 these wrappers take the IFC4-compatible route
// for an ELIGIBLE 4X3 file (they have no caller callbacks to protect), so
// the refusal is pinned with an ineligible one: the road fixture plus an
// IFC4X3-only IFCALIGNMENT record.
const IFC4X3_FIXTURE_PATH = 'data/ifc4x3_road_entities_ineligible.ifc'
const IFC4X3_ELIGIBLE_FIXTURE_PATH = 'data/ifc4x3_road_geometry.ifc'

let bytes: Uint8Array
let ifc4x3Bytes: Uint8Array
let eligibleBytes: Uint8Array

/**
 * Decode every IfcRoot-derived entity's GlobalId + Name from a model into a
 * stable map — the attributes are read from the record bytes, so this
 * exercises the actual byte path (resident buffer vs windowed provider).
 *
 * @param model The model to read from.
 * @return {Map<number, string>} expressID → "GlobalId|Name".
 */
function rootAttributes( model: any ): Map<number, string> {
  const out = new Map<number, string>()

  for ( const expressID of model.expressIDsOfTypes( IfcRoot ) ) {
    const entity: any = model.getElementByExpressID( expressID )

    if ( entity === void 0 ) {
      continue
    }

    const globalId = typeof entity.GlobalId === 'string' ? entity.GlobalId : ''
    const name = typeof entity.Name === 'string' ? entity.Name : ''

    out.set( expressID, `${globalId}|${name}` )
  }

  return out
}

beforeAll( () => {
  bytes = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )
  ifc4x3Bytes = new Uint8Array( fs.readFileSync( IFC4X3_FIXTURE_PATH ) )
  eligibleBytes = new Uint8Array( fs.readFileSync( IFC4X3_ELIGIBLE_FIXTURE_PATH ) )
} )

describe( 'parseStreamToModel', () => {

  test( 'streamed windowed model decodes records identically to the resident parse', async () => {
    // Resident ground truth.
    const residentInput = new ParsingBuffer( bytes )
    IfcStepParser.Instance.parseHeader( residentInput )
    const [ , residentModel ] = IfcStepParser.Instance.parseDataToModel( residentInput )
    const expected = rootAttributes( residentModel! )
    expect( expected.size ).toBeGreaterThan( 10 )

    // Streamed: tiny parse window forces slides; tiny model chunks force
    // paging. Same bytes behind both the sync source and the async store.
    const [ result, streamModel ] = IfcStepParser.Instance.parseStreamToModel(
        new BufferByteSource( bytes ),
        new InMemoryStepByteStore( bytes ),
        { pool: 4 * 1024, chunkBytes: 512, maxResidentChunks: 3 } )

    expect( result ).toBe( ParseResult.COMPLETE )
    expect( streamModel!.isSourceExternal ).toBe( true )

    // Page each record in on demand, then decode; must match resident.
    const actual = new Map<number, string>()
    for ( const expressID of streamModel!.expressIDsOfTypes( IfcRoot ) ) {
      await streamModel!.ensureResidentByExpressID( expressID )
      const entity: any = streamModel!.getElementByExpressID( expressID )
      if ( entity === void 0 ) {
        continue
      }
      const globalId = typeof entity.GlobalId === 'string' ? entity.GlobalId : ''
      const name = typeof entity.Name === 'string' ? entity.Name : ''
      actual.set( expressID, `${globalId}|${name}` )
    }

    expect( actual ).toEqual( expected )
  }, 60000 )

  test( 'rejects a store whose size does not match the source', () => {
    expect( () => IfcStepParser.Instance.parseStreamToModel(
        new BufferByteSource( bytes ),
        new InMemoryStepByteStore( bytes.subarray( 0, bytes.length - 1 ) ) ) )
        .toThrow( /does not match/ )
  } )

  test( 'throws on an IFC4X3 file rather than returning a model', () => {
    expect( () => IfcStepParser.Instance.parseStreamToModel(
        new BufferByteSource( ifc4x3Bytes ),
        new InMemoryStepByteStore( ifc4x3Bytes ) ) )
        .toThrow( /IFC4X3/ )
  } )

  test( 'an eligible IFC4X3 file opens through the IFC4-compatible route, ' +
      'with its translated records masked', () => {
    const [ result, model ] = IfcStepParser.Instance.parseStreamToModel(
        new BufferByteSource( eligibleBytes ),
        new InMemoryStepByteStore( eligibleBytes ) )

    expect( result ).toBe( ParseResult.COMPLETE )
    // #37 is the IFCFACILITYPART, read as an IfcBuildingStorey with its
    // first 9 attributes decoded.
    expect( model!.fieldMaskOf( model!.resolveExpressID( 37 )! ) ).toBe( 9 )
  } )

  test( 'an ordinary IFC4 file still parses through the gate', () => {
    const [ result, model ] = IfcStepParser.Instance.parseStreamToModel(
        new BufferByteSource( bytes ),
        new InMemoryStepByteStore( bytes ) )

    expect( result ).toBe( ParseResult.COMPLETE )
    expect( model ).toBeDefined()
  } )
} )

describe( 'parseStreamToModelAsync', () => {

  test( 'throws on an IFC4X3 file rather than returning a model', async () => {
    await expect( IfcStepParser.Instance.parseStreamToModelAsync(
        new BufferByteSource( ifc4x3Bytes ),
        new InMemoryStepByteStore( ifc4x3Bytes ) ) )
        .rejects.toThrow( /IFC4X3/ )
  } )

  test( 'an eligible IFC4X3 file opens through the IFC4-compatible route, ' +
      'with its translated records masked', async () => {
    const [ result, model ] = await IfcStepParser.Instance.parseStreamToModelAsync(
        new BufferByteSource( eligibleBytes ),
        new InMemoryStepByteStore( eligibleBytes ) )

    expect( result ).toBe( ParseResult.COMPLETE )
    expect( model!.fieldMaskOf( model!.resolveExpressID( 37 )! ) ).toBe( 9 )
  } )

  test( 'an ordinary IFC4 file still parses through the gate', async () => {
    const [ result, model ] = await IfcStepParser.Instance.parseStreamToModelAsync(
        new BufferByteSource( bytes ),
        new InMemoryStepByteStore( bytes ) )

    expect( result ).toBe( ParseResult.COMPLETE )
    expect( model ).toBeDefined()
  } )
} )
