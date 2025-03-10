import path from 'path'
import fsPromises from 'fs/promises'
import crypto from 'crypto'
import IfcModelCurves from './ifc_model_curves'
import { IfcCurve } from './ifc4_gen'


const MAX_FILES_OPEN = 64


/**
 * Dump the OBJs in this to a particular folder
 * @param from
 * @param folder The folder to dump to
 * @returns A promise to wait on when this completes.
 */
export async function dumpCurveOBJs( from: IfcModelCurves, folder: string ): Promise< void > {

  await fsPromises.mkdir( folder, { recursive: true })

  const writePromises: Promise< void >[] = []

  for ( const [curveItem, objFileContents] of from.objs() ) {

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
 * @param from
 * @yields {[IfcCurve, Uint8Array]} A list of curves with their corresponding hash.
 */
export function* curveHashes( from: IfcModelCurves ): IterableIterator< [IfcCurve, Uint8Array] >  {

  for ( const [curveItem, objFileContents] of from.objs() ) {

    const objHash = crypto.createHash( 'sha1' ).update( objFileContents ).digest()

    yield [curveItem, objHash]
  }
}
