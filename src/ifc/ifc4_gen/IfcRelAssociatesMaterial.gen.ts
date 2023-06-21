
import { IfcRelAssociates } from "./index"
import { IfcMaterialDefinition } from "./index"
import { IfcMaterialList } from "./index"
import { IfcMaterialUsageDefinition } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrelassociatesmaterial.htm */
export  class IfcRelAssociatesMaterial extends IfcRelAssociates {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELASSOCIATESMATERIAL
  }
  private RelatingMaterial_? : IfcMaterialDefinition | IfcMaterialList | IfcMaterialUsageDefinition

  public get RelatingMaterial() : IfcMaterialDefinition | IfcMaterialList | IfcMaterialUsageDefinition {
    if ( this.RelatingMaterial_ === void 0 ) {
      this.RelatingMaterial_ = this.extractLambda( 5, (buffer, cursor, endCursor) => {

      const value : StepEntityBase< EntityTypesIfc > | undefined =
        this.extractBufferReference( buffer, cursor, endCursor )

      if ( !( value instanceof IfcMaterialDefinition ) && !( value instanceof IfcMaterialList ) && !( value instanceof IfcMaterialUsageDefinition ) ) {
        return ( void 0 )
      }
      return value as (IfcMaterialDefinition | IfcMaterialList | IfcMaterialUsageDefinition)
}, false )
    }

    return this.RelatingMaterial_ as IfcMaterialDefinition | IfcMaterialList | IfcMaterialUsageDefinition
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELASSOCIATESMATERIAL ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELASSOCIATESMATERIAL
}