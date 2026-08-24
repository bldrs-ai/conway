import fs from 'fs'
import { beforeAll, describe, expect, jest, test } from '@jest/globals'
import { ConwayGeometry } from '../../dependencies/conway-geom'
import ParsingBuffer from '../parsing/parsing_buffer'
import { IfcGeometryExtraction } from './ifc_geometry_extraction'
import IfcStepModel from './ifc_step_model'
import IfcStepParser from './ifc_step_parser'
import Logger from '../logging/logger'
import { IfcObjectDefinition, IfcProduct, IfcRelAggregates } from './ifc4_gen'


const conwayGeometry = new ConwayGeometry()

/** Wasm init plus two full extractions per test; CI runners are slow. */
// eslint-disable-next-line no-magic-numbers
const TEST_TIMEOUT_MS = 120 * 1000

/** Fixtures that carry at least one IfcRelAggregates. */
const AGGREGATE_FIXTURES = [
  'data/index.ifc',
  'data/aggregate_master_voids.ifc',
]

/** The STEP complex instance in data/aggregate_complex_related.ifc. */
const COMPLEX_PRODUCT_EXPRESS_ID = 300

/** The plain IfcBuildingElementPart in the same relationship. */
const PLAIN_PRODUCT_EXPRESS_ID = 200

/** The IfcGroup in the same relationship — a related object, not a product. */
const NON_PRODUCT_EXPRESS_ID = 400

/** conway's type ID for a STEP complex/external-mapping container. */
// eslint-disable-next-line no-magic-numbers
const EXTERNAL_MAPPING_CONTAINER_TYPE = 0

/**
 * Parse a fixture into a fresh model.
 *
 * @param fixturePath The IFC file to parse.
 * @return {IfcStepModel} The parsed model.
 */
function parseFixtureModel( fixturePath: string ): IfcStepModel {

  const parser = IfcStepParser.Instance
  const bufferInput = new ParsingBuffer( fs.readFileSync( fixturePath ) )

  parser.parseHeader( bufferInput )

  const model = parser.parseDataToModel( bufferInput )[ 1 ]

  expect( model ).toBeDefined()

  return model!
}

/**
 * Count the IfcProducts the rel-aggregates pass will extract — the related
 * objects of every IfcRelAggregates, which is one extraction each.
 *
 * @param model The model to count over.
 * @return {number} The number of related products.
 */
function relatedProductCount( model: IfcStepModel ): number {

  let count = 0

  for ( const relAggregate of model.types( IfcRelAggregates ) ) {

    for ( const relatedObject of relAggregate.RelatedObjects ) {

      if ( relatedObject instanceof IfcProduct ) {
        ++count
      }
    }
  }

  return count
}

beforeAll( async () => {
  await conwayGeometry.initialize()
} )

