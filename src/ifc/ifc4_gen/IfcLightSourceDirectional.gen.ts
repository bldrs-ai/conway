
import { IfcLightSource } from "./index"
import { IfcDirection } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifclightsourcedirectional.htm */
export  class IfcLightSourceDirectional extends IfcLightSource {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCLIGHTSOURCEDIRECTIONAL
  }
  private Orientation_? : IfcDirection

  public get Orientation() : IfcDirection {
    if ( this.Orientation_ === void 0 ) {
      this.Orientation_ = this.extractElement( 4, 4, 3, false, IfcDirection )
    }

    return this.Orientation_ as IfcDirection
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCLIGHTSOURCEDIRECTIONAL ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCLIGHTSOURCEDIRECTIONAL
}
