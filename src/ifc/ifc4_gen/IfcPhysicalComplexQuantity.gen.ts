
import { IfcPhysicalQuantity } from "./index"
import { IfcLabel } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcphysicalcomplexquantity.htm */
export  class IfcPhysicalComplexQuantity extends IfcPhysicalQuantity {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCPHYSICALCOMPLEXQUANTITY
  }
  private HasQuantities_? : Array<IfcPhysicalQuantity>
  private Discrimination_? : string
  private Quality_? : string | null
  private Usage_? : string | null

  public get HasQuantities() : Array<IfcPhysicalQuantity> {
    if ( this.HasQuantities_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 2, 2, 1 )
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

      this.HasQuantities_ = value
    }

    return this.HasQuantities_ as Array<IfcPhysicalQuantity>
  }

  public get Discrimination() : string {
    if ( this.Discrimination_ === void 0 ) {
      this.Discrimination_ = this.extractString( 3, 2, 1, false )
    }

    return this.Discrimination_ as string
  }

  public get Quality() : string | null {
    if ( this.Quality_ === void 0 ) {
      this.Quality_ = this.extractString( 4, 2, 1, true )
    }

    return this.Quality_ as string | null
  }

  public get Usage() : string | null {
    if ( this.Usage_ === void 0 ) {
      this.Usage_ = this.extractString( 5, 2, 1, true )
    }

    return this.Usage_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCPHYSICALCOMPLEXQUANTITY ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCPHYSICALCOMPLEXQUANTITY
}
