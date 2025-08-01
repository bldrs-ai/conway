
import { IfcResourceLevelRelationship } from "./index"
import { IfcExternalReference } from "./index"
import { IfcActorRole } from "./index"
import { IfcAppliedValue } from "./index"
import { IfcApproval } from "./index"
import { IfcConstraint } from "./index"
import { IfcContextDependentUnit } from "./index"
import { IfcConversionBasedUnit } from "./index"
import { IfcExternalInformation } from "./index"
import { IfcMaterialDefinition } from "./index"
import { IfcOrganization } from "./index"
import { IfcPerson } from "./index"
import { IfcPersonAndOrganization } from "./index"
import { IfcPhysicalQuantity } from "./index"
import { IfcProfileDef } from "./index"
import { IfcPropertyAbstraction } from "./index"
import { IfcTimeSeries } from "./index"
import {
  stepExtractOptional,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcexternalreferencerelationship.htm */
export  class IfcExternalReferenceRelationship extends IfcResourceLevelRelationship {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCEXTERNALREFERENCERELATIONSHIP
  }
  private RelatingReference_? : IfcExternalReference
  private RelatedResourceObjects_? : Array<IfcActorRole | IfcAppliedValue | IfcApproval | IfcConstraint | IfcContextDependentUnit | IfcConversionBasedUnit | IfcExternalInformation | IfcExternalReference | IfcMaterialDefinition | IfcOrganization | IfcPerson | IfcPersonAndOrganization | IfcPhysicalQuantity | IfcProfileDef | IfcPropertyAbstraction | IfcTimeSeries>

  public get RelatingReference() : IfcExternalReference {
    if ( this.RelatingReference_ === void 0 ) {
      this.RelatingReference_ = this.extractElement( 2, 2, 1, false, IfcExternalReference )
    }

    return this.RelatingReference_ as IfcExternalReference
  }

  public get RelatedResourceObjects() : Array<IfcActorRole | IfcAppliedValue | IfcApproval | IfcConstraint | IfcContextDependentUnit | IfcConversionBasedUnit | IfcExternalInformation | IfcExternalReference | IfcMaterialDefinition | IfcOrganization | IfcPerson | IfcPersonAndOrganization | IfcPhysicalQuantity | IfcProfileDef | IfcPropertyAbstraction | IfcTimeSeries> {
    if ( this.RelatedResourceObjects_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 3, 2, 1 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcActorRole | IfcAppliedValue | IfcApproval | IfcConstraint | IfcContextDependentUnit | IfcConversionBasedUnit | IfcExternalInformation | IfcExternalReference | IfcMaterialDefinition | IfcOrganization | IfcPerson | IfcPersonAndOrganization | IfcPhysicalQuantity | IfcProfileDef | IfcPropertyAbstraction | IfcTimeSeries> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesIfc > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof IfcActorRole ) && !( value1Untyped instanceof IfcAppliedValue ) && !( value1Untyped instanceof IfcApproval ) && !( value1Untyped instanceof IfcConstraint ) && !( value1Untyped instanceof IfcContextDependentUnit ) && !( value1Untyped instanceof IfcConversionBasedUnit ) && !( value1Untyped instanceof IfcExternalInformation ) && !( value1Untyped instanceof IfcExternalReference ) && !( value1Untyped instanceof IfcMaterialDefinition ) && !( value1Untyped instanceof IfcOrganization ) && !( value1Untyped instanceof IfcPerson ) && !( value1Untyped instanceof IfcPersonAndOrganization ) && !( value1Untyped instanceof IfcPhysicalQuantity ) && !( value1Untyped instanceof IfcProfileDef ) && !( value1Untyped instanceof IfcPropertyAbstraction ) && !( value1Untyped instanceof IfcTimeSeries ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (IfcActorRole | IfcAppliedValue | IfcApproval | IfcConstraint | IfcContextDependentUnit | IfcConversionBasedUnit | IfcExternalInformation | IfcExternalReference | IfcMaterialDefinition | IfcOrganization | IfcPerson | IfcPersonAndOrganization | IfcPhysicalQuantity | IfcProfileDef | IfcPropertyAbstraction | IfcTimeSeries)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.RelatedResourceObjects_ = value
    }

    return this.RelatedResourceObjects_ as Array<IfcActorRole | IfcAppliedValue | IfcApproval | IfcConstraint | IfcContextDependentUnit | IfcConversionBasedUnit | IfcExternalInformation | IfcExternalReference | IfcMaterialDefinition | IfcOrganization | IfcPerson | IfcPersonAndOrganization | IfcPhysicalQuantity | IfcProfileDef | IfcPropertyAbstraction | IfcTimeSeries>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCEXTERNALREFERENCERELATIONSHIP ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCEXTERNALREFERENCERELATIONSHIP
}
