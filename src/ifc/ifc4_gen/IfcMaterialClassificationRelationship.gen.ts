
import { IfcClassification } from "./index"
import { IfcClassificationReference } from "./index"
import { IfcMaterial } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcmaterialclassificationrelationship.htm */
export  class IfcMaterialClassificationRelationship extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCMATERIALCLASSIFICATIONRELATIONSHIP
  }
  private MaterialClassifications_? : Array<IfcClassification | IfcClassificationReference>
  private ClassifiedMaterial_? : IfcMaterial

  public get MaterialClassifications() : Array<IfcClassification | IfcClassificationReference> {
    if ( this.MaterialClassifications_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 0, 0, 0 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcClassification | IfcClassificationReference> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesIfc > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof IfcClassification ) && !( value1Untyped instanceof IfcClassificationReference ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (IfcClassification | IfcClassificationReference)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.MaterialClassifications_ = value
    }

    return this.MaterialClassifications_ as Array<IfcClassification | IfcClassificationReference>
  }

  public get ClassifiedMaterial() : IfcMaterial {
    if ( this.ClassifiedMaterial_ === void 0 ) {
      this.ClassifiedMaterial_ = this.extractElement( 1, 0, 0, false, IfcMaterial )
    }

    return this.ClassifiedMaterial_ as IfcMaterial
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCMATERIALCLASSIFICATIONRELATIONSHIP ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCMATERIALCLASSIFICATIONRELATIONSHIP
}
