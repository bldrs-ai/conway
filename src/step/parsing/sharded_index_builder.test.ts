/* eslint-disable no-magic-numbers */
/**
 * The equivalence gate for the sharded index build (#394 M2), ported from
 * `scripts/index_shard_spike.mjs --selftest`.
 *
 * **The bar is byte-identity, not equivalence-in-spirit.** A construction
 * change to the index build must produce the *same bytes* as the serial
 * builder in all four columns and every scalar, because everything
 * downstream — localIDs, the inline range, the sidecar, the regression
 * digests — is positional. So every assertion here compares the merged
 * columns against `buildColumnarIndexStreaming`'s and demands zero
 * differences, and one of them serialises both to a sidecar and compares the
 * blobs.
 *
 * Two layers, because they can fail independently:
 *
 * 1. **Adversarial splits over synthetic fixtures.** Each fixture contains
 *    the byte sequence the boundary scan looks for (`;` newline `#` digits
 *    `=`) somewhere it must NOT split — inside a quoted string, inside a
 *    `''` escape, inside a block comment — and every byte offset in the data
 *    section is used as the split target. The fixtures exist to make the
 *    scan produce false candidates, so the test asserts that it *did*
 *    produce them and the seam gate caught them: a trap that never springs
 *    has tested nothing (this is exactly the "check that cannot fail" trap
 *    the #536 review kept finding).
 *
 * 2. **The whole builder over real fixtures**, at N = 1..4, including the
 *    two shapes the merge is most likely to get wrong — a model with inline
 *    entities, and one with complex instances (`multiMapping`). Both
 *    populations are asserted non-empty before the equality is trusted.
 */
import * as fs from 'fs'

import { describe, expect, test } from '@jest/globals'

import IfcStepParser from '../../ifc/ifc_step_parser'
import EntityTypesIfc from '../../ifc/ifc4_gen/entity_types_ifc.gen'
import { BufferByteSource } from './byte_source'
import { StepIndexColumns, StepIndexShard } from './columnar_index'
import {
  hashSource,
  serializeIndexSidecarFromColumns,
} from './index_sidecar'
import {
  MAX_DERIVED_SHARD_COUNT,
  ShardRunner,
  ShardStop,
  buildColumnarIndexShardedAsync,
  buildIndexShardRange,
  compareIndexColumns,
  findRecordBoundaryCandidate,
  inProcessShardRunner,
  mergeIndexShards,
  resolveShardCount,
} from './sharded_index_builder'
import {
  buildColumnarIndexStreaming,
  buildIndexStreaming,
} from './streaming_index_builder'
import { ParseResult } from './step_parser'


const PARSER = IfcStepParser.Instance

/** Pool small enough to force window slides on the fixtures. */
const SMALL_POOL = 4 * 1024

/** Pool large enough that a fixture fits in one window. */
const WHOLE_FILE_POOL = 1024 * 1024


/**
 * The serial build every sharded build here is measured against.
 *
 * @param bytes The model bytes.
 * @param pool Window size in bytes.
 * @return {StepIndexColumns} The single-threaded columns.
 */
function serialColumns(
    bytes: Uint8Array, pool: number ): StepIndexColumns<EntityTypesIfc> {

  const built = buildColumnarIndexStreaming(
      new BufferByteSource( bytes ), PARSER, pool )

  expect( built.result ).toBe( ParseResult.COMPLETE )

  return built.columns
}


/**
 * Locate the data-block start the same way the builder does — by parsing the
 * header and taking the cursor it leaves behind.
 *
 * @param bytes The model bytes.
 * @return {number} Absolute offset of the first record.
 */
function dataBlockStart( bytes: Uint8Array ): number {

  // `findRecordBoundaryCandidate` from 0 finds the first line-anchored
  // record head, which on these fixtures is the first data record; the
  // header lines end in `;` so the scan's precondition holds.
  const start = findRecordBoundaryCandidate( bytes, 0, bytes.length )

  expect( start ).toBeGreaterThan( 0 )

  return start
}


const HEADER =
  'ISO-10303-21;\nHEADER;\n' +
  "FILE_DESCRIPTION((''),'2;1');\n" +
  "FILE_NAME('t','2026-08-27T00:00:00',(''),(''),'','','');\n" +
  "FILE_SCHEMA(('IFC4'));\nENDSEC;\nDATA;\n"


