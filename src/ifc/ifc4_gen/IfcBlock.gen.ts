
import { IfcCsgPrimitive3D } from "./index"
import { IfcPositiveLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcblock.htm */
export  class IfcBlock extends IfcCsgPrimitive3D {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCBLOCK
  }
  private XLength_? : number
  private YLength_? : number
  private ZLength_? : number

  public get XLength() : number {
    if ( this.XLength_ === void 0 ) {
      this.XLength_ = this.extractNumber( 1, 1, 3, false )
    }

    return this.XLength_ as number
  }

  public get YLength() : number {
    if ( this.YLength_ === void 0 ) {
      this.YLength_ = this.extractNumber( 2, 1, 3, false )
    }

    return this.YLength_ as number
  }

  public get ZLength() : number {
    if ( this.ZLength_ === void 0 ) {
      this.ZLength_ = this.extractNumber( 3, 1, 3, false )
    }

    return this.ZLength_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCBLOCK ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCBLOCK
}
