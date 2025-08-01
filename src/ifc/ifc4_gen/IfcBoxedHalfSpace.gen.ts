
import { IfcHalfSpaceSolid } from "./index"
import { IfcBoundingBox } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcboxedhalfspace.htm */
export  class IfcBoxedHalfSpace extends IfcHalfSpaceSolid {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCBOXEDHALFSPACE
  }
  private Enclosure_? : IfcBoundingBox

  public get Enclosure() : IfcBoundingBox {
    if ( this.Enclosure_ === void 0 ) {
      this.Enclosure_ = this.extractElement( 2, 2, 3, false, IfcBoundingBox )
    }

    return this.Enclosure_ as IfcBoundingBox
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCBOXEDHALFSPACE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCBOXEDHALFSPACE
}