/**
 * A run of ordinary records, so each trap sits in a body rather than being
 * the whole file.
 *
 * @param from First express ID.
 * @param howMany How many records.
 * @return {string} The records.
 */
function filler( from: number, howMany: number ): string {

  let text = ''

  for ( let index = 0; index < howMany; ++index ) {
    text += `#${from + index}=IFCPERSON($,$,'p${from + index}',$,$,$,$,$);\n`
  }

  return text
}


/**
 * Every fixture's data-section body. The first five contain the byte
 * sequence the scan looks for somewhere it must not split; the last four
 * exercise the merge rather than the scan — inline entities, inline
 * entities nested inside inline entities, complex instances, and express
 * IDs that descend.
 */
const FIXTURES: [ string, string ][] = [
  [ 'quoted-semicolon-hash',
    `${filler( 1, 6 )}` +
    "#7=IFCPERSON($,$,';\\n#9999=IFCFAKE(0);',$,$,$,$,$);\n" +
    `${filler( 8, 6 )}` ],
  [ 'quoted-real-newline-then-record-head',
    `${filler( 1, 6 )}` +
    "#7=IFCPERSON($,$,'trap;\n#4444=IFCFAKE(1);\nstill inside the string'," +
    '$,$,$,$,$);\n' +
    `${filler( 8, 6 )}` ],
  [ 'block-comment-with-record-head',
    `${filler( 1, 6 )}` +
    '/* a comment holding ;\n#5555=IFCFAKE(2);\n and more text */\n' +
    `${filler( 8, 6 )}` ],
  [ 'doubled-quote-escape',
    `${filler( 1, 6 )}` +
    "#7=IFCPERSON($,$,'it''s a trap ;\n#6666=IFCFAKE(3); still inside'," +
    '$,$,$,$,$);\n' +
    `${filler( 8, 6 )}` ],
  [ 'two-traps-back-to-back',
    `${filler( 1, 4 )}` +
    "#5=IFCPERSON($,$,'trap A ;\n#7777=IFCFAKE(4);',$,$,$,$,$);\n" +
    "#6=IFCPERSON($,$,'trap B ;\n#8888=IFCFAKE(5);',$,$,$,$,$);\n" +
    `${filler( 7, 4 )}` ],
  [ 'inline-entities-and-a-trap',
    "#1=IFCPROPERTYSINGLEVALUE('p',$,IFCTEXT('v'),$);\n" +
    "#2=IFCPROPERTYSINGLEVALUE('q',$,IFCINTEGER(3),$);\n" +
    "#3=IFCPROPERTYSINGLEVALUE('r',$,IFCTEXT(';\n#3333=IFCFAKE(6);'),$);\n" +
    "#4=IFCPROPERTYSINGLEVALUE('s',$,IFCLABEL('w'),$);\n" +
    "#5=IFCPROPERTYSINGLEVALUE('t',$,IFCREAL(1.5),$);\n" +
    "#6=IFCPROPERTYSINGLEVALUE('u',$,IFCTEXT('y'),$);\n" ],
  [ 'nested-inline-entities',
    // Inline entities that themselves hold inline entities. This is the ONLY
    // shape that can tell a global breadth-first unfold apart from a
    // per-shard one: with a single level, per-shard unfolds concatenate into
    // the same order the global unfold produces, and a merge that unfolds
    // per shard passes every other fixture here. The nesting is asserted
    // below rather than assumed.
    "#1=IFCPROPERTYSINGLEVALUE('a',$,IFCMEASUREWITHUNIT(IFCLENGTHMEASURE(1.0),$),$);\n" +
    "#2=IFCPROPERTYSINGLEVALUE('b',$,IFCMEASUREWITHUNIT(IFCLENGTHMEASURE(2.0),$),$);\n" +
    "#3=IFCPROPERTYSINGLEVALUE('c',$,IFCMEASUREWITHUNIT(IFCLENGTHMEASURE(3.0),$),$);\n" +
    "#4=IFCPROPERTYSINGLEVALUE('d',$,IFCMEASUREWITHUNIT(IFCLENGTHMEASURE(4.0),$),$);\n" +
    "#5=IFCPROPERTYSINGLEVALUE('e',$,IFCMEASUREWITHUNIT(IFCLENGTHMEASURE(5.0),$),$);\n" +
    "#6=IFCPROPERTYSINGLEVALUE('f',$,IFCMEASUREWITHUNIT(IFCLENGTHMEASURE(6.0),$),$);\n" ],
  [ 'multi-mapping-complex-instance',
    `${filler( 1, 3 )}` +
    '#4=(IFCLENGTHMEASURE(1.0)IFCPOSITIVELENGTHMEASURE(1.0));\n' +
    `${filler( 5, 3 )}` +
    '#8=(IFCLENGTHMEASURE(2.0)IFCPOSITIVELENGTHMEASURE(2.0));\n' +
    `${filler( 9, 3 )}` ],
  [ 'descending-express-ids',
    '#30=IFCPERSON($,$,$,$,$,$,$,$);\n' +
    '#20=IFCPERSON($,$,$,$,$,$,$,$);\n' +
    '#25=IFCPERSON($,$,$,$,$,$,$,$);\n' +
    '#10=IFCPERSON($,$,$,$,$,$,$,$);\n' +
    '#40=IFCPERSON($,$,$,$,$,$,$,$);\n' ],
  [ 'single-descent-across-a-seam',
    // EXACTLY ONE descent (30 -> 5), with both halves ascending. That is
    // what it takes to catch a merge that trusts each shard's own
    // sorted-express-ID verdict instead of re-deriving it across the seams:
    // split at the descent and every shard is internally sorted while the
    // file is not. `descending-express-ids` above CANNOT catch it — it has
    // two descents, so a two-way split always leaves one inside a shard,
    // and a mutation run proved the suite green without this fixture.
    '#10=IFCPERSON($,$,$,$,$,$,$,$);\n' +
    '#20=IFCPERSON($,$,$,$,$,$,$,$);\n' +
    '#30=IFCPERSON($,$,$,$,$,$,$,$);\n' +
    '#5=IFCPERSON($,$,$,$,$,$,$,$);\n' +
    '#15=IFCPERSON($,$,$,$,$,$,$,$);\n' +
    '#25=IFCPERSON($,$,$,$,$,$,$,$);\n' ],
]


