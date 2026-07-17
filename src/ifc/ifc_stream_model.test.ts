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

let bytes: Uint8Array

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
} )
