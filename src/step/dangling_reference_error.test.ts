import { describe, expect, test } from '@jest/globals'

import IfcStepParser from '../ifc/ifc_step_parser'
import { IfcAxis2Placement3D, IfcPolyline } from '../ifc/ifc4_gen'
import EntityTypesIfc from '../ifc/ifc4_gen/entity_types_ifc.gen'
import IfcStepModel from '../ifc/ifc_step_model'
import ParsingBuffer from '../parsing/parsing_buffer'
import {
  DanglingReferenceError,
  MISTYPED_VALUE_MESSAGE,
} from './dangling_reference_error'
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
 *
 * It also pins what the prefix message must NOT say. The first fix for
 * #580 replaced the original overclaim ("not in the index", against a
 * prefix) with a second one ("prefix index covers #1-#N"), which presents
 * a maximum as a contiguous scan boundary. Express IDs need not arrive in
 * order, so a genuinely dangling reference below the maximum would then
 * read as "not scanned yet" forever — false reassurance in place of a
 * false alarm (codex round 1 on #586).
 *
 * Each prefix case therefore asserts its message as an exact string, and
 * additionally runs it past `expectNoContiguityClaim` — a deliberately
 * partial guard whose job is to make a careless friendlier rewrite fail
 * for a legible reason. See its own doc for what it does not catch.
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

/**
 * Express IDs OUT OF ORDER, and #2 absent from the whole file. A two-record
 * prefix of this indexes #5 and #9, so the maximum (9) sits above the
 * missing #2 while saying nothing whatever about whether #2 was scanned —
 * it was not, and it never will be, because it does not exist.
 *
 * This is the case a "covers #1-#9" message gets actively wrong, and the
 * reason the wording reports a maximum rather than a range. Unsorted IDs
 * are supported by construction, not a curiosity: `expressIdsSorted` is a
 * per-file observation the columnar sink records, and the preview tests
 * move a record to the tail specifically to exercise it.
 */
const UNSORTED_MISSING_TARGET = new TextEncoder().encode(
    `${HEADER}#5=IFCAXIS2PLACEMENT3D(#2,$,$);\n` +
    '#9=IFCCARTESIANPOINT((0.,0.,0.));\n' +
    '#1=IFCCARTESIANPOINT((1.,1.,1.));\n' + FOOTER )

/** Window size; every fixture here is a few hundred bytes. */
const POOL_BYTES = 4096


/**
 * Resolve a placement's Location and return the error that comes back.
 *
 * @param model The model to read the placement out of.
 * @param expressID The placement's express ID.
 * @return {DanglingReferenceError} The thrown error.
 */
function throwOnLocation(
    model: IfcStepModel, expressID: number = 1 ): DanglingReferenceError {

  const placement =
    model.getElementByExpressID( expressID ) as IfcAxis2Placement3D | undefined

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
 * Stream `bytes` into a sink and snapshot it the moment `records` records
 * have been indexed — the parse-time preview channel's move, stopped at a
 * length that leaves the reference under test unresolved.
 *
 * @param bytes The file to stream.
 * @param records How many top-level records the prefix should hold.
 * @return {StepIndexColumns} A prefix index over exactly that many records.
 */
function prefixColumns(
    bytes: Uint8Array,
    records: number = 1 ): StepIndexColumns<EntityTypesIfc> {

  const sink = new ColumnarIndexSink<EntityTypesIfc>()

  let prefix: StepIndexColumns<EntityTypesIfc> | undefined

  const { result } = buildIndexStreaming(
      new BufferByteSource( bytes ),
      IfcStepParser.Instance,
      POOL_BYTES,
      ( localID ) => {
        if ( localID === records - 1 ) {
          prefix = sink.snapshot()
        }
      },
      sink )

  expect( result ).toBe( ParseResult.COMPLETE )
  expect( prefix ).not.toBe( void 0 )

  // A prefix that ran past the record under test is not testing anything.
  expect( prefix!.firstInlineElement ).toBe( records )

  return prefix!
}


/**
 * Assert a message reports absence without implying the index was scanned
 * densely up to some bound.
 *
 * Four shapes are rejected, because all four are easy to reach for when
 * making the wording friendlier: an explicit `#a-#b` range; the vocabulary
 * of coverage ("covers", "up to", "between"), which reads as a range even
 * without the punctuation; the `from … to` construction, which spells one
 * out in words; and the universal quantifiers ("all"/"every" … "before" /
 * "below" / "under"), which assert density over an interval without naming
 * it as one. The last two were codex round 2 on #586 — "the prefix
 * contains every ID from #1 to #9" sailed through the first version of
 * this guard while asserting exactly what the guard exists to forbid.
 *
 * **This is a heuristic over prose, and it cannot be exhaustive.** It
 * matches phrasings someone is likely to write, not the semantic property
 * "claims contiguity" — English has unboundedly many ways to say it, and a
 * sufficiently novel one will pass. So a green `expectNoContiguityClaim`
 * is evidence, not proof: it catches a careless edit, not a determined
 * one. The real specification is the exact-string `toBe` assertion at each
 * call site, which pins the message character for character; this helper
 * only explains WHY that string is the one it is, so a future edit fails
 * with a legible reason instead of a bare string mismatch. Treating a pass
 * here as safety would be a guard overstating its own coverage — which is,
 * with some irony, precisely the defect this whole PR is about.
 *
 * @param message The thrown message.
 */
function expectNoContiguityClaim( message: string ): void {

  expect( message ).not.toMatch( /#\d+\s*[-–—]\s*#?\d+/ )
  expect( message ).not.toMatch( /\b(covers?|covering|through|up to|between)\b/i )
  expect( message ).not.toMatch( /\bscanned yet\b/i )
  expect( message ).not.toMatch( /\bfrom\b[^.]*\bto\b/i )
  expect( message ).not.toMatch(
      /\b(all|every|each|any)\b[^.]*\b(before|below|under|preceding|earlier|lower)\b/i )
}


describe( 'DanglingReferenceError wording', () => {

  test( 'a prefix throw reports absence and the highest indexed ID', () => {

    const columns = prefixColumns( FORWARD_REFERENCE )
    const model = new IfcStepModel( FORWARD_REFERENCE, columns )

    expect( model.indexIsPrefix ).toBe( true )
    expect( model.maxIndexedExpressID ).toBe( 1 )

    const error = throwOnLocation( model )

    expect( error.message ).toBe(
        'Reference to #2 is not present in this prefix index ' +
        '(highest indexed so far: #1)' )
    expect( error.highestIndexedExpressID ).toBe( 1 )

    expectNoContiguityClaim( error.message )
  } )

  test( 'an unsorted prefix does not imply the missing ID was scanned', () => {

    // #2 is absent from the FILE, not merely from the prefix, and the
    // prefix's maximum (#9) is above it. A message that composed the two
    // facts into "covers #1-#9" would report a real dangling reference as
    // "not scanned yet" — and would keep doing so no matter how long the
    // parse ran, since #2 never arrives.
    const model = new IfcStepModel(
        UNSORTED_MISSING_TARGET, prefixColumns( UNSORTED_MISSING_TARGET, 2 ) )

    expect( model.indexIsPrefix ).toBe( true )
    expect( model.maxIndexedExpressID ).toBe( 9 )

    const error = throwOnLocation( model, 5 )

    expect( error.message ).toBe(
        'Reference to #2 is not present in this prefix index ' +
        '(highest indexed so far: #9)' )

    expectNoContiguityClaim( error.message )
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
        FORWARD_REFERENCE, prefixColumns( FORWARD_REFERENCE ) )

    const completeModel = new IfcStepModel(
        NO_TARGET,
        buildColumnarIndexStreaming(
            new BufferByteSource( NO_TARGET ),
            IfcStepParser.Instance,
            POOL_BYTES ).columns )

    const prefixMessage = throwOnLocation( prefixModel ).message
    const completeMessage = throwOnLocation( completeModel ).message

    expect( prefixMessage ).not.toBe( completeMessage )

    // Differing is not enough on its own: the prefix half has to differ by
    // claiming LESS, not by claiming something else that is also untrue.
    expectNoContiguityClaim( prefixMessage )
    expect( completeMessage ).toBe( 'Reference to #2 is not in the index' )
  } )

  test( 'an empty prefix still reports its highest indexed ID', () => {

    // Zero is a legitimate value (nothing indexed yet), so the prefix form
    // is selected by the argument's PRESENCE — `if ( highest )` would
    // silently hand an empty prefix the complete-model wording.
    expect( new DanglingReferenceError( 7, 0 ).message ).toBe(
        'Reference to #7 is not present in this prefix index ' +
        '(highest indexed so far: #0)' )
  } )
} )


/**
 * conway#546: the scalar paths above are only half the story. A placement
 * chain also hops through REFERENCE ARRAYS — `IfcPolyline.Points` is the
 * one a grid axis bottoms out in — and those are read by
 * `extractBufferElement`, which used to answer an unresolved entry with
 * `undefined` and leave the throwing to the generated getter. The getter
 * throws a bare, untagged `Error`, so an array hop that had merely not been
 * scanned yet was indistinguishable from a malformed one: the preview
 * channels counted the deferral and queued nothing, and their forward-only
 * unit cursor meant the product could never preview (see
 * `store_preview_channel.test.ts` for that end of it).
 *
 * The bet these three pin is the DISTINCTION, in both directions. An
 * absent record must classify — that is the recovery #543 dropped. An
 * entry that is indexed but is the wrong entity type must NOT, because a
 * longer prefix cannot change that answer and tagging it would put a
 * permanently broken placement back in the retry queue, which is also
 * what buys early generation preemption (the endless-preemption bug #543
 * fixed).
 */

/** A two-point polyline whose points are both written after it. */
const ARRAY_FORWARD_REFERENCE = new TextEncoder().encode(
    `${HEADER}#1=IFCPOLYLINE((#2,#3));\n` +
    '#2=IFCCARTESIANPOINT((0.,0.));\n' +
    '#3=IFCCARTESIANPOINT((1.,0.));\n' + FOOTER )

/**
 * The same array hop, but #2 is an IFCDIRECTION and the entry wants an
 * IFCCARTESIANPOINT. Indexed, present, and wrong — the case a longer
 * prefix cannot fix.
 */
const ARRAY_MISTYPED_ENTRY = new TextEncoder().encode(
    `${HEADER}#1=IFCPOLYLINE((#2));\n` +
    '#2=IFCDIRECTION((0.,0.,1.));\n' + FOOTER )


/**
 * Read a polyline's Points and return whatever comes back out.
 *
 * @param model The model to read the polyline out of.
 * @return {unknown} The thrown value. Reading Points must throw.
 */
function throwOnPoints( model: IfcStepModel ): unknown {

  const polyline = model.getElementByExpressID( 1 ) as IfcPolyline | undefined

  expect( polyline ).not.toBe( void 0 )

  let caught: unknown

  try {
    void polyline!.Points
  } catch ( ex ) {
    caught = ex
  }

  expect( caught ).toBeInstanceOf( Error )

  return caught
}


describe( 'reference-array classification', () => {

  test( 'an array entry absent from a prefix classifies as dangling', () => {

    const model = new IfcStepModel(
        ARRAY_FORWARD_REFERENCE, prefixColumns( ARRAY_FORWARD_REFERENCE ) )

    const caught = throwOnPoints( model )

    // The whole point: before conway#546 this was a bare Error carrying
    // MISTYPED_VALUE_MESSAGE, which extractPlacementStrict_ could not
    // re-tag, so the product was deferred and never retried.
    expect( caught ).toBeInstanceOf( DanglingReferenceError )
    expect( ( caught as DanglingReferenceError ).expressID ).toBe( 2 )
    expect( ( caught as Error ).message ).toBe(
        'Reference to #2 is not present in this prefix index ' +
        '(highest indexed so far: #1)' )
  } )

  test( 'the same array entry resolves once the parse reaches it', () => {

    // The control. Without this the test above could pass against a file
    // whose #2 never arrives, which is a different defect entirely.
    const { columns, result } = buildColumnarIndexStreaming(
        new BufferByteSource( ARRAY_FORWARD_REFERENCE ),
        IfcStepParser.Instance,
        POOL_BYTES )

    expect( result ).toBe( ParseResult.COMPLETE )

    const model = new IfcStepModel( ARRAY_FORWARD_REFERENCE, columns )
    const polyline = model.getElementByExpressID( 1 ) as IfcPolyline

    expect( polyline.Points.map( ( point ) => point.expressID ) ).toEqual( [2, 3] )
  } )

  test( 'an indexed array entry of the wrong type stays untagged', () => {

    // The counterweight, and the reason this is a classification rather
    // than a blanket tag. #2 IS in the index — it is simply not an
    // IfcCartesianPoint — so no amount of extra parse changes the answer
    // and the preview must not keep retrying it.
    const { columns, result } = buildColumnarIndexStreaming(
        new BufferByteSource( ARRAY_MISTYPED_ENTRY ),
        IfcStepParser.Instance,
        POOL_BYTES )

    expect( result ).toBe( ParseResult.COMPLETE )

    const model = new IfcStepModel( ARRAY_MISTYPED_ENTRY, columns )

    const caught = throwOnPoints( model )

    expect( caught ).not.toBeInstanceOf( DanglingReferenceError )
    expect( ( caught as Error ).message ).toBe( MISTYPED_VALUE_MESSAGE )
  } )
} )
