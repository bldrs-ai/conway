
import { IfcRelAssociates } from "./index"
import { IfcMaterialDefinition } from "./index"
import { IfcMaterialList } from "./index"
import { IfcMaterialUsageDefinition } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcRelAssociatesMaterial extends IfcRelAssociates {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCRELASSOCIATESMATERIAL
  }
  private RelatingMaterial_? : IfcMaterialDefinition | IfcMaterialList | IfcMaterialUsageDefinition

  public get RelatingMaterial() : IfcMaterialDefinition | IfcMaterialList | IfcMaterialUsageDefinition {
    if ( this.RelatingMaterial_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 > = 
        this.extractReference( 5, 5, 3, false )

      if ( !( value instanceof IfcMaterialDefinition ) && !( value instanceof IfcMaterialList ) && !( value instanceof IfcMaterialUsageDefinition ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.RelatingMaterial_ = value as (IfcMaterialDefinition | IfcMaterialList | IfcMaterialUsageDefinition)

    }

    return this.RelatingMaterial_ as IfcMaterialDefinition | IfcMaterialList | IfcMaterialUsageDefinition
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcRelAssociatesMaterial.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcRelAssociatesMaterial" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCRELASSOCIATESMATERIAL ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCRELASSOCIATESMATERIAL
}
