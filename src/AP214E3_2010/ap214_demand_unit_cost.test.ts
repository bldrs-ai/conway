/* eslint-disable no-magic-numbers */
import * as fs from 'fs'

import { describe, expect, test } from '@jest/globals'

import AP214StepParser from './ap214_step_parser'
import { AP214DemandUnitCost } from './ap214_demand_unit_cost'
import {
  advanced_brep_shape_representation,
  closed_shell,
  manifold_solid_brep,
  shape_representation,
} from './AP214E3_2010_gen/index'
import { ParseResult } from '../step/parsing/step_parser'
import ParsingBuffer from '../parsing/parsing_buffer'

/**
 * Parse a STEP fixture into an AP214 model.
 *
 * @param path The fixture.
 * @return {object} The model.
 */
function load( path: string ) {
  const parser = AP214StepParser.Instance
  const buffer = new ParsingBuffer( fs.readFileSync( path ) )

  expect( parser.parseHeader( buffer )[ 1 ] ).toBe( ParseResult.COMPLETE )

  const [ , model ] = parser.parseDataToModel( buffer )

  expect( model ).not.toBe( void 0 )

  return model!
}

describe( 'AP214DemandUnitCost', () => {

  test( 'a shell\'s count read off its record equals the cfs_faces getter', () => {

    // The count reads the field at the vtable address the generated getter
    // uses (1, 1, 2); this is what notices a regeneration that moves it.
    const model = load( 'data/nema-23-76mm.step' )
    const cost = new AP214DemandUnitCost()

    let shells = 0

    for ( const brep of model.types( manifold_solid_brep ) ) {
      const shell: closed_shell = brep.outer

      expect( cost.itemFaces( brep ) ).toBe( shell.cfs_faces.length )
      ++shells
    }

    expect( shells ).toBeGreaterThan( 0 )
  } )

  test( 'a representation\'s faces are its items\' faces, and an item range is a slice of them', () => {

    const model = load( 'data/nema-23-76mm.step' )
    const cost = new AP214DemandUnitCost()

    let checked = 0

    // Named explicitly: types() reads each class's own query, which a
    // supertype's does not extend to (see planDemandUnits_).
    for ( const rep of model.types(
        shape_representation, advanced_brep_shape_representation ) ) {
      const items = rep.items
      const perItem = items.map( ( item ) => cost.itemFaces( item ) )
      const whole = perItem.reduce( ( sum, faces ) => sum + faces, 0 )

      expect( cost.representationFaces( rep ) ).toBe( whole )

      if ( items.length > 1 && whole > 0 ) {
        expect( cost.representationFaces( rep, 1 ) ).toBe( whole - perItem[ 0 ] )
        ++checked
      }
    }

    expect( checked ).toBeGreaterThan( 0 )
  } )
} )
