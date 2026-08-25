import { describe, expect, test } from '@jest/globals'

import IfcStepParser from '../ifc/ifc_step_parser'
import { IfcAxis2Placement3D } from '../ifc/ifc4_gen'
import EntityTypesIfc from '../ifc/ifc4_gen/entity_types_ifc.gen'
import IfcStepModel from '../ifc/ifc_step_model'
import ParsingBuffer from '../parsing/parsing_buffer'
import { DanglingReferenceError } from './dangling_reference_error'
import { BufferByteSource } from './parsing/byte_source'
import { ColumnarIndexSink, StepIndexColumns } from './parsing/columnar_index'
import { ParseResult } from './parsing/step_parser'
import {
  buildColumnarIndexStreaming,
  buildIndexStreaming,
} from './parsing/streaming_index_builder'


/**
 * conway#580: the same unresolved reference means opposite things on a
 * complete model and on a mid-parse PREFIX, and the message has to say
 * which. On a prefix, "#N is not in the index" is a lie that reads as data
 * corruption — the Arty smoke reported four of them (#724209, #724211,
 * #724213, #724215) and they were four perfectly ordinary prefix throws.
 *
 * The bet this file pins is that the two cases produce DIFFERENT text, and
 * that the complete-model text is the strong wording it has always been. A
 * refactor that dropped the prefix flag would still resolve, still throw,
 * and still say something plausible — nothing but this test notices.
 */

const HEADER =
  'ISO-10303-21;\nHEADER;\n' +
  'FILE_DESCRIPTION((\'\'),\'2;1\');\n' +
  'FILE_NAME(\'d.ifc\',\'2026-01-01T00:00:00\',(\'\'),(\'\'),\'\',\'\',\'\');\n' +
  'FILE_SCHEMA((\'IFC4\'));\nENDSEC;\nDATA;\n'

const FOOTER = 'ENDSEC;\nEND-ISO-10303-21;\n'

/**
 * #1's Location points FORWARD at #2. Snapshot after the first record and
 * #2 is genuinely un-scanned; parse to the end and it resolves — which is
 * what makes this the prefix case rather than a broken file.
 */
const FORWARD_REFERENCE = new TextEncoder().encode(
    `${HEADER}#1=IFCAXIS2PLACEMENT3D(#2,$,$);\n` +
    '#2=IFCCARTESIANPOINT((0.,0.,0.));\n' + FOOTER )

/** The same reference with no #2 anywhere: a real dangling reference. */
const NO_TARGET = new TextEncoder().encode(
    `${HEADER}#1=IFCAXIS2PLACEMENT3D(#2,$,$);\n` + FOOTER )

/** Window size; every fixture here is a few hundred bytes. */
const POOL_BYTES = 4096


/**
 * Resolve #1's Location and return the error that comes back.
 *
 * @param model The model to read #1 out of.
 * @return {DanglingReferenceError} The thrown error.
 */
function throwOnLocation( model: IfcStepModel ): DanglingReferenceError {

  const placement =
    model.getElementByExpressID( 1 ) as IfcAxis2Placement3D | undefined

  expect( placement ).not.toBe( void 0 )

  let caught: unknown

  try {
    void placement!.Location
  } catch ( ex ) {
    caught = ex
  }

  expect( caught ).toBeInstanceOf( DanglingReferenceError )

  return caught as DanglingReferenceError
}


/**
 * Stream `bytes` into a sink and snapshot it the moment the first record
 * has been indexed — the parse-time preview channel's move, at the one
 * prefix length that leaves #2 ahead of the scan.
 *
 * @param bytes The file to stream.
 * @return {StepIndexColumns} A prefix index holding record #1 only.
 */