/** What one adversarial split produced. */
interface SplitOutcome {

  /** The merged columns. */
  columns: StepIndexColumns<EntityTypesIfc>

  /**
   * True when the scan proposed an offset that is NOT a record boundary —
   * it sat inside a quoted string or a comment — and the seam gate rejected
   * it. This is the case the trap fixtures exist to produce.
   */
  falseCandidateCaught: boolean

  /**
   * True when the candidate landed past the last record, so the owning
   * shard reached ENDSEC first. Benign, and NOT evidence about boundary
   * detection, so it is counted separately.
   */
  pastEndOfData: boolean

  /**
   * True when some shard indexed NO records. The merge has to carry the
   * express-ID seam across it without resetting, and re-key nothing — an
   * edge the sweep produces naturally and which is asserted below rather
   * than assumed, so it cannot silently stop happening.
   */
  hadEmptyShard: boolean
}


/**
 * Split `bytes` at the given candidate offsets exactly as the coordinator
 * does — each shard starting at the previous shard's VERIFIED stop, which is
 * the repair — merge, and report what happened.
 *
 * Driving the primitives rather than `buildColumnarIndexShardedAsync` is
 * deliberate: the orchestrator chooses uniform split targets, and this test
 * needs to choose them, one byte at a time.
 *
 * @param bytes The model bytes.
 * @param dataStart Absolute offset of the first record.
 * @param candidates Candidate split offsets, ascending.
 * @return {SplitOutcome} The merge and how the candidates behaved.
 */
function checkSplit(
    bytes: Uint8Array,
    dataStart: number,
    candidates: readonly number[] ): SplitOutcome {

  const source = new BufferByteSource( bytes )
  const shards: StepIndexShard<EntityTypesIfc>[] = []

  let cursor = dataStart
  let falseCandidateCaught = false
  let pastEndOfData = false

  for ( let index = 0; index <= candidates.length; ++index ) {

    const end = index < candidates.length ?
      Math.max( candidates[ index ], cursor ) : bytes.length

    const outcome =
      buildIndexShardRange( source, PARSER, cursor, end, SMALL_POOL )

    shards.push( outcome.shard )

    if ( index < candidates.length &&
      outcome.stopOffset !== candidates[ index ] ) {

      if ( outcome.stop === ShardStop.END_OF_DATA ) {
        pastEndOfData = true
      } else {
        falseCandidateCaught = true
      }
    }

    cursor = outcome.stopOffset
  }

  return {
    columns: mergeIndexShards( shards ),
    falseCandidateCaught,
    pastEndOfData,
    hadEmptyShard: shards.some( ( shard ) => shard.topLevelCount === 0 ),
  }
}


