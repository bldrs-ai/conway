/**
 * The model's aggregate structure, which is what actually decides a product's
 * shard on an assembly-heavy model (conway#640).
 *
 * `m3_shard_divergence.mjs` records each product's OWN dispatch key. For a
 * product the pump reaches only through the rel-aggregates pass — 96.6 % of
 * one model's placements — that key is not how it is dispatched. The pump
 * skips aggregate targets in the product worklist entirely
 * (`collectDemandCandidates_`) and extracts them from the aggregates
 * worklist, which is keyed by `relatingLocalIDOf` — the aggregate's RELATING
 * OBJECT. So the shard that builds such a product is
 * `shardOfDispatchKey( geometryDispatchKey( relatingObject ) )`, and an
 * analysis that used the product's own key is answering a different question.
 *
 * One row per `IfcRelAggregates`: the key its relating object produces, and
 * the express IDs of the products it carries.
 *
 *   node --max-old-space-size=12288 scripts/m3_aggregate_table.mjs <model> --out <dir>
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as process from 'node:process'


/**
 * Open the model and dump the table.
 *
 * @return {Promise<void>} When it is written.
 */
async function main() {

  const argv = process.argv.slice( 2 )
  const filePath = argv.find( ( argument ) => !argument.startsWith( '--' ) )
  const at = argv.indexOf( '--out' )
  const outDir = at < 0 ? process.cwd() : argv[ at + 1 ]

  if ( filePath === void 0 ) {
    throw new Error( 'usage: m3_aggregate_table.mjs <model> --out <dir>' )
  }

  const { IfcAPI } = await import( '../compiled/src/compat/web-ifc/ifc_api.js' )
  const gen = await import( '../compiled/src/ifc/ifc4_gen/index.js' )
  const dispatch = await import( '../compiled/src/ifc/geometry_dispatch.js' )

  const api = new IfcAPI()

  await api.Init()

  const modelID = await api.OpenModelStreamed(
      new Uint8Array( fs.readFileSync( filePath ) ),
      { USE_FAST_BOOLS: true, DEFER_GEOMETRY: true } )

  const passthrough = api.models.get( modelID )
  const model = passthrough.model[ 0 ]

  const lines = []

  for ( const relAggregate of model.types( gen.IfcRelAggregates ) ) {

    // Exactly what the pump keys the aggregates worklist by.
    const relating = dispatch.relatingLocalIDOf( model, relAggregate.localID )
    const key = dispatch.geometryDispatchKey( model, relating )

    const related = []

    try {

      for ( const object of relAggregate.RelatedObjects ) {

        if ( object instanceof gen.IfcProduct ) {
          related.push( object.expressID )
        }
      }

    } catch {
      // A relationship whose list does not resolve contributes no products,
      // which is what the pump's own permissive catch does with it too.
    }

    lines.push( JSON.stringify( {
      a: relAggregate.expressID,
      l: relAggregate.localID,
      g: relating,
      k: key,
      r: related,
    } ) )
  }

  fs.mkdirSync( outDir, { recursive: true } )
  fs.writeFileSync(
      path.join( outDir, 'aggregates.ndjson' ), `${lines.join( '\n' )}\n` )

  console.log( `${lines.length.toLocaleString( 'en-US' )} rel-aggregates written` )
}


await main()
