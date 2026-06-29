import fs from 'fs'
import { describe, expect, test } from '@jest/globals'
import AP214StepParser from './ap214_step_parser'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ParseResult } from '../step/parsing/step_parser'
import {
  AP214ProductStructureExtraction,
  ProductStructureNode,
} from './ap214_product_structure_extraction'


const parser = AP214StepParser.Instance

/**
 * Parse the hermetic as1 assembly fixture and extract its product structure.
 *
 * @return {ProductStructureNode[]} The extracted assembly forest.
 */
function extractAs1Structure(): ProductStructureNode[] {

  const buffer = fs.readFileSync( 'data/as1-assembly.step' )
  const bufferInput = new ParsingBuffer( buffer )

  const headerResult = parser.parseHeader( bufferInput )[1]

  expect( headerResult ).toBe( ParseResult.COMPLETE )

  const [ result, model ] = parser.parseDataToModel( bufferInput )

  expect( model ).not.toBe( void 0 )
  expect(
      result === ParseResult.COMPLETE || result === ParseResult.INCOMPLETE ).toBe( true )

  return new AP214ProductStructureExtraction( model! ).extractProductStructure()
}

/**
 * Find a direct child of a node by display name.
 *
 * @param node The parent node.
 * @param name The child name to find.
 * @return {ProductStructureNode} The first matching child.
 */
function child( node: ProductStructureNode, name: string ): ProductStructureNode {

  const found = node.children.find( ( candidate ) => candidate.name === name )

  expect( found ).not.toBe( void 0 )

  return found!
}

/**
 * Names of the direct children of a node.
 *
 * @param node The parent node.
 * @return {string[]} The child names, in order.
 */
function childNames( node: ProductStructureNode ): string[] {
  return node.children.map( ( candidate ) => candidate.name )
}

const NUT_BOLT_ASSEMBLY_INSTANCE_COUNT = 3
const AS1_ROOT_CHILD_COUNT = 4

describe( 'AP214ProductStructureExtraction', () => {

  test( 'extracts a single named root for the as1 assembly', () => {

    const roots = extractAs1Structure()

    expect( roots.length ).toBe( 1 )
    expect( roots[0].name ).toBe( 'as1' )
    expect( roots[0].occurrencePath ).toEqual( [] )
  } )

  test( 'builds the nested nut/rod/bracket/plate hierarchy with names', () => {

    const root = extractAs1Structure()[0]

    expect( childNames( root ).sort() ).toEqual(
        [ 'l-bracket-assembly', 'l-bracket-assembly', 'plate', 'rod-assembly' ] )

    const rodAssembly = child( root, 'rod-assembly' )

    expect( childNames( rodAssembly ).sort() ).toEqual( [ 'nut', 'nut', 'rod' ] )

    const lBracketAssembly = child( root, 'l-bracket-assembly' )

    expect( childNames( lBracketAssembly ).sort() ).toEqual(
        [ 'l-bracket', 'nut-bolt-assembly', 'nut-bolt-assembly', 'nut-bolt-assembly' ] )

    const nutBoltAssembly = child( lBracketAssembly, 'nut-bolt-assembly' )

    expect( childNames( nutBoltAssembly ).sort() ).toEqual( [ 'bolt', 'nut' ] )
  } )

  test( 'gives repeated sub-assembly occurrences distinct nodes and paths', () => {

    const root = extractAs1Structure()[0]

    const lBracketAssemblies =
      root.children.filter( ( node ) => node.name === 'l-bracket-assembly' )

    // Two occurrences of the SAME product_definition: same part type id...
    expect( lBracketAssemblies.length ).toBe( 2 )
    expect( lBracketAssemblies[0].productDefinitionExpressID )
        .toBe( lBracketAssemblies[1].productDefinitionExpressID )

    // ...but distinct occurrence (NAUO) keys and distinct paths.
    expect( lBracketAssemblies[0].expressID )
        .not.toBe( lBracketAssemblies[1].expressID )
    expect( lBracketAssemblies[0].occurrencePath )
        .not.toEqual( lBracketAssemblies[1].occurrencePath )
  } )

  test( 'disambiguates a reused leaf part by full occurrence path', () => {

    const root = extractAs1Structure()[0]

    const lBracketAssemblies =
      root.children.filter( ( node ) => node.name === 'l-bracket-assembly' )

    const boltPaths = lBracketAssemblies.map( ( assembly ) => {
      const nutBoltAssembly = child( assembly, 'nut-bolt-assembly' )
      return child( nutBoltAssembly, 'bolt' ).occurrencePath
    } )

    // Same leaf NAUO id at the tail, but the path roots differ — exactly the
    // instancing case a scalar expressID cannot represent.
    expect( boltPaths[0] ).not.toEqual( boltPaths[1] )
    expect( boltPaths[0][boltPaths[0].length - 1] )
        .toBe( boltPaths[1][boltPaths[1].length - 1] )
    expect( boltPaths[0][0] ).not.toBe( boltPaths[1][0] )
  } )

  test( 'each nut-bolt-assembly occurrence has its own bolt and nut', () => {

    const root = extractAs1Structure()[0]
    const lBracketAssembly = child( root, 'l-bracket-assembly' )

    const nutBoltAssemblies =
      lBracketAssembly.children.filter( ( node ) => node.name === 'nut-bolt-assembly' )

    expect( nutBoltAssemblies.length ).toBe( NUT_BOLT_ASSEMBLY_INSTANCE_COUNT )

    for ( const nutBoltAssembly of nutBoltAssemblies ) {
      expect( childNames( nutBoltAssembly ).sort() ).toEqual( [ 'bolt', 'nut' ] )
    }
  } )

  test( 'links the root part to its shape representation', () => {

    const root = extractAs1Structure()[0]

    expect( root.shapeRepresentationIds.length ).toBeGreaterThan( 0 )
  } )

  test( 'root has the expected number of top-level occurrences', () => {

    const root = extractAs1Structure()[0]

    expect( root.children.length ).toBe( AS1_ROOT_CHILD_COUNT )
  } )
} )
