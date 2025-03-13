import path from 'path'
import fsPromises from 'fs/promises'
import crypto from 'crypto'
import StepEntityBase from '../step/step_entity_base'
import EntityTypesIfc from './ifc4_gen/entity_types_ifc.gen'
import { IfcMaterialCache } from './ifc_material_cache'


const MAX_FILES_OPEN = 64

/**
 * Dump the OBJs in this to a particular folder
 *
 * @param from
 * @param folder The folder to dump to
 * @return {Promise<void>} A promise to wait on when this completes.
 */
export async function dumpMTLs( from: IfcMaterialCache, folder: string ): Promise< void > {

  await fsPromises.mkdir( folder, { recursive: true })

  const writePromises: Promise< void >[] = []

  for ( const [curveItem, objFileContents] of from.mtls() ) {

    const localID = curveItem.localID

    const outputExpressID = curveItem.expressID
    const outputFileName =
      outputExpressID !== void 0 ?
        `${outputExpressID}.obj` :
        `${localID}_inline.obj`

    const RADIX_CHARS = 2

    const outputFolder = path.join(
        folder, outputExpressID !== void 0 ?
          String( outputExpressID ).padStart( RADIX_CHARS, '0' ).substring( 0, RADIX_CHARS ) :
          'inline' )

    await fsPromises.mkdir( outputFolder, { recursive: true } )

    const outputFilePath = path.join( outputFolder, outputFileName )

    writePromises.push( fsPromises.writeFile( outputFilePath, objFileContents ) )

    if ( writePromises.length >= MAX_FILES_OPEN ) {

      await Promise.all( writePromises )
      writePromises.length = 0
    }
  }

  await Promise.all( writePromises )
}

/**
 * Build a set of hashes with their matching IFC curves.
 *
 * @param from
 * @yields {[StepEntityBase, Uint8Array]} A list of curves with
 * their corresponding hash.
 */
export function* materialHashes( from: IfcMaterialCache ):
  IterableIterator< [StepEntityBase< EntityTypesIfc >, Uint8Array] >  {

  for ( const [curveItem, objFileContents] of from.mtls() ) {

    const objHash = crypto.createHash( 'sha1' ).update( objFileContents ).digest()

    yield [curveItem, objHash]
  }
}
