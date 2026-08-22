import fs from 'fs'
import { beforeAll, describe, expect, test } from '@jest/globals'
import { ConwayGeometry } from '../../dependencies/conway-geom'
import ParsingBuffer from '../parsing/parsing_buffer'
import { IfcGeometryExtraction } from './ifc_geometry_extraction'
import IfcStepModel from './ifc_step_model'
import IfcStepParser from './ifc_step_parser'
import { IfcProduct, IfcRelAggregates } from './ifc4_gen'


const conwayGeometry = new ConwayGeometry()

/** Wasm init plus two full extractions per test; CI runners are slow. */
// eslint-disable-next-line no-magic-numbers
const TEST_TIMEOUT_MS = 120 * 1000

/** Fixtures that carry at least one IfcRelAggregates. */
const AGGREGATE_FIXTURES = [
  'data/index.ifc',
  'data/aggregate_master_voids.ifc',
]

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
} )
