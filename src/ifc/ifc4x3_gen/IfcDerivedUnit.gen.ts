
import { IfcDerivedUnitElement } from "./index"
import { IfcDerivedUnitEnum, IfcDerivedUnitEnumDeserializeStep } from "./index"
import { IfcLabel } from "./index"
import { IfcDimensionalExponents } from "./index"
import {
  stepExtractOptional,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
} from '../../step/parsing/step_deserialization_functions'
import {
  IfcDeriveDimensionalExponents,
} from '../ifc4x3_functions'

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcDerivedUnit extends StepEntityBase< EntityTypesIfc4x3 > {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCDERIVEDUNIT
  }
  private Elements_? : Array<IfcDerivedUnitElement>
  private UnitType_? : IfcDerivedUnitEnum
  private UserDefinedType_? : string | null
  private Name_? : string | null

  public get Elements() : Array<IfcDerivedUnitElement> {
    if ( this.Elements_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 0, 0, 0 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcDerivedUnitElement> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcDerivedUnitElement )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.Elements_ = value
    }

    return this.Elements_ as Array<IfcDerivedUnitElement>
  }

  public get UnitType() : IfcDerivedUnitEnum {
    if ( this.UnitType_ === void 0 ) {
      this.UnitType_ = this.extractLambda( 1, 0, 0, IfcDerivedUnitEnumDeserializeStep, false )
    }

    return this.UnitType_ as IfcDerivedUnitEnum
  }

  public get UserDefinedType() : string | null {
    if ( this.UserDefinedType_ === void 0 ) {
      this.UserDefinedType_ = this.extractString( 2, 0, 0, true )
    }

    return this.UserDefinedType_ as string | null
  }

  public get Name() : string | null {
    if ( this.Name_ === void 0 ) {
      this.Name_ = this.extractString( 3, 0, 0, true )
    }

    return this.Name_ as string | null
  }

  public get Dimensions() : IfcDimensionalExponents {
    return IfcDeriveDimensionalExponents(this?.Elements);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcDerivedUnit.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcDerivedUnit" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCDERIVEDUNIT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCDERIVEDUNIT
}