describe( 'adversarial splits: every byte offset of every trap fixture', () => {

  test.each( FIXTURES )( '%s merges byte-identically at every split',
      ( name, body ) => {

        const bytes = new TextEncoder().encode(
            `${HEADER}${body}ENDSEC;\nEND-ISO-10303-21;\n` )
        const reference = serialColumns( bytes, SMALL_POOL )
        const dataStart = dataBlockStart( bytes )

        let splits = 0
        const mismatches: string[] = []

        for ( let target = dataStart; target <= bytes.length; ++target ) {

          const found =
            findRecordBoundaryCandidate( bytes, target, bytes.length )
          const candidate = found < 0 ? bytes.length : found

          const outcome = checkSplit( bytes, dataStart, [ candidate ] )

          ++splits

          const failures = compareIndexColumns( outcome.columns, reference )

          if ( failures.length > 0 && mismatches.length === 0 ) {
            mismatches.push( `${name} target=${target} ` +
              `candidate=${candidate}: ${failures.join( '; ' )}` )
          }
        }

        expect( mismatches ).toEqual( [] )

        // Every byte of the data section was a split target, so a fixture
        // that shrank to nothing (or a dataStart that ran off the end) shows
        // up here rather than passing with an empty loop.
        expect( splits ).toBeGreaterThan( 100 )
      } )

  // Without this the suite above is a check that cannot fail: if the scan
  // stopped proposing false candidates — because a fixture drifted, or
  // because the scan got more conservative — every split would be a true
  // boundary and the seam gate would never be exercised at all.
  test( 'the trap fixtures actually produce false candidates', () => {

    let caught = 0

    for ( const [ , body ] of FIXTURES.slice( 0, 5 ) ) {

      const bytes = new TextEncoder().encode(
          `${HEADER}${body}ENDSEC;\nEND-ISO-10303-21;\n` )
      const dataStart = dataBlockStart( bytes )

      for ( let target = dataStart; target <= bytes.length; ++target ) {

        const found = findRecordBoundaryCandidate( bytes, target, bytes.length )
        const candidate = found < 0 ? bytes.length : found

        if ( checkSplit( bytes, dataStart, [ candidate ] ).falseCandidateCaught ) {
          ++caught
        }
      }
    }

    expect( caught ).toBeGreaterThan( 0 )
  } )

  test( 'the nested-inline fixture really nests, two levels deep', () => {

    // Guards the one fixture whose whole purpose is ordering. If the schema
    // stopped treating `IFCMEASUREWITHUNIT(IFCLENGTHMEASURE(...))` as nested
    // inline entities, the per-shard-versus-global unfold distinction would
    // become untestable and every merge test would still pass.
    const bytes = new TextEncoder().encode(
        `${HEADER}${FIXTURES[ 6 ][ 1 ]}ENDSEC;\nEND-ISO-10303-21;\n` )

    const built = buildIndexStreaming(
        new BufferByteSource( bytes ), PARSER, SMALL_POOL )

    let firstLevel = 0
    let secondLevel = 0

    for ( const entry of built.elements ) {
      for ( const child of entry.inlineEntities ?? [] ) {
        ++firstLevel
        secondLevel += ( child.inlineEntities ?? [] ).length
      }
    }

    // Several top-level records carry nesting, so any split has retained
    // entries with second-level children on BOTH sides of the seam.
    expect( firstLevel ).toBeGreaterThanOrEqual( 6 )
    expect( secondLevel ).toBeGreaterThanOrEqual( 6 )
  } )

  test( 'the sweep really produces empty shards, and they merge clean', () => {

    // An empty shard is the edge the merge's seam carry and localID re-key
    // are most likely to get wrong, and the every-offset sweep produces it
    // naturally — but only an assertion keeps that true. Without this, a
    // change to the boundary scan could stop generating the case and every
    // other test here would still pass.
    let emptyShardSplits = 0
    let checked = 0

    for ( const [ , body ] of FIXTURES ) {

      const bytes = new TextEncoder().encode(
          `${HEADER}${body}ENDSEC;\nEND-ISO-10303-21;\n` )
      const reference = serialColumns( bytes, SMALL_POOL )
      const dataStart = dataBlockStart( bytes )

      for ( let target = dataStart; target <= bytes.length; ++target ) {

        const found = findRecordBoundaryCandidate( bytes, target, bytes.length )
        const candidate = found < 0 ? bytes.length : found
        const outcome = checkSplit( bytes, dataStart, [ candidate ] )

        if ( !outcome.hadEmptyShard ) {
          continue
        }

        ++emptyShardSplits
        checked += compareIndexColumns( outcome.columns, reference ).length
      }
    }

    expect( emptyShardSplits ).toBeGreaterThan( 20 )
    expect( checked ).toBe( 0 )
  } )

  test( 'the merge sees inline entities and complex instances', () => {

    const inlineBytes = new TextEncoder().encode(
        `${HEADER}${FIXTURES[ 5 ][ 1 ]}ENDSEC;\nEND-ISO-10303-21;\n` )
    const complexBytes = new TextEncoder().encode(
        `${HEADER}${FIXTURES[ 7 ][ 1 ]}ENDSEC;\nEND-ISO-10303-21;\n` )

    const inline = serialColumns( inlineBytes, SMALL_POOL )
    const complex = serialColumns( complexBytes, SMALL_POOL )

    // The inline range and the complexEntries map are the two things a
    // concatenating merge loses. If these are empty the equality tests above
    // are only checking the top-level range.
    expect( inline.count - inline.firstInlineElement ).toBeGreaterThan( 0 )
    expect( complex.complexEntries?.size ?? 0 ).toBeGreaterThan( 0 )
  } )

  test.each( [ 8, 9 ] )(
      'a descent is still seen as unsorted at every seam (fixture %d)',
      ( fixture ) => {

        // A shard's own scan restarts from previousExpressID = 0, so it is
        // blind to a descent that falls exactly on a seam; the merge has to
        // re-derive it. Fixture 9 is the one that can actually fail — see
        // its comment.
        const bytes = new TextEncoder().encode(
            `${HEADER}${FIXTURES[ fixture ][ 1 ]}ENDSEC;\nEND-ISO-10303-21;\n` )
        const dataStart = dataBlockStart( bytes )

        expect( serialColumns( bytes, SMALL_POOL ).expressIdsSorted )
            .toBe( false )

        for ( let target = dataStart; target <= bytes.length; ++target ) {

          const found =
            findRecordBoundaryCandidate( bytes, target, bytes.length )
          const candidate = found < 0 ? bytes.length : found

          expect( checkSplit( bytes, dataStart, [ candidate ] )
              .columns.expressIdsSorted ).toBe( false )
        }
      } )

  test( 'the single-descent fixture really has exactly one descent', () => {

    // The fixture only catches the cross-seam bug while BOTH halves of the
    // split are internally sorted. A second descent would put one inside a
    // shard and the merge would report unsorted for the wrong reason.
    const expressIDs = [ 10, 20, 30, 5, 15, 25 ]

    let descents = 0

    for ( let where = 1; where < expressIDs.length; ++where ) {
      if ( expressIDs[ where ] < expressIDs[ where - 1 ] ) {
        ++descents
      }
    }

    expect( descents ).toBe( 1 )
    expect( FIXTURES[ 9 ][ 1 ] )
        .toContain( `#${expressIDs[ 3 ]}=IFCPERSON` )
  } )

  test( 'sorted express IDs survive the seams', () => {

    const bytes = new TextEncoder().encode(
        `${HEADER}${filler( 1, 24 )}ENDSEC;\nEND-ISO-10303-21;\n` )
    const dataStart = dataBlockStart( bytes )

    expect( serialColumns( bytes, SMALL_POOL ).expressIdsSorted ).toBe( true )

    for ( let target = dataStart; target <= bytes.length; ++target ) {

      const found = findRecordBoundaryCandidate( bytes, target, bytes.length )
      const candidate = found < 0 ? bytes.length : found

      expect( checkSplit( bytes, dataStart, [ candidate ] )
          .columns.expressIdsSorted ).toBe( true )
    }
  } )
} )


