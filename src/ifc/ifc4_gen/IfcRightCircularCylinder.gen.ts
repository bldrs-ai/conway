
import { IfcCsgPrimitive3D } from "./index"
import { IfcPositiveLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrightcircularcylinder.htm */
export  class IfcRightCircularCylinder extends IfcCsgPrimitive3D {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRIGHTCIRCULARCYLINDER
  }
  private Height_? : number
  private Radius_? : number

  public get Height() : number {
    if ( this.Height_ === void 0 ) {
      this.Height_ = this.extractNumber( 1, 1, 3, false )
    }

    return this.Height_ as number
  }

  public get Radius() : number {
    if ( this.Radius_ === void 0 ) {
      this.Radius_ = this.extractNumber( 2, 1, 3, false )
    }

    return this.Radius_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRIGHTCIRCULARCYLINDER ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRIGHTCIRCULARCYLINDER
}
