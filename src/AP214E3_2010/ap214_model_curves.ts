import { CurveObject } from '../../dependencies/conway-geom'
import SimpleMemoization from '../core/simple_memoization'
import AP214StepModel from './ap214_step_model'
import { curve } from './AP214E3_2010_gen'

/**
 * IFC curve cache, allows dumping OBJ and hashes of curves
 */
export default class AP214ModelCurves extends SimpleMemoization< CurveObject > {

  /**
   * Construct this.
   *
   * @param model
   */
  constructor( public readonly model: AP214StepModel ) {
    super()
  }

  /**
   * Get the OBJs for all the curves in the cache (lazily)
   *
   * @yields {[curve, string]} Curves with their matching OBJ as a string
   */
  public* objs() : IterableIterator< [curve, string] > {

    const model = this.model

    for ( const [localID, curveObject] of this ) {

      const curveItem = model.getElementByLocalID( localID )

      if ( !( curveItem instanceof curve ) ) {
        continue
      }

      const objFileContents = curveObject.dumpToOBJ( '' )

      yield [curveItem, objFileContents]
    }
  }
}
