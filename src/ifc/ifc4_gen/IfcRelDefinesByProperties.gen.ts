
import { IfcRelDefines } from "./index"
import { IfcObjectDefinition } from "./index"
import { IfcPropertySetDefinition } from "./index"
import { IfcPropertySetDefinitionSet } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcreldefinesbyproperties.htm */
export  class IfcRelDefinesByProperties extends IfcRelDefines {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELDEFINESBYPROPERTIES
  }
  private RelatedObjects_? : Array<IfcObjectDefinition>
  private RelatingPropertyDefinition_? : IfcPropertySetDefinition | IfcPropertySetDefinitionSet

  public get RelatedObjects() : Array<IfcObjectDefinition> {
    if ( this.RelatedObjects_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 4, 4, 3 )
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

  public get RelatingPropertyDefinition() : IfcPropertySetDefinition | IfcPropertySetDefinitionSet {
    if ( this.RelatingPropertyDefinition_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc > = 
        this.extractReference( 5, 4, 3, false )

      if ( !( value instanceof IfcPropertySetDefinition ) && !( value instanceof IfcPropertySetDefinitionSet ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.RelatingPropertyDefinition_ = value as (IfcPropertySetDefinition | IfcPropertySetDefinitionSet)

    }

    return this.RelatingPropertyDefinition_ as IfcPropertySetDefinition | IfcPropertySetDefinitionSet
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELDEFINESBYPROPERTIES ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELDEFINESBYPROPERTIES
}
