
import { IfcRelationship } from "./index"
import { IfcObjectDefinition } from "./index"
import { IfcObjectTypeEnum, IfcObjectTypeEnumDeserializeStep } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrelassigns.htm */
export abstract class IfcRelAssigns extends IfcRelationship {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELASSIGNS
  }
  private RelatedObjects_? : Array<IfcObjectDefinition>
  private RelatedObjectsType_? : IfcObjectTypeEnum | null

  public get RelatedObjects() : Array<IfcObjectDefinition> {
    if ( this.RelatedObjects_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 4, 4, 2 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcObjectDefinition> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcObjectDefinition )
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

    return this.RelatedObjects_ as Array<IfcObjectDefinition>
  }

  public get RelatedObjectsType() : IfcObjectTypeEnum | null {
    if ( this.RelatedObjectsType_ === void 0 ) {
      this.RelatedObjectsType_ = this.extractLambda( 5, 4, 2, IfcObjectTypeEnumDeserializeStep, true )
    }

    return this.RelatedObjectsType_ as IfcObjectTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELASSIGNSTOACTOR, EntityTypesIfc.IFCRELASSIGNSTOCONTROL, EntityTypesIfc.IFCRELASSIGNSTOGROUP, EntityTypesIfc.IFCRELASSIGNSTOPROCESS, EntityTypesIfc.IFCRELASSIGNSTOPRODUCT, EntityTypesIfc.IFCRELASSIGNSTORESOURCE, EntityTypesIfc.IFCRELASSIGNSTOGROUPBYFACTOR ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELASSIGNS
}