describe( 'buildColumnarIndexShardedAsync over real fixtures', () => {

  const MODELS = [
    'data/index.ifc',
    'data/grid_placement.ifc',
    'data/aggregate_complex_related.ifc',
  ]

  const SHARD_COUNTS = [ 1, 2, 3, 4 ]

  const CASES: [ string, number ][] = []

  for ( const model of MODELS ) {
    for ( const shardCount of SHARD_COUNTS ) {
      CASES.push( [ model, shardCount ] )
    }
  }

  test.each( CASES )( '%s at N=%d is byte-identical to the serial build',
      async ( model, shardCount ) => {

        const bytes = new Uint8Array( fs.readFileSync( model ) )
        const reference = serialColumns( bytes, SMALL_POOL )

        const built = await buildColumnarIndexShardedAsync(
            new BufferByteSource( bytes ), PARSER, SMALL_POOL, { shardCount } )

        expect( built.result ).toBe( ParseResult.COMPLETE )
        expect( built.fellBackToSerial ).toBe( false )

        // `<=`, not `===`: these fixtures are 2-18 KB, so a requested 4-way
        // split can find fewer than three usable record-boundary candidates
        // and collapse. That is the intended behaviour, and the next test is
        // what stops it hiding a build that always collapses to one shard.
        expect( built.shardCount ).toBeGreaterThanOrEqual( 1 )
        expect( built.shardCount ).toBeLessThanOrEqual( shardCount )
        expect( compareIndexColumns( built.columns, reference ) ).toEqual( [] )
      } )

  test( 'the N-way cases really do run N shards on the largest fixture',
      async () => {

        // Without this, every assertion above would still pass if the
        // coordinator silently collapsed every request to a single shard —
        // the merge would then never be exercised at all.
        const bytes = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )

        for ( const shardCount of SHARD_COUNTS ) {

          const built = await buildColumnarIndexShardedAsync(
              new BufferByteSource( bytes ), PARSER, SMALL_POOL,
              { shardCount } )

          expect( built.shardCount ).toBe( shardCount )
        }
      } )

  test( 'the fixtures carry the rows a concatenating merge would lose',
      () => {

        const inline = serialColumns(
            new Uint8Array( fs.readFileSync( 'data/index.ifc' ) ), SMALL_POOL )

        expect( inline.count - inline.firstInlineElement ).toBeGreaterThan( 0 )
        expect( inline.firstInlineElement ).toBeGreaterThan( 1 )
      } )

  test( 'N=1 runs the serial builder itself, not a one-shard imitation',
      async () => {

        const bytes = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )
        const serial = buildColumnarIndexStreaming(
            new BufferByteSource( bytes ), PARSER, WHOLE_FILE_POOL )

        const built = await buildColumnarIndexShardedAsync(
            new BufferByteSource( bytes ), PARSER, WHOLE_FILE_POOL,
            { shardCount: 1 } )

        expect( built.shardCount ).toBe( 1 )
        expect( built.fellBackToSerial ).toBe( false )
        expect( built.seamRepairs ).toBe( 0 )
        expect( compareIndexColumns( built.columns, serial.columns ) )
            .toEqual( [] )

        // The serial builder's own diagnostics come through untouched —
        // which is what "the same code path" means here.
        expect( built.stats ).toEqual( serial.stats )
        expect( built.header ).toEqual( serial.header )
      } )

  test( 'the serialised sidecar is byte-identical too', async () => {

    // The weaker of the two gates and deliberately secondary: a v1 sidecar
    // carries only the top-level range, so it cannot see an inline-range
    // reordering at all. It is here because it is the form the index
    // actually ships in.
    const bytes = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )
    const hash = hashSource( bytes )
    const reference = serialColumns( bytes, SMALL_POOL )

    const built = await buildColumnarIndexShardedAsync(
        new BufferByteSource( bytes ), PARSER, SMALL_POOL, { shardCount: 4 } )

    expect( serializeIndexSidecarFromColumns( built.columns, bytes.length, hash ) )
        .toEqual(
            serializeIndexSidecarFromColumns( reference, bytes.length, hash ) )
  } )
} )


