
import { IfcProperty } from "./index"
import { IfcIdentifier } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccomplexproperty.htm */
export  class IfcComplexProperty extends IfcProperty {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCOMPLEXPROPERTY
  }
  private UsageName_? : string
  private HasProperties_? : Array<IfcProperty>

  public get UsageName() : string {
    if ( this.UsageName_ === void 0 ) {
      this.UsageName_ = this.extractString( 2, 2, 2, false )
    }

    return this.UsageName_ as string
  }

  public get HasProperties() : Array<IfcProperty> {
    if ( this.HasProperties_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 3, 2, 2 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcProperty> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcProperty )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.HasProperties_ = value
    }

    return this.HasProperties_ as Array<IfcProperty>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCOMPLEXPROPERTY ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCOMPLEXPROPERTY
}
