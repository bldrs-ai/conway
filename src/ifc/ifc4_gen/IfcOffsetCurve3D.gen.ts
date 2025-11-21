
import { IfcCurve } from "./index"
import { IfcLengthMeasure } from "./index"
import { IfcLogical } from "./index"
import { IfcDirection } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcoffsetcurve3d.htm */
export  class IfcOffsetCurve3D extends IfcCurve {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCOFFSETCURVE3D
  }
  private BasisCurve_? : IfcCurve
  private Distance_? : number
  private SelfIntersect_? : boolean | null
  private RefDirection_? : IfcDirection

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

  public get RefDirection() : IfcDirection {
    if ( this.RefDirection_ === void 0 ) {
      this.RefDirection_ = this.extractElement( 3, 0, 3, false, IfcDirection )
    }

    return this.RefDirection_ as IfcDirection
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCOFFSETCURVE3D ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCOFFSETCURVE3D
}