describe( 'a runner that rejects', () => {

  /**
   * A runner that fails the way a worker pool really fails: the shard job
   * rejects rather than returning a bad outcome. A crashed worker, a worker
   * that exits, a transport error and an I/O failure opening the model in a
   * worker all arrive here.
   *
   * @param onShard Which shard index should reject; every other shard runs
   * in process as normal.
   * @param bytes The model bytes.
   * @return {ShardRunner} The runner.
   */
  function rejectingRunner(
      onShard: number, bytes: Uint8Array ): ShardRunner<EntityTypesIfc> {

    const inner =
      inProcessShardRunner( new BufferByteSource( bytes ), PARSER, SMALL_POOL )

    return ( job ) => {

      if ( job.index === onShard ) {
        return Promise.reject( new Error( 'worker exited with code 1' ) )
      }

      return inner( job )
    }
  }

  test( 'falls back to serial and reports the runner error', async () => {

    const bytes = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )
    const reference = serialColumns( bytes, SMALL_POOL )

    const built = await buildColumnarIndexShardedAsync(
        new BufferByteSource( bytes ), PARSER, SMALL_POOL,
        { shardCount: 4, runner: rejectingRunner( 2, bytes ) } )

    // The guarantee this module leans on hardest: a worker crash is a
    // REPORTED serial fallback, not an unhandled rejection out of the load.
    expect( built.fellBackToSerial ).toBe( true )
    expect( built.fallbackReason ).toMatch( /shard runner failed/ )
    expect( built.fallbackReason ).toMatch( /worker exited with code 1/ )
    expect( built.shardCount ).toBe( 1 )
    expect( compareIndexColumns( built.columns, reference ) ).toEqual( [] )
  } )

  test( 'fallbackToSerial: false rethrows, keeping the runner error as cause',
      async () => {

        const bytes = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )

        const build = buildColumnarIndexShardedAsync(
            new BufferByteSource( bytes ), PARSER, SMALL_POOL,
            {
              shardCount: 4,
              fallbackToSerial: false,
              runner: rejectingRunner( 0, bytes ),
            } )

        await expect( build ).rejects.toThrow( /sharded index build failed/ )

        // The underlying worker error survives the wrapper, so a caller that
        // opted out of the fallback can still see what actually broke.
        await build.catch( ( thrown ) => {
          expect( ( thrown as { cause?: Error } ).cause )
              .toBeInstanceOf( Error )
          expect( ( ( thrown as { cause?: Error } ).cause as Error ).message )
              .toMatch( /worker exited with code 1/ )
        } )
      } )

  test( 'a rejection from a SEAM REPAIR is caught too', async () => {

    // The repair re-runs a shard, so it can reject exactly like the initial
    // dispatch. It runs after `Promise.all` has already resolved, which is
    // what makes it a separate path worth its own test.
    const bytes = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )
    const reference = serialColumns( bytes, SMALL_POOL )
    const inner =
      inProcessShardRunner( new BufferByteSource( bytes ), PARSER, SMALL_POOL )

    const seen = new Set<number>()

    const runner: ShardRunner<EntityTypesIfc> = ( job ) => {

      // Reject only the SECOND time a shard index is asked for, which is
      // what a repair is; the first pass resolves normally.
      if ( seen.has( job.index ) ) {
        return Promise.reject( new Error( 'worker died during repair' ) )
      }

      seen.add( job.index )

      // Report a stop offset that cannot match the next shard's start, to
      // force the seam gate into a repair.
      return inner( job ).then( ( outcome ) => ( {
        ...outcome,
        stopOffset: job.index === 0 ? outcome.stopOffset - 1 : outcome.stopOffset,
      } ) )
    }

    const built = await buildColumnarIndexShardedAsync(
        new BufferByteSource( bytes ), PARSER, SMALL_POOL,
        { shardCount: 2, runner } )

    expect( built.fellBackToSerial ).toBe( true )
    expect( built.fallbackReason ).toMatch( /worker died during repair/ )
    expect( compareIndexColumns( built.columns, reference ) ).toEqual( [] )
  } )
} )


