import path from 'path'
import fsPromises from 'fs/promises'
import crypto from 'crypto'
import { dumpMTL } from '../core/canonical_material'
import { IfcGeometricRepresentationItem } from './ifc4_gen'
import { IfcModelGeometry } from './ifc_model_geometry'


const MAX_FILES_OPEN = 64

/**
 * Dump the OBJs in this to a particular folder
 *
 * @param folder The folder to dump to
 * @return {Promise<void>} A promise to wait on when this completes.
 */
export async function dumpGeometryOBJs( from: IfcModelGeometry, folder: string ): Promise< void > {

  await fsPromises.mkdir( folder, { recursive: true })

  const writePromises: Promise< void >[] = []

  for ( const [geometryItem, objFileContents, material, materialName] of from.objs() ) {

    const localID = geometryItem.localID

    const outputExpressID = geometryItem.expressID
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

    if ( material !== void 0 ) {

      const materialFilePath = path.join( outputFolder, materialName )

      writePromises.push( fsPromises.writeFile( materialFilePath, dumpMTL( material ) ) )
    }

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
 * @yields {[IfcGeometricRepresentationItem, Uint8Array]} A list of curves with
 * their corresponding hash.
 */
export function* geometryHashes( from: IfcModelGeometry ):
  IterableIterator< [IfcGeometricRepresentationItem, Uint8Array] > {

  for ( const [curveItem, objFileContents] of from.objs() ) {

    const objHash = crypto.createHash( 'sha1' ).update( objFileContents ).digest()

    yield [curveItem, objHash]
  }
}