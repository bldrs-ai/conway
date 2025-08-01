
import { IfcExtendedProperties } from "./index"
import { IfcMaterialDefinition } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcmaterialproperties.htm */
export  class IfcMaterialProperties extends IfcExtendedProperties {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCMATERIALPROPERTIES
  }
  private Material_? : IfcMaterialDefinition

  public get Material() : IfcMaterialDefinition {
    if ( this.Material_ === void 0 ) {
      this.Material_ = this.extractElement( 3, 3, 2, false, IfcMaterialDefinition )
    }

    return this.Material_ as IfcMaterialDefinition
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCMATERIALPROPERTIES ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCMATERIALPROPERTIES
}
