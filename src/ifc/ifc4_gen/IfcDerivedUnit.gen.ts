
import { IfcDerivedUnitElement } from "./index"
import { IfcDerivedUnitEnum, IfcDerivedUnitEnumDeserializeStep } from "./index"
import { IfcLabel } from "./index"
import { IfcDimensionalExponents } from "./index"
import {
  stepExtractArray,
} from '../../step/parsing/step_deserialization_functions'
import {
  IfcDeriveDimensionalExponents,
} from '../ifc_functions'

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcderivedunit.htm */
export  class IfcDerivedUnit extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCDERIVEDUNIT
  }
  private Elements_? : Array<IfcDerivedUnitElement>
  private UnitType_? : IfcDerivedUnitEnum
  private UserDefinedType_? : string | null

  public get Elements() : Array<IfcDerivedUnitElement> {
    if ( this.Elements_ === void 0 ) {
      this.Elements_ = this.extractLambda( 0, (buffer, cursor, endCursor) => {

      let value : Array<IfcDerivedUnitElement> = [];

      for ( let address of stepExtractArray( buffer, cursor, endCursor ) ) {
        value.push( (() => {
          const cursor = address
           let value = this.extractBufferReference( buffer, cursor, endCursor )
    
          if ( !( value instanceof IfcDerivedUnitElement ) )  {
            throw new Error( 'Value in STEP was incorrectly typed for field' )
          }
    
          return value
        })() )
      }
      return value }, false )
    }

    return this.Elements_ as Array<IfcDerivedUnitElement>
  }

  public get UnitType() : IfcDerivedUnitEnum {
    if ( this.UnitType_ === void 0 ) {
      this.UnitType_ = this.extractLambda( 1, IfcDerivedUnitEnumDeserializeStep, false )
    }

    return this.UnitType_ as IfcDerivedUnitEnum
  }

  public get UserDefinedType() : string | null {
    if ( this.UserDefinedType_ === void 0 ) {
      this.UserDefinedType_ = this.extractString( 2, true )
    }

    return this.UserDefinedType_ as string | null
  }

  public get Dimensions() : IfcDimensionalExponents {
    return IfcDeriveDimensionalExponents(this?.Elements);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCDERIVEDUNIT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCDERIVEDUNIT
}