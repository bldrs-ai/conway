import fs from 'fs'
import { describe, expect, test, beforeAll } from '@jest/globals'
import { AP214GeometryExtraction } from './ap214_geometry_extraction'
import { AP214SceneBuilder } from './ap214_scene_builder'
import { ParseResult } from '../step/parsing/step_parser'
import AP214StepParser from './ap214_step_parser'
import ParsingBuffer from '../parsing/parsing_buffer'
import Logger, { LogLevelName } from '../logging/logger'
import { ConwayGeometry } from '../../dependencies/conway-geom'
import { ExtractResult } from '../core/shared_constants'
import { shape_representation_relationship } from './AP214E3_2010_gen/shape_representation_relationship.gen'

/**
 * One unbound solids representation (#420, no SDR of its own) reachable
 * from TWO directly SDR-bound representations with DIFFERENT PDS owners
 * (#400/PDS#401/"partA", #410/PDS#411/"partB"), via two independent plain
 * SHAPE_REPRESENTATION_RELATIONSHIPs (#421, #422) — the shape conway#597's
 * review flagged: resolving from each edge's own target in isolation
 * returns that target's PDS every time, so whichever edge is processed
 * LAST silently overwrites the earlier edge's ownerOverrideByRepLocalID
 * entry, bypassing the equidistant-multiple-PDS refusal and making
 * selection depend on relationship iteration order rather than genuinely
 * refusing the ambiguity.
 */
const FIXTURE = 'data/ap214-ambiguous-srr-owner.step'

let scene: AP214SceneBuilder
let lines: { level: LogLevelName, message: string }[]

beforeAll( async () => {

  const parser = AP214StepParser.Instance
  const buffer = new ParsingBuffer( fs.readFileSync( FIXTURE ) )

  expect( parser.parseHeader( buffer )[1] ).toBe( ParseResult.COMPLETE )

  const [ , parsed ] = parser.parseDataToModel( buffer )

  expect( parsed ).not.toBe( void 0 )

  const conwayGeometry = new ConwayGeometry()

  expect( await conwayGeometry.initialize() ).toBe( true )

  lines = []
  Logger.clearLogs()
  Logger.setSink( ( level, message ) => {
    lines.push( { level, message } )
  } )

  let result: ExtractResult

  try {
    [ result, scene ] =
      new AP214GeometryExtraction( conwayGeometry, parsed! ).extractAP214GeometryData()
  } finally {
    Logger.setSink()
    Logger.clearLogs()
  }

  expect( result ).toBe( ExtractResult.COMPLETE )
} )


describe( 'a source representation with two equidistant SDR-bound owners (conway#597 review)', () => {

  test( 'neither owner is silently chosen - both fall back to their own relationship', () => {

    const owners = [ ...scene.geometryOccurrences() ]
        .map( ( [ owner ] ) => owner )
        .filter( ( owner ) => owner !== void 0 )

    expect( owners.length ).toBeGreaterThan( 0 )

    // The bug this pins: with per-edge target-only resolution, EVERY
    // occurrence here would have owner = whichever PDS the LAST-processed
    // edge's target carried (#401 or #411) - a single value, chosen by
    // relationship iteration order rather than by genuine disambiguation.
    // The fix refuses per source instead, so each occurrence keeps ITS
    // OWN edge's relationship as a fallback owner: no PDS leaks through,
    // and (see the next test) the two occurrences don't collapse onto one
    // arbitrarily-picked owner.
    for ( const owner of owners ) {
      expect( owner ).toBeInstanceOf( shape_representation_relationship )
    }
  } )

  test( 'the two occurrences keep their own distinct relationship, not one shared owner', () => {

    const ownerExpressIDs = [ ...scene.geometryOccurrences() ]
        .map( ( [ owner ] ) => owner?.expressID )
        .filter( ( id ) => id !== void 0 )

    expect( new Set( ownerExpressIDs ).size ).toBeGreaterThan( 1 )
  } )

  test( 'the ambiguity is reported once, not silently resolved', () => {

    const ambiguityWarnings = lines.filter( ( line ) =>
      line.level === 'warning' &&
      line.message.includes( 'no SDR-bound representation reachable' ) &&
      line.message.includes( 'ambiguously' ) )

    // Exactly once: the source is resolved (and, on ambiguity, warned
    // about) a single time regardless of how many edges reach it - a
    // regression that re-resolves per edge would either miss the warning
    // (if it silently picks one owner) or repeat it once per edge.
    expect( ambiguityWarnings.length ).toBe( 1 )
  } )
} )