describe( 'N=1 really is the serial builder', () => {

  /** A model whose header does not parse. */
  const MALFORMED = new TextEncoder().encode(
      'ISO-10303-21;\nHEADER;\nFILE_DESCRIPTION(' )

  test( 'a malformed header at N=1 returns the serial result, never throws',
      async () => {

        // The shard-only header pre-scan used to run BEFORE the N=1
        // delegation, so this threw under fallbackToSerial: false — making
        // N=1 observably different from buildColumnarIndexStreaming, which
        // is the entire guarantee N=1 exists to provide.
        const serial = buildColumnarIndexStreaming(
            new BufferByteSource( MALFORMED ), PARSER, SMALL_POOL )

        for ( const fallbackToSerial of [ true, false ] ) {

          const built = await buildColumnarIndexShardedAsync(
              new BufferByteSource( MALFORMED ), PARSER, SMALL_POOL,
              { shardCount: 1, fallbackToSerial } )

          expect( built.result ).toBe( serial.result )
          expect( built.fellBackToSerial ).toBe( false )
          expect( built.shardCount ).toBe( 1 )
          expect( built.header ).toEqual( serial.header )
          expect( built.stats ).toEqual( serial.stats )
        }
      } )

  test( 'a derived N=1 on a small model also never reaches the header scan',
      async () => {

        // No explicit shardCount: the byte floor decides, and data/index.ifc
        // is far under it. Same guarantee, reached by the other route.
        const built = await buildColumnarIndexShardedAsync(
            new BufferByteSource( MALFORMED ), PARSER, SMALL_POOL,
            { fallbackToSerial: false } )

        expect( built.shardCount ).toBe( 1 )
        expect( built.fellBackToSerial ).toBe( false )
      } )
} )


