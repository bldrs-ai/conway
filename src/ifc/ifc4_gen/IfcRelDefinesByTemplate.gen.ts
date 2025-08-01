
import { IfcRelDefines } from "./index"
import { IfcPropertySetDefinition } from "./index"
import { IfcPropertySetTemplate } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcreldefinesbytemplate.htm */
export  class IfcRelDefinesByTemplate extends IfcRelDefines {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELDEFINESBYTEMPLATE
  }
  private RelatedPropertySets_? : Array<IfcPropertySetDefinition>
  private RelatingTemplate_? : IfcPropertySetTemplate

  public get RelatedPropertySets() : Array<IfcPropertySetDefinition> {
    if ( this.RelatedPropertySets_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 4, 4, 3 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcPropertySetDefinition> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcPropertySetDefinition )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.RelatedPropertySets_ = value
    }

    return this.RelatedPropertySets_ as Array<IfcPropertySetDefinition>
  }

  public get RelatingTemplate() : IfcPropertySetTemplate {
    if ( this.RelatingTemplate_ === void 0 ) {
      this.RelatingTemplate_ = this.extractElement( 5, 4, 3, false, IfcPropertySetTemplate )
    }

    return this.RelatingTemplate_ as IfcPropertySetTemplate
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELDEFINESBYTEMPLATE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELDEFINESBYTEMPLATE
}
