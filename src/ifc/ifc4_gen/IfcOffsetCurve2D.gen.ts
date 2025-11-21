
import { IfcCurve } from "./index"
import { IfcLengthMeasure } from "./index"
import { IfcLogical } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcoffsetcurve2d.htm */
export  class IfcOffsetCurve2D extends IfcCurve {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCOFFSETCURVE2D
  }
  private BasisCurve_? : IfcCurve
  private Distance_? : number
  private SelfIntersect_? : boolean | null

  public get BasisCurve() : IfcCurve {
    if ( this.BasisCurve_ === void 0 ) {
      this.BasisCurve_ = this.extractElement( 0, 0, 3, false, IfcCurve )
    }

    return this.BasisCurve_ as IfcCurve
  }

  public get Distance() : number {
    if ( this.Distance_ === void 0 ) {
      this.Distance_ = this.extractNumber( 1, 0, 3, false )
    }

    return this.Distance_ as number
  }

  public get SelfIntersect() : boolean | null {
    if ( this.SelfIntersect_ === void 0 ) {
      this.SelfIntersect_ = this.extractLogical( 2, 0, 3, false )
    }

    return this.SelfIntersect_ as boolean | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCOFFSETCURVE2D ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCOFFSETCURVE2D
}
