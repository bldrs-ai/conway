
import { IfcPreDefinedProperties } from "./index"
import { IfcLengthMeasure } from "./index"
import { IfcReinforcingBarRoleEnum, IfcReinforcingBarRoleEnumDeserializeStep } from "./index"
import { IfcSectionProperties } from "./index"
import { IfcReinforcementBarProperties } from "./index"
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
export  class IfcSectionReinforcementProperties extends IfcPreDefinedProperties {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCSECTIONREINFORCEMENTPROPERTIES
  }
  private LongitudinalStartPosition_? : number
  private LongitudinalEndPosition_? : number
  private TransversePosition_? : number | null
  private ReinforcementRole_? : IfcReinforcingBarRoleEnum
  private SectionDefinition_? : IfcSectionProperties
  private CrossSectionReinforcementDefinitions_? : Array<IfcReinforcementBarProperties>

  public get LongitudinalStartPosition() : number {
    if ( this.LongitudinalStartPosition_ === void 0 ) {
      this.LongitudinalStartPosition_ = this.extractNumber( 0, 0, 2, false )
    }

    return this.LongitudinalStartPosition_ as number
  }

  public get LongitudinalEndPosition() : number {
    if ( this.LongitudinalEndPosition_ === void 0 ) {
      this.LongitudinalEndPosition_ = this.extractNumber( 1, 0, 2, false )
    }

    return this.LongitudinalEndPosition_ as number
  }

  public get TransversePosition() : number | null {
    if ( this.TransversePosition_ === void 0 ) {
      this.TransversePosition_ = this.extractNumber( 2, 0, 2, true )
    }

    return this.TransversePosition_ as number | null
  }

  public get ReinforcementRole() : IfcReinforcingBarRoleEnum {
    if ( this.ReinforcementRole_ === void 0 ) {
      this.ReinforcementRole_ = this.extractLambda( 3, 0, 2, IfcReinforcingBarRoleEnumDeserializeStep, false )
    }

    return this.ReinforcementRole_ as IfcReinforcingBarRoleEnum
  }

  public get SectionDefinition() : IfcSectionProperties {
    if ( this.SectionDefinition_ === void 0 ) {
      this.SectionDefinition_ = this.extractElement( 4, 0, 2, false, IfcSectionProperties )
    }

    return this.SectionDefinition_ as IfcSectionProperties
  }

  public get CrossSectionReinforcementDefinitions() : Array<IfcReinforcementBarProperties> {
    if ( this.CrossSectionReinforcementDefinitions_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 5, 0, 2 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcReinforcementBarProperties> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcReinforcementBarProperties )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.CrossSectionReinforcementDefinitions_ = value
    }

    return this.CrossSectionReinforcementDefinitions_ as Array<IfcReinforcementBarProperties>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcSectionReinforcementProperties.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcSectionReinforcementProperties" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCSECTIONREINFORCEMENTPROPERTIES ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCSECTIONREINFORCEMENTPROPERTIES
}
