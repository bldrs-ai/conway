
import { IfcPreDefinedPropertySet } from "./index"
import { IfcLabel } from "./index"
import { IfcSectionReinforcementProperties } from "./index"
import {
  stepExtractOptional,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcReinforcementDefinitionProperties extends IfcPreDefinedPropertySet {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCREINFORCEMENTDEFINITIONPROPERTIES
  }
  private DefinitionType_? : string | null
  private ReinforcementSectionDefinitions_? : Array<IfcSectionReinforcementProperties>

  public get DefinitionType() : string | null {
    if ( this.DefinitionType_ === void 0 ) {
      this.DefinitionType_ = this.extractString( 4, 4, 4, true )
    }

    return this.DefinitionType_ as string | null
  }

  public get ReinforcementSectionDefinitions() : Array<IfcSectionReinforcementProperties> {
    if ( this.ReinforcementSectionDefinitions_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 5, 4, 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcSectionReinforcementProperties> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcSectionReinforcementProperties )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.ReinforcementSectionDefinitions_ = value
    }

    return this.ReinforcementSectionDefinitions_ as Array<IfcSectionReinforcementProperties>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcReinforcementDefinitionProperties.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcReinforcementDefinitionProperties" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCREINFORCEMENTDEFINITIONPROPERTIES ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCREINFORCEMENTDEFINITIONPROPERTIES
}
