
import { IfcQuantitySet } from "./index"
import { IfcLabel } from "./index"
import { IfcPhysicalQuantity } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcelementquantity.htm */
export  class IfcElementQuantity extends IfcQuantitySet {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCELEMENTQUANTITY
  }
  private MethodOfMeasurement_? : string | null
  private Quantities_? : Array<IfcPhysicalQuantity>

  public get MethodOfMeasurement() : string | null {
    if ( this.MethodOfMeasurement_ === void 0 ) {
      this.MethodOfMeasurement_ = this.extractString( 4, 4, 4, true )
    }

    return this.MethodOfMeasurement_ as string | null
  }

  public get Quantities() : Array<IfcPhysicalQuantity> {
    if ( this.Quantities_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 5, 4, 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcPhysicalQuantity> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcPhysicalQuantity )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.Quantities_ = value
    }

    return this.Quantities_ as Array<IfcPhysicalQuantity>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCELEMENTQUANTITY ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCELEMENTQUANTITY
}
