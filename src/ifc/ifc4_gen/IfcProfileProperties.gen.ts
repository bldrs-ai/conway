
import { IfcExtendedProperties } from "./index"
import { IfcProfileDef } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcprofileproperties.htm */
export  class IfcProfileProperties extends IfcExtendedProperties {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCPROFILEPROPERTIES
  }
  private ProfileDefinition_? : IfcProfileDef

  public get ProfileDefinition() : IfcProfileDef {
    if ( this.ProfileDefinition_ === void 0 ) {
      this.ProfileDefinition_ = this.extractElement( 3, 3, 2, false, IfcProfileDef )
    }

    return this.ProfileDefinition_ as IfcProfileDef
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCPROFILEPROPERTIES ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCPROFILEPROPERTIES
}
