import fs from 'fs'
import { describe, expect, test } from '@jest/globals'

import IfcStepParser from '../ifc/ifc_step_parser'
import {
  IfcAxis2Placement3D,
  IfcCartesianPoint,
  IfcDirection,
  IfcGeometricRepresentationContext,
  IfcGeometricRepresentationSubContext,
  IfcGridAxis,
  IfcObjectDefinition,
  IfcPoint,
  IfcProduct,
  IfcRepresentationItem,
} from '../ifc/ifc4_gen'
import IfcStepExternalMapping from '../ifc/ifc_step_external_mapping'
import IfcStepModel from '../ifc/ifc_step_model'
import ParsingBuffer from '../parsing/parsing_buffer'
import { MISTYPED_VALUE_MESSAGE } from './dangling_reference_error'


/**
 * conway#606: `StepModelBase.getTypedElementByLocalID` read the memoized
 * entity and then guarded only on the memo being EMPTY, so a memo hit
 * returned the cached object through its `as O` cast without ever testing
 * it against the requested type. Any earlier read of the record — an
 * untyped one included — populates that memo, so the second, typed reader
 * of a record got a silently wrong-typed object back.
 *
 * Every test here runs with `elementMemoization` at its default `true` and
 * asserts the memo is actually live before asserting anything about it
 * (`expectMemoized`). That is not ceremony: extraction turns memoization
 * OFF for `lowMemoryMode` and for buffers over `MEMOIZATION_THRESHOLD`, so
 * this defect is a small-and-medium-model one, and a test written with
 * memoization off passes vacuously against the unfixed code — the memo
 * path it is aimed at never runs.
 */

const HEADER =
  'ISO-10303-21;\nHEADER;\n' +
  'FILE_DESCRIPTION((\'\'),\'2;1\');\n' +
  'FILE_NAME(\'d.ifc\',\'2026-01-01T00:00:00\',(\'\'),(\'\'),\'\',\'\',\'\');\n' +
  'FILE_SCHEMA((\'IFC4\'));\nENDSEC;\nDATA;\n'

const FOOTER = 'ENDSEC;\nEND-ISO-10303-21;\n'

/** The STEP complex instance in data/aggregate_complex_related.ifc. */
const COMPLEX_PRODUCT_EXPRESS_ID = 300

/** `MISTYPED_LOCATION`'s plain context record — see its doc. */
const SUPERTYPE_RECORD_EXPRESS_ID = 4

/** `DEGENERATE_COMPLEX`'s empty complex instance — see its doc. */
const DEGENERATE_COMPLEX_EXPRESS_ID = 5

/**
 * `#1`'s Location is declared `IfcCartesianPoint` and points at `#2`,
 * which is an `IfcDirection` — an indexed record of the wrong type, the
 * shape the issue observed as an `IfcVirtualGridIntersection` axis
 * resolving to the geometric context's origin point.
 *
 * `#3` is a well-typed point so the same file can also show the fix does
 * not break the resolution that is supposed to succeed.
 *
 * `#4` is a plain `IfcGeometricRepresentationContext` — a record whose
 * schema type is a strict SUPERTYPE of a type callers ask for
 * (`IfcGeometricRepresentationSubContext`). That pairing is the one that
 * changes a real caller's answer; see the test that uses it.
 */
const MISTYPED_LOCATION = new TextEncoder().encode(
    `${HEADER}#1=IFCAXIS2PLACEMENT3D(#2,$,$);\n` +
    '#2=IFCDIRECTION((0.,0.,1.));\n' +
    '#3=IFCCARTESIANPOINT((0.,0.,0.));\n' +
    '#4=IFCGEOMETRICREPRESENTATIONCONTEXT($,\'Model\',3,1.0E-05,#1,$);\n' + FOOTER )


/**
 * A degenerate STEP complex instance: `#5=();`. The parser mints type 0
 * (`EXTERNALMAPPINGCONTAINER`) for a complex instance and normally attaches
 * a `multiMapping`, but with no variants to record it leaves that undefined
 * — which routes the record through the SINGLE-entity path instead of the
 * multi-mapping branch. Not valid ISO-10303-21; conway parses it anyway,
 * which is the point.
 */
const DEGENERATE_COMPLEX = new TextEncoder().encode(
    `${HEADER}#3=IFCCARTESIANPOINT((0.,0.,0.));\n` +
    '#5=();\n' + FOOTER )


/**
 * Parse a buffer into a model.
 *
 * @param bytes The IFC file to parse.
 * @return {IfcStepModel} The parsed model.
 */
function parseModel( bytes: Uint8Array ): IfcStepModel {

  const parser = IfcStepParser.Instance
  const bufferInput = new ParsingBuffer( bytes )

  parser.parseHeader( bufferInput )

  const model = parser.parseDataToModel( bufferInput )[ 1 ]

  expect( model ).toBeDefined()

  return model!
}