function prefixColumnsAfterFirstRecord(
    bytes: Uint8Array ): StepIndexColumns<EntityTypesIfc> {

  const sink = new ColumnarIndexSink<EntityTypesIfc>()

  let prefix: StepIndexColumns<EntityTypesIfc> | undefined

  const { result } = buildIndexStreaming(
      new BufferByteSource( bytes ),
      IfcStepParser.Instance,
      POOL_BYTES,
      ( localID ) => {
        if ( localID === 0 ) {
          prefix = sink.snapshot()
        }
      },
      sink )

  expect( result ).toBe( ParseResult.COMPLETE )
  expect( prefix ).not.toBe( void 0 )

  // The prefix has to stop before #2 or it is not testing anything.
  expect( prefix!.firstInlineElement ).toBe( 1 )

  return prefix!
}


describe( 'DanglingReferenceError wording', () => {

  test( 'a prefix throw says the record has not been scanned yet', () => {

    const columns = prefixColumnsAfterFirstRecord( FORWARD_REFERENCE )
    const model = new IfcStepModel( FORWARD_REFERENCE, columns )

    expect( model.indexIsPrefix ).toBe( true )
    expect( model.maxIndexedExpressID ).toBe( 1 )

    const error = throwOnLocation( model )

    expect( error.message )
        .toBe( 'Reference to #2 has not been scanned yet (prefix index covers #1-#1)' )
    expect( error.indexHighWaterMark ).toBe( 1 )
  } )

  test( 'the same reference resolves once the parse reaches it', () => {

    // Guards the fixture, not the code: if #2 ever stopped resolving on the
    // full file, the test above would be pinning a genuinely broken model
    // and its "not scanned yet" claim would be the lie instead.
    const { columns, result } = buildColumnarIndexStreaming(
        new BufferByteSource( FORWARD_REFERENCE ),
        IfcStepParser.Instance,
        POOL_BYTES )

    expect( result ).toBe( ParseResult.COMPLETE )

    const model = new IfcStepModel( FORWARD_REFERENCE, columns )
    const placement = model.getElementByExpressID( 1 ) as IfcAxis2Placement3D

    expect( placement.Location.expressID ).toBe( 2 )
  } )

  test( 'a complete columnar model keeps the strong wording', () => {

    const { columns, result } = buildColumnarIndexStreaming(
        new BufferByteSource( NO_TARGET ), IfcStepParser.Instance, POOL_BYTES )

    expect( result ).toBe( ParseResult.COMPLETE )

    // finalize() must NOT carry the snapshot's prefix flag — this is the
    // half of the change that could regress silently.
    expect( columns.indexIsPrefix ).toBe( void 0 )

    const model = new IfcStepModel( NO_TARGET, columns )

    expect( model.indexIsPrefix ).toBe( false )

    expect( throwOnLocation( model ).message )
        .toBe( 'Reference to #2 is not in the index' )
  } )

  test( 'a complete object-index model keeps the strong wording', () => {

    const input = new ParsingBuffer( NO_TARGET )

    expect( IfcStepParser.Instance.parseHeader( input )[1] ).toBe( ParseResult.COMPLETE )

    const [ , model ] = IfcStepParser.Instance.parseDataToModel( input )

    expect( model ).not.toBe( void 0 )
    expect( model!.indexIsPrefix ).toBe( false )

    expect( throwOnLocation( model! ).message )
        .toBe( 'Reference to #2 is not in the index' )
  } )

  test( 'prefix and complete throws for one reference differ', () => {

    const prefixModel = new IfcStepModel(
        FORWARD_REFERENCE, prefixColumnsAfterFirstRecord( FORWARD_REFERENCE ) )

    const completeModel = new IfcStepModel(
        NO_TARGET,
        buildColumnarIndexStreaming(
            new BufferByteSource( NO_TARGET ),
            IfcStepParser.Instance,
            POOL_BYTES ).columns )

    expect( throwOnLocation( prefixModel ).message )
        .not.toBe( throwOnLocation( completeModel ).message )
  } )

  test( 'an empty prefix still reports its high-water mark', () => {

    // Zero is a legitimate mark (nothing scanned), so the prefix form is
    // selected by the argument's PRESENCE — `if ( mark )` would silently
    // hand an empty prefix the complete-model wording.
    expect( new DanglingReferenceError( 7, 0 ).message )
        .toBe( 'Reference to #7 has not been scanned yet (prefix index covers #1-#0)' )
  } )
} )
