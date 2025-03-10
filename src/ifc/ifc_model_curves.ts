import { CurveObject } from '../../dependencies/conway-geom'
import SimpleMemoization from '../core/simple_memoization'
import IfcStepModel from './ifc_step_model'
import { IfcCurve } from './ifc4_gen'

/**
 * IFC curve cache, allows dumping OBJ and hashes of curves
 */
export default class IfcModelCurves extends SimpleMemoization< CurveObject > {

  /**
   * Construct this.
   * @param model
   */
  constructor( public readonly model: IfcStepModel ) {
    super()
  }

  /**
   * Get the OBJs for all the curves in the cache (lazily)
   * @yields {[IfcCurve, string]} Curves with their matching OBJ as a string
   */
  public* objs() : IterableIterator< [IfcCurve, string] > {

    const model = this.model

    for ( const [localID, curve] of this ) {

      const curveItem = model.getElementByLocalID( localID )

      if ( !( curveItem instanceof IfcCurve ) ) {
        continue
      }

      const objFileContents = curve.dumpToOBJ( '' )

      yield [curveItem, objFileContents]
    }
  }
}
