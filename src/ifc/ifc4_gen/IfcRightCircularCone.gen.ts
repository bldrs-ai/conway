
import { IfcCsgPrimitive3D } from "./index"
import { IfcPositiveLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrightcircularcone.htm */
export  class IfcRightCircularCone extends IfcCsgPrimitive3D {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRIGHTCIRCULARCONE
  }
  private Height_? : number
  private BottomRadius_? : number

  public get Height() : number {
    if ( this.Height_ === void 0 ) {
      this.Height_ = this.extractNumber( 1, false )
    }

    return this.Height_ as number
  }

  public get BottomRadius() : number {
    if ( this.BottomRadius_ === void 0 ) {
      this.BottomRadius_ = this.extractNumber( 2, false )
    }

    return this.BottomRadius_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRIGHTCIRCULARCONE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRIGHTCIRCULARCONE
}