/**
 * Parse a fixture file on disk into a model.
 *
 * @param fixturePath The IFC file to parse.
 * @return {IfcStepModel} The parsed model.
 */
function parseFixture( fixturePath: string ): IfcStepModel {

  return parseModel( fs.readFileSync( fixturePath ) )
}


/**
 * Establish that the record is genuinely held in the element memo, so the
 * assertions that follow exercise the memo-hit path rather than passing
 * because every lookup reconstructs.
 *
 * Referential equality across two untyped reads is the black-box form of
 * "`element.entity` is populated": the model's own doc says referential
 * equality is guaranteed only while memoization is on, so it is exactly
 * the observable that distinguishes the two states.
 *
 * @param model The model holding the record.
 * @param localID The record to check.
 */
function expectMemoized( model: IfcStepModel, localID: number ): void {

  expect( model.elementMemoization ).toBe( true )
  expect( model.getElementByLocalID( localID ) )
      .toBe( model.getElementByLocalID( localID ) )
}


describe( 'typed lookup of a memoized element (conway#606)', () => {

  test( 'a memo hit is rejected when the memo holds a different type', () => {

    const model = parseModel( MISTYPED_LOCATION )

    const localID = model.resolveExpressID( 2 )

    expect( localID ).toBeDefined()

    // The untyped read the issue describes: something else in the parse
    // materialises the record first, under the model's own type for it.
    expect( model.getElementByLocalID( localID! ) )
        .toBeInstanceOf( IfcDirection )

    expectMemoized( model, localID! )

    // Pre-fix this hands back the IfcDirection: the type guard sat inside
    // `if (entity === void 0)`, so a populated memo skipped it entirely.
    expect( model.getTypedElementByLocalID( localID!, IfcGridAxis ) )
        .toBeUndefined()
    expect( model.getTypedElementByLocalID( localID!, IfcCartesianPoint ) )
        .toBeUndefined()
  } )

  test( 'a memo hit is rejected the same way through the express-ID path', () => {

    const model = parseModel( MISTYPED_LOCATION )

    // Populate the memo through the TYPED getter with the record's true
    // type, rather than the untyped one — the memo does not record what
    // the caller asked for, so either populator reproduces this.
    expect( model.getTypedElementByExpressID( 2, IfcDirection ) )
        .toBeInstanceOf( IfcDirection )

    expectMemoized( model, model.resolveExpressID( 2 )! )

    expect( model.getTypedElementByExpressID( 2, IfcCartesianPoint ) )
        .toBeUndefined()
  } )

  test( 'a memo hit still resolves for the record\'s own type and supertypes', () => {

    const model = parseModel( MISTYPED_LOCATION )

    const localID = model.resolveExpressID( 3 )!

    const first = model.getElementByLocalID( localID )

    expect( first ).toBeInstanceOf( IfcCartesianPoint )

    expectMemoized( model, localID )

    // Referential equality, not merely "an IfcCartesianPoint": the fix
    // must validate the memo, not evict and rebuild it. Every supertype
    // hop the schema's own construct-path check would accept
    // (`type === constructorRead || constructorRead.prototype instanceof
    // type`) has to keep accepting, or the fix has broken resolution for
    // the reads that are supposed to succeed.
    expect( model.getTypedElementByLocalID( localID, IfcCartesianPoint ) )
        .toBe( first )
    expect( model.getTypedElementByLocalID( localID, IfcPoint ) )
        .toBe( first )
    expect( model.getTypedElementByLocalID( localID, IfcRepresentationItem ) )
        .toBe( first )

    // ...and a type that is neither the record's own nor an ancestor of it
    // still does not.
    expect( model.getTypedElementByLocalID( localID, IfcDirection ) )
        .toBeUndefined()
  } )

  test( 'a mistyped reference field throws untagged instead of yielding the wrong entity',
      () => {

        // The end-to-end consequence, and the reason this matters beyond a
        // confusing stack: conway#546/#605 rest on "absent record →
        // DanglingReferenceError (retryable), indexed-but-wrong-type →
        // untagged Error (never retried)". That discrimination assumes the
        // typed getter REJECTS a wrong-typed record. On a memo hit it did
        // not reject — it returned success — so the untagged arm was
        // unreachable and the caller got an IfcDirection where its own
        // declared type says IfcCartesianPoint.
        //
        // The issue notes this interaction was reasoned from the code and
        // never demonstrated. This is the demonstration.
        const model = parseModel( MISTYPED_LOCATION )

        // The earlier untyped read. Without it the memo is cold and the
        // construct-path guard already rejects #2, which is why the defect
        // is invisible to a test that touches the placement first.
        expect( model.getElementByExpressID( 2 ) ).toBeInstanceOf( IfcDirection )

        expectMemoized( model, model.resolveExpressID( 2 )! )

        const placement =
          model.getElementByExpressID( 1 ) as IfcAxis2Placement3D

        expect( placement ).toBeInstanceOf( IfcAxis2Placement3D )

        // Pre-fix: no throw at all, and `Location` is an IfcDirection.
        expect( () => placement.Location ).toThrow( MISTYPED_VALUE_MESSAGE )
      } )

  test( 'a supertype memo no longer satisfies a request for a subtype', () => {

    // The direction that changes a live caller's answer, and the one the
    // blast-radius audit turns on. AP214's assembly-tree walk reads a
    // `representation_relationship`'s `rep_1`/`rep_2` — declared
    // `representation` — which memoizes the record, and then asks the same
    // local ID for `shape_representation`, a strict SUBTYPE. Pre-fix the
    // memo hit handed the plain representation back and the walk computed
    // a unit scale off it; post-fix that lookup answers `undefined`.
    //
    // IfcGeometricRepresentationContext / ...SubContext is the same
    // relationship in IFC and is checkable without an AP214 fixture: the
    // record IS the supertype and IS NOT the subtype, so `undefined` is
    // the correct answer and the cold construct path has always given it.
    const model = parseModel( MISTYPED_LOCATION )

    const localID = model.resolveExpressID( SUPERTYPE_RECORD_EXPRESS_ID )!

    const context = model.getElementByLocalID( localID )

    expect( context ).toBeInstanceOf( IfcGeometricRepresentationContext )
    expect( context ).not.toBeInstanceOf( IfcGeometricRepresentationSubContext )

    expectMemoized( model, localID )

    expect( model.getTypedElementByLocalID( localID, IfcGeometricRepresentationContext ) )
        .toBe( context )
    expect( model.getTypedElementByLocalID( localID, IfcGeometricRepresentationSubContext ) )
        .toBeUndefined()
  } )

  test( 'the one record whose memo is not built from schema.constructors', () => {

    // The single place a memo hit and a memo miss can still disagree, and
    // the reason it is documented in the source rather than left silent.
    // `getElementByLocalID` builds a type-0 record from `externalMappingType`
    // while the construct path reads `schema.constructors[ 0 ]`, which is
    // `undefined` — so cold answers `undefined` where warm answers the
    // mapping object.
    //
    // What matters is the SCOPE of that divergence: it needs a `type`
    // argument of `StepEntityBase` or the external-mapping class itself,
    // which no generated getter passes. For every schema type a caller can
    // name, both answers are `undefined`, and that is what keeps the fix's
    // guarantee intact. Asserted both ways so a future change that widens
    // the divergence to a schema type fails here.
    const localIDOf = ( model: IfcStepModel ) =>
      model.resolveExpressID( DEGENERATE_COMPLEX_EXPRESS_ID )!

    const cold = parseModel( DEGENERATE_COMPLEX )
    const warm = parseModel( DEGENERATE_COMPLEX )

    expect( warm.getElementByLocalID( localIDOf( warm ) ) )
        .toBeInstanceOf( IfcStepExternalMapping )

    // The documented divergence, pinned rather than assumed.
    expect( cold.getTypedElementByLocalID( localIDOf( cold ), IfcStepExternalMapping ) )
        .toBeUndefined()
    expect( warm.getTypedElementByLocalID( localIDOf( warm ), IfcStepExternalMapping ) )
        .toBeInstanceOf( IfcStepExternalMapping )

    // ...and the guarantee that survives it: no schema type gets an object.
    for ( const schemaType of [ IfcCartesianPoint, IfcProduct, IfcObjectDefinition ] ) {
      expect( cold.getTypedElementByLocalID( localIDOf( cold ), schemaType ) )
          .toBeUndefined()
      expect( warm.getTypedElementByLocalID( localIDOf( warm ), schemaType ) )
          .toBeUndefined()
    }
  } )

  test( 'the multi-mapping path is unchanged', () => {

    // The complex/multi-mapped instance the issue asks to be confirmed
    // before settling on `instanceof`. It never reaches the single-entity
    // memo at all — a record with a `multiMapping` returns from the branch
    // above it, which has always filtered its variants with `instanceof`.
    // Pinned here so a fix that unified the two paths has to notice.
    const model = parseFixture( 'data/aggregate_complex_related.ifc' )

    const localID = model.resolveExpressID( COMPLEX_PRODUCT_EXPRESS_ID )!

    // Materialise it untyped first, exactly as the single-entity cases do.
    expect( model.getElementByLocalID( localID ) ).toBeDefined()

    expect( model.getTypedElementByLocalID( localID, IfcObjectDefinition ) )
        .toBeInstanceOf( IfcProduct )
    expect( model.getTypedElementByLocalID( localID, IfcCartesianPoint ) )
        .toBeUndefined()
  } )
} )
