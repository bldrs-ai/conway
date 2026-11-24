
import { IfcLabel } from "./index"
import { IfcText } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcResourceLevelRelationship extends StepEntityBase< EntityTypesIfc4x3 > {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCRESOURCELEVELRELATIONSHIP
  }
  private Name_? : string | null
  private Description_? : string | null

  public get Name() : string | null {
    if ( this.Name_ === void 0 ) {
      this.Name_ = this.extractString( 0, 0, 0, true )
    }

    return this.Name_ as string | null
  }

  public get Description() : string | null {
    if ( this.Description_ === void 0 ) {
      this.Description_ = this.extractString( 1, 0, 0, true )
    }

    return this.Description_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcResourceLevelRelationship.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcResourceLevelRelationship" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCAPPROVALRELATIONSHIP, EntityTypesIfc4x3.IFCCURRENCYRELATIONSHIP, EntityTypesIfc4x3.IFCDOCUMENTINFORMATIONRELATIONSHIP, EntityTypesIfc4x3.IFCEXTERNALREFERENCERELATIONSHIP, EntityTypesIfc4x3.IFCMATERIALRELATIONSHIP, EntityTypesIfc4x3.IFCORGANIZATIONRELATIONSHIP, EntityTypesIfc4x3.IFCPROPERTYDEPENDENCYRELATIONSHIP, EntityTypesIfc4x3.IFCRESOURCEAPPROVALRELATIONSHIP, EntityTypesIfc4x3.IFCRESOURCECONSTRAINTRELATIONSHIP ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCRESOURCELEVELRELATIONSHIP
}
