
import { IfcCsgPrimitive3D } from "./index"
import { IfcPositiveLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../core/step_entity_internal_reference'
import StepEntityBase from '../../core/step_entity_base'
import StepModelBase from '../../core/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrectangularpyramid.htm */
export  class IfcRectangularPyramid extends IfcCsgPrimitive3D {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRECTANGULARPYRAMID
  }
  private XLength_? : number
  private YLength_? : number
  private Height_? : number

  public get XLength() : number {
    if ( this.XLength_ === void 0 ) {
      this.XLength_ = this.extractNumber( 1, false )
    }

    return this.XLength_ as number
  }

  public get YLength() : number {
    if ( this.YLength_ === void 0 ) {
      this.YLength_ = this.extractNumber( 2, false )
    }

    return this.YLength_ as number
  }

  public get Height() : number {
    if ( this.Height_ === void 0 ) {
      this.Height_ = this.extractNumber( 3, false )
    }

    return this.Height_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRECTANGULARPYRAMID ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRECTANGULARPYRAMID
}
