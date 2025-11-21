
import { IfcRelationship } from "./index"
import { IfcObjectDefinition } from "./index"
import { IfcPropertyDefinition } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrelassociates.htm */
export abstract class IfcRelAssociates extends IfcRelationship {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELASSOCIATES
  }
  private RelatedObjects_? : Array<IfcObjectDefinition | IfcPropertyDefinition>

  public get RelatedObjects() : Array<IfcObjectDefinition | IfcPropertyDefinition> {
    if ( this.RelatedObjects_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 4, 4, 2 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcObjectDefinition | IfcPropertyDefinition> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesIfc > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof IfcObjectDefinition ) && !( value1Untyped instanceof IfcPropertyDefinition ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (IfcObjectDefinition | IfcPropertyDefinition)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.RelatedObjects_ = value
    }

    return this.RelatedObjects_ as Array<IfcObjectDefinition | IfcPropertyDefinition>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELASSOCIATESAPPROVAL, EntityTypesIfc.IFCRELASSOCIATESCLASSIFICATION, EntityTypesIfc.IFCRELASSOCIATESCONSTRAINT, EntityTypesIfc.IFCRELASSOCIATESDOCUMENT, EntityTypesIfc.IFCRELASSOCIATESLIBRARY, EntityTypesIfc.IFCRELASSOCIATESMATERIAL ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELASSOCIATES
}
