#!/usr/bin/env node
/**
 * Occurrence-identity report for a STEP (AP214/AP242) model.
 *
 * Answers "does a click select one thing?" — the pair of properties Share's
 * per-occurrence selection rests on:
 *
 *  1. every geometry instance in the scene carries an occurrence path, and
 *  2. that path is the path of a node in the product-structure tree.
 *
 * Both halves are emitted by conway and neither is checkable from one of them
 * alone, which is how BLSN_007 shipped with 1,884 hull bodies placed 308 times
 * each under two shared paths (conway#628 / test-models-private#98): the tree
 * looked fine (one product), the scene looked fine (real meshes), and only
 * comparing them showed 698,544 placements for 2,268 bodies.
 *
 * Usage:
 *
 *   node scripts/debug/occurrence_report.mjs model.stp [--paths N] [--json]
 *
 * Needs a built tree (`yarn build-incremental`), and the geometry wasm — it
 * runs the real extraction, so a large model wants
 * `node --max-old-space-size=8000`.
 *
 * Reads, in order:
 *
 *   geometry nodes      total scene geometry nodes (a solid plus, when the
 *                       exporter styles faces individually, that solid's face
 *                       children — those legitimately share their solid's path)
 *   distinct paths      how many selections those nodes resolve to; far below
 *                       the body count means bodies are sharing a selection
 *   duplicate paths     the worst offenders, with their multiplicity
 *   tree leaves         leaf nodes of getSpatialStructure
 *   path equality       leaf paths vs body paths as multisets — the invariant
 *                       ap214_occurrence_geometry.test.ts pins on as1
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const HERE = path.dirname( fileURLToPath( import.meta.url ) )
const COMPILED = path.resolve( HERE, '../../compiled' )

const DEFAULT_PATHS_SHOWN = 10

/**
 * Parse argv into a small options record.
 *
 * @param {string[]} argv Raw arguments after the script name.
 * @return {{model: string, top: number, json: boolean}} Parsed options.
 */
function parseArgs( argv ) {

  const options = { model: void 0, top: DEFAULT_PATHS_SHOWN, json: false }

  for ( let index = 0; index < argv.length; ++index ) {

    const argument = argv[ index ]

    if ( argument === '--json' ) {
      options.json = true
    } else if ( argument === '--paths' ) {
      options.top = Number( argv[ ++index ] )
    } else {
      options.model = argument
    }
  }

  return options
}

const options = parseArgs( process.argv.slice( 2 ) )

if ( options.model === void 0 ) {
  console.error( 'usage: occurrence_report.mjs model.stp [--paths N] [--json]' )
  process.exit( 1 )
}

const { default: AP214StepParser } =
  await import( `${COMPILED}/src/AP214E3_2010/ap214_step_parser.js` )
const { default: ParsingBuffer } =
  await import( `${COMPILED}/src/parsing/parsing_buffer.js` )
const { AP214GeometryExtraction } =
  await import( `${COMPILED}/src/AP214E3_2010/ap214_geometry_extraction.js` )
const { AP214Properties } =
  await import( `${COMPILED}/src/compat/web-ifc/ap214_properties.js` )
const { ConwayGeometry } =
  await import( `${COMPILED}/dependencies/conway-geom/index.js` )

const started = Date.now()
const parser = AP214StepParser.Instance
const buffer = new ParsingBuffer( fs.readFileSync( options.model ) )

parser.parseHeader( buffer )

const [ , model ] = parser.parseDataToModel( buffer )

if ( model === void 0 ) {
  console.error( `could not parse ${options.model} as AP214` )
  process.exit( 1 )
}

const conwayGeometry = new ConwayGeometry()

await conwayGeometry.initialize()

const [ , scene ] = new AP214GeometryExtraction( conwayGeometry, model ).extractAP214GeometryData()

// A per-face styled export gives each face its own scene node under its
// solid's node; those inherit the solid's path by design (they ARE that
// solid), so they are counted but excluded from the body-level comparison.
const faceChildLocalIDs = new Set()

for ( const [ , node ] of scene.scene_?.entries?.() ?? [] ) {
  for ( const childLocalID of model.geometry?.getChildrenByLocalID?.( node.localID ) ?? [] ) {
    faceChildLocalIDs.add( childLocalID )
  }
}

let geometryNodes = 0
const bodyPaths = []
const pathCounts = new Map()

for ( const node of scene.scene_ ?? [] ) {

  if ( node.occurrencePath === void 0 || model.geometry?.getByLocalID( node.localID ) === void 0 ) {
    continue
  }

  ++geometryNodes

  const key = JSON.stringify( node.occurrencePath )

  pathCounts.set( key, ( pathCounts.get( key ) ?? 0 ) + 1 )

  if ( !faceChildLocalIDs.has( node.localID ) ) {
    bodyPaths.push( key )
  }
}

const properties = new AP214Properties( { StepModel: model } )
const root = await properties.getSpatialStructure()

let treeNodes = 0
const leafPaths = []
const walkTree = ( node ) => {

  ++treeNodes

  const children = node.children ?? []

  if ( children.length === 0 ) {
    leafPaths.push( JSON.stringify( node.occurrencePath ) )
  }

  children.forEach( walkTree )
}

walkTree( root )

const duplicates = [ ...pathCounts.entries() ]
    .filter( ( [ , count ] ) => count > 1 )
    .sort( ( a, b ) => b[1] - a[1] )

const sortedBodies = bodyPaths.slice().sort()
const sortedLeaves = leafPaths.slice().sort()
const pathsMatch = sortedBodies.length === sortedLeaves.length &&
  sortedBodies.every( ( value, index ) => value === sortedLeaves[ index ] )

const report = {
  model: options.model,
  loadMs: Date.now() - started,
  geometryNodes,
  bodyNodes: bodyPaths.length,
  distinctPaths: pathCounts.size,
  duplicatePaths: duplicates.length,
  maxPathMultiplicity: duplicates.length > 0 ? duplicates[0][1] : 1,
  treeNodes,
  treeLeaves: leafPaths.length,
  bodyPathsEqualTreeLeafPaths: pathsMatch,
}

if ( options.json ) {
  console.log( JSON.stringify( { ...report, topDuplicates: duplicates.slice( 0, options.top ) }, null, 2 ) )
} else {

  console.log( `# ${options.model}` )
  console.log( `  loaded in ${report.loadMs} ms` )
  console.log( `  geometry nodes ${geometryNodes} (${bodyPaths.length} bodies, ` +
    `${geometryNodes - bodyPaths.length} face children)` )
  console.log( `  distinct occurrence paths ${pathCounts.size}` )
  console.log( `  tree nodes ${treeNodes}, leaves ${leafPaths.length}` )
  console.log( `  body paths == tree leaf paths: ${pathsMatch}` )

  if ( duplicates.length > 0 ) {

    console.log( `\n## paths shared by more than one geometry node (${duplicates.length})` )

    for ( const [ key, count ] of duplicates.slice( 0, options.top ) ) {
      console.log( `  ${String( count ).padStart( 8 )}x  ${key}` )
    }

    if ( duplicates.length > options.top ) {
      console.log( `  ... ${duplicates.length - options.top} more` )
    }
  }
}