describe( 'shard-count policy', () => {

  test( 'an explicit count is honoured exactly, byte floor and all', () => {
    expect( resolveShardCount( 1024, { shardCount: 4 } ) ).toBe( 4 )
    expect( resolveShardCount( 1024, { shardCount: 32 } ) ).toBe( 32 )
    expect( resolveShardCount( 1e12, { shardCount: 1 } ) ).toBe( 1 )
  } )

  test( 'a count below one is clamped up', () => {
    expect( resolveShardCount( 1e12, { shardCount: 0 } ) ).toBe( 1 )
    expect( resolveShardCount( 1e12, { shardCount: -3 } ) ).toBe( 1 )
  } )

  test( 'a derived count is 1 for anything under two shards of data', () => {
    // Under MIN_BYTES_PER_SHARD * 2 the fixed costs outweigh the split.
    expect( resolveShardCount( 0 ) ).toBe( 1 )
    expect( resolveShardCount( 4 * 1024 * 1024 ) ).toBe( 1 )
    expect( resolveShardCount( 8 * 1024 * 1024 - 1 ) ).toBe( 1 )
  } )

  test( 'a derived count respects the cap', () => {
    expect( resolveShardCount( 1e12, { maxShardCount: 2 } ) )
        .toBeLessThanOrEqual( 2 )
    expect( resolveShardCount( 1e12 ) )
        .toBeLessThanOrEqual( MAX_DERIVED_SHARD_COUNT )
    expect( resolveShardCount( 1e12 ) ).toBeGreaterThanOrEqual( 1 )
  } )
} )


describe( 'falling back to the serial build', () => {

  /**
   * The same fixture written without newlines between records — the known
   * limit of the line-anchored candidate scan.
   *
   * @return {Uint8Array} A single-line data section.
   */
  function singleLineModel(): Uint8Array {

    let body = ''

    for ( let index = 1; index <= 400; ++index ) {
      body += `#${index}=IFCPERSON($,$,'p${index}',$,$,$,$,$);`
    }

    return new TextEncoder().encode(
        `${HEADER}${body}ENDSEC;\nEND-ISO-10303-21;\n` )
  }

  test( 'a data section with no record heads on a line falls back, and says so',
      async () => {

        const bytes = singleLineModel()
        const reference = serialColumns( bytes, SMALL_POOL )

        const built = await buildColumnarIndexShardedAsync(
            new BufferByteSource( bytes ), PARSER, SMALL_POOL,
            { shardCount: 4 } )

        expect( built.fellBackToSerial ).toBe( true )
        expect( built.fallbackReason )
            .toMatch( /no usable record-boundary candidate/ )
        expect( built.shardCount ).toBe( 1 )

        // The fallback is a fallback, not a degradation: same index.
        expect( compareIndexColumns( built.columns, reference ) ).toEqual( [] )
      } )

  test( 'fallbackToSerial: false turns the same case into a throw',
      async () => {

        await expect( buildColumnarIndexShardedAsync(
            new BufferByteSource( singleLineModel() ), PARSER, SMALL_POOL,
            { shardCount: 4, fallbackToSerial: false } ) )
            .rejects.toThrow( /sharded index build failed/ )
      } )
} )