describe( 'rel-aggregates extraction (conway#549)', () => {

  test( 'suspends once per related product, not once per relationship', () => {

    // The tab-hang half of #549. The whole-model walk skips every aggregate
    // target in its product loop and does the real work in the
    // rel-aggregates pass, so a pass that suspends only between
    // RELATIONSHIPS gives a cooperative driver nothing to yield on: on
    // SKYLARK250 all 2,002 suspension points fire in 16 ms and the
    // remaining ~60 s runs inside two calls with none at all.
    //
    // Counted rather than merely "more than before", so this fails on a
    // pass that suspends per relationship AND on one that suspends at some
    // other granularity.
    for ( const fixturePath of AGGREGATE_FIXTURES ) {

      const model = parseFixtureModel( fixturePath )

      const products = model.typeCount( IfcProduct )
      const relationships = model.typeCount( IfcRelAggregates )
      const relatedProducts = relatedProductCount( model )

      expect( relationships ).toBeGreaterThan( 0 )
      expect( relatedProducts ).toBeGreaterThan( 0 )

      const extraction = new IfcGeometryExtraction( conwayGeometry, model )

      const ticks: [number, number][] = []

      extraction.extractIFCGeometryData(
          ( completed, total ) => ticks.push( [completed, total] ) )

      expect( ticks.length )
          .toBe( products + relationships + relatedProducts )

      // Still monotonic, still bounded by the total it reports.
      for ( let where = 1; where < ticks.length; ++where ) {
        expect( ticks[ where ][ 0 ] ).toBeGreaterThan( ticks[ where - 1 ][ 0 ] )
        expect( ticks[ where ][ 0 ] ).toBeLessThanOrEqual( ticks[ where ][ 1 ] )
      }
    }
  }, TEST_TIMEOUT_MS )

  test( 'does not leave the related-product array memoized on the relationship',
      () => {

        // The memory half of #549. `RelatedObjects` memoizes the
        // materialised entity array onto the relationship as
        // `RelatedObjects_`, and each of those products in turn memoizes the
        // tessellation subtree its getters walk — so a pass that reads the
        // getter keeps the whole model's face/loop/point graph alive for the
        // length of the relationship instead of one product at a time. On
        // SKYLARK250 that is 2.7 GB of a 5.4 GB peak.
        //
        // White-box on the generated field name deliberately: the retention
        // IS the field, and there is no black-box way to observe reachability
        // from a test. If codegen renames it, this test stops testing
        // anything, so it also asserts the field exists to be set.
        for ( const fixturePath of AGGREGATE_FIXTURES ) {

          const model = parseFixtureModel( fixturePath )
          const extraction = new IfcGeometryExtraction( conwayGeometry, model )

          extraction.extractIFCGeometryData()

          let checked = 0

          for ( const relAggregate of model.types( IfcRelAggregates ) ) {

            const memo =
              ( relAggregate as unknown as
                { RelatedObjects_?: unknown } ).RelatedObjects_

            expect( memo ).toBeUndefined()

            // Reading the getter must still populate it — i.e. the field is
            // the one the getter memoizes into, so the assertion above is
            // meaningful rather than vacuous.
            expect( relAggregate.RelatedObjects ).toBeDefined()
            expect(
                ( relAggregate as unknown as
                  { RelatedObjects_?: unknown } ).RelatedObjects_ )
                .toBeDefined()

            ++checked
          }

          expect( checked ).toBeGreaterThan( 0 )
        }
      }, TEST_TIMEOUT_MS )

  test( 'extracts a complex related product exactly once, from the aggregates pass',
      () => {

        // conway#566 unified the pager's product classification onto
        // relatedProductByExpressID_ but left aggregateTargetLocalIDs
        // reading the raw typeID column. A STEP complex
        // (external-mapping) instance is where the column and the pass
        // part company: the parser records the CONTAINER under type 0
        // (EXTERNALMAPPINGCONTAINER) and keeps the entity variants in
        // `multiMapping`, so the column says "not a product" while
        // getTypedElementByExpressID hands back the IfcProduct among
        // them.
        //
        // The consequence is milder than the paging divergence #566
        // fixed, and it is the reason this was left out of that scope: a
        // complex product is simply not deferred, so the product pass
        // extracts it AND the aggregates pass re-extracts it — one
        // product, two scene instances, the duplicate-draw class
        // aggregateTargetLocalIDs exists to prevent.
        //
        // Counted per product rather than asserted on meshes because
        // conway cannot currently build a complex product's geometry on
        // either path (both fail identically); which pass reaches it, and
        // how many times, is what the deferral set is answerable for.
        const model = parseFixtureModel( 'data/aggregate_complex_related.ifc' )

        const complexLocalID = model.resolveExpressID( COMPLEX_PRODUCT_EXPRESS_ID )
        const plainLocalID = model.resolveExpressID( PLAIN_PRODUCT_EXPRESS_ID )
        const groupLocalID = model.resolveExpressID( NON_PRODUCT_EXPRESS_ID )

        expect( complexLocalID ).toBeDefined()
        expect( plainLocalID ).toBeDefined()
        expect( groupLocalID ).toBeDefined()

        // A probe that never fires looks exactly like a clean model: the
        // fixture only means anything while the parser still records the
        // container under type 0 and the typed lookup still finds a
        // product among its variants.
        expect( model.typeIDOf( complexLocalID! ) )
            .toBe( EXTERNAL_MAPPING_CONTAINER_TYPE )
        expect( model.getTypedElementByLocalID( complexLocalID!, IfcObjectDefinition ) )
            .toBeInstanceOf( IfcProduct )

        const extraction = new IfcGeometryExtraction( conwayGeometry, model )

        // Pre-fix this set is [ #200 ] alone — the complex product is not
        // deferred, so the product loop does not skip it.
        const targets = extraction.aggregateTargetLocalIDs()

        expect( [ ...targets ].sort() )
            .toEqual( [ plainLocalID, complexLocalID ].sort() )
        expect( targets ).not.toContain( groupLocalID )

        // Count every product the walk extracts, both passes. Wrapping the
        // shared per-product body is the only seam that sees both.
        const extracted: number[] = []
        const extractProductGeometry =
          extraction.extractProductGeometry.bind( extraction )

        extraction.extractProductGeometry = (
            product: IfcProduct,
            precomputedRelVoids?: Parameters<
              IfcGeometryExtraction[ 'extractProductGeometry' ] >[ 1 ] ) => {

          extracted.push( product.localID )

          extractProductGeometry( product, precomputedRelVoids )
        }

        // Diverted and asserted rather than silenced: conway cannot build
        // a complex product's geometry, so the aggregates pass throws into
        // its own permissive catch on #300 and logs once. That is the
        // pre-existing limitation this test deliberately does not depend
        // on — but an unexpected SECOND relationship failure would
        // otherwise hide here, and the log is the only place it surfaces.
        const errors = jest.spyOn( Logger, 'error' ).mockImplementation( () => {} )

        let logged: unknown[][]

        try {
          extraction.extractIFCGeometryData()
        } finally {
          // Snapshot before restoring: mockRestore() resets the recorded
          // calls, so asserting on `errors` afterwards passes vacuously.
          logged = errors.mock.calls.map( ( call ) => [ ...call ] )

          errors.mockRestore()
        }

        expect( logged.length ).toBe( 1 )
        expect( logged[ 0 ][ 0 ] ).toContain( 'Error processing relAggregate' )

        // Pre-fix: [ assembly, complex, plain, complex ] — the complex
        // product appears twice, from both passes.
        const complexExtractions =
          extracted.filter( ( localID ) => localID === complexLocalID ).length

        expect( complexExtractions ).toBe( 1 )

        // The deferred pair are extracted after the product loop has
        // finished, i.e. by the aggregates pass and not by the product
        // pass. The IfcElementAssembly (#100, the relating object) is the
        // only product the first loop is left with.
        expect( extracted.indexOf( complexLocalID! ) )
            .toBeGreaterThan( extracted.indexOf( plainLocalID! ) )
        expect( extracted.filter(
            ( localID ) => localID === plainLocalID ).length ).toBe( 1 )
        expect( extracted ).not.toContain( groupLocalID )
      }, TEST_TIMEOUT_MS )
} )
