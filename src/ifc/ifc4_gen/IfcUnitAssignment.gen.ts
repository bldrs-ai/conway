
import { IfcDerivedUnit } from "./index"
import { IfcMonetaryUnit } from "./index"
import { IfcNamedUnit } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcunitassignment.htm */
export  class IfcUnitAssignment extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCUNITASSIGNMENT
  }
  private Units_? : Array<IfcDerivedUnit | IfcMonetaryUnit | IfcNamedUnit>

  public get Units() : Array<IfcDerivedUnit | IfcMonetaryUnit | IfcNamedUnit> {
    if ( this.Units_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 0, 0, 0 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcDerivedUnit | IfcMonetaryUnit | IfcNamedUnit> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesIfc > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof IfcDerivedUnit ) && !( value1Untyped instanceof IfcMonetaryUnit ) && !( value1Untyped instanceof IfcNamedUnit ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (IfcDerivedUnit | IfcMonetaryUnit | IfcNamedUnit)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.Units_ = value
    }

    return this.Units_ as Array<IfcDerivedUnit | IfcMonetaryUnit | IfcNamedUnit>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCUNITASSIGNMENT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCUNITASSIGNMENT
}
