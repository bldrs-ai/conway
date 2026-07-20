/* eslint-disable no-magic-numbers, @typescript-eslint/no-explicit-any */
// Phase B2: per-product demand extraction must produce the same meshes the
// whole-model walk produces — same products with geometry, same vertex and
// index counts per product — since both now run the same deduplicated
// per-product body (extractProductGeometry).
import fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import { IfcGeometryExtraction } from './ifc_geometry_extraction'
import { ParseResult } from '../step/parsing/step_parser'
import IfcStepParser from './ifc_step_parser'
import IfcStepModel from './ifc_step_model'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ConwayGeometry } from '../../dependencies/conway-geom'
import { ExtractResult } from '../core/shared_constants'
import { IfcProduct } from './ifc4_gen'

let conwayGeometry: ConwayGeometry

/**
 * Parse a fresh model from index.ifc (models are stateful; each extraction
 * mode gets its own).
 *
 * @return {IfcStepModel} The parsed model.
 */
function freshModel(): IfcStepModel {
  const bytes: Buffer = fs.readFileSync( 'data/index.ifc' )
  const input = new ParsingBuffer( bytes )

  expect( IfcStepParser.Instance.parseHeader( input )[ 1 ] )
      .toBe( ParseResult.COMPLETE )

  const [ , model ] = IfcStepParser.Instance.parseDataToModel( input )

  expect( model ).toBeDefined()
  return model as IfcStepModel
}

/**
 * Collect per-localID mesh signatures (vertex + triangle counts) from a
 * model's extracted geometry.
 *
 * @param extraction The extraction whose model geometry to summarise.
 * @return {Map<number, string>} localID → "vertexCount/triangleCount".
 */
function meshSignatures( extraction: IfcGeometryExtraction ): Map<number, string> {

  const signatures = new Map<number, string>()

  for ( const mesh of extraction.model.geometry ) {

    const geometry = ( mesh as any ).geometry

    if ( geometry === void 0 || typeof geometry.getVertexCount !== 'function' ) {
      continue
    }

    signatures.set(
        ( mesh as any ).localID,
        `${geometry.getVertexCount()}/${geometry.getTriangleCount()}` )
  }

  return signatures
}

beforeAll( async () => {
  conwayGeometry = new ConwayGeometry()
  expect( await conwayGeometry.initialize() ).toBe( true )
} )

describe( 'per-product demand extraction (Phase B2)', () => {

  test( 'demand extraction over all products matches the whole-model walk', () => {

    // Whole-model walk (the CI-anchored path).
    const wholeExtraction =
      new IfcGeometryExtraction( conwayGeometry, freshModel() )

    expect( wholeExtraction.extractIFCGeometryData()[ 0 ] )
        .toBe( ExtractResult.COMPLETE )

    const wholeSignatures = meshSignatures( wholeExtraction )
    expect( wholeSignatures.size ).toBeGreaterThan( 0 )

    // Demand path: prepare once, then extract every product individually.
    const demandModel = freshModel()
    const demandExtraction =
      new IfcGeometryExtraction( conwayGeometry, demandModel )

    demandExtraction.prepareDemandExtraction()

    let extractedProducts = 0

    for ( const product of demandModel.types( IfcProduct ) ) {
      if ( demandExtraction.extractProductGeometryByLocalID( product.localID ) ) {
        ++extractedProducts
      }
    }

    expect( extractedProducts ).toBeGreaterThan( 0 )

    const demandSignatures = meshSignatures( demandExtraction )

    // Same set of products with geometry, same mesh shape per product.
    expect( demandSignatures ).toEqual( wholeSignatures )
  } )

  test( 'a single product extracts on demand without the whole-model walk', () => {

    // Whole-model reference signatures (mesh localIDs key representation
    // items, not products — so parity is checked per matching key).
    const reference = new IfcGeometryExtraction( conwayGeometry, freshModel() )
    reference.extractIFCGeometryData()
    const referenceSignatures = meshSignatures( reference )

    const model = freshModel()
    const extraction = new IfcGeometryExtraction( conwayGeometry, model )

    // Extract single products on the fresh model until one yields a mesh —
    // proving a lone product materialises without the whole-model walk.
    let produced = 0

    for ( const product of model.types( IfcProduct ) ) {
      extraction.extractProductGeometryByLocalID( product.localID )
      produced = meshSignatures( extraction ).size

      if ( produced > 0 ) {
        break
      }
    }

    expect( produced ).toBeGreaterThan( 0 )
    expect( produced ).toBeLessThan( referenceSignatures.size )

    // Every mesh the single extraction produced matches the reference's
    // mesh for the same key exactly.
    for ( const [ localID, signature ] of meshSignatures( extraction ) ) {
      expect( referenceSignatures.get( localID ) ).toBe( signature )
    }
  } )

  test( 'a non-product local ID is refused', () => {

    const model = freshModel()
    const extraction = new IfcGeometryExtraction( conwayGeometry, model )

    // localID 0 in index.ifc is not an IfcProduct (first record is a root
    // non-product entity in this fixture; the assertion below guards that).
    const first = model.getElementByLocalID( 0 )
    expect( first instanceof IfcProduct ).toBe( false )

    expect( extraction.extractProductGeometryByLocalID( 0 ) ).toBe( false )
  } )
} )
