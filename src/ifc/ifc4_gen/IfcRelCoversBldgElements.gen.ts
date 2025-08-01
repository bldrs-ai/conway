
import { IfcRelConnects } from "./index"
import { IfcElement } from "./index"
import { IfcCovering } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrelcoversbldgelements.htm */
export  class IfcRelCoversBldgElements extends IfcRelConnects {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELCOVERSBLDGELEMENTS
  }
  private RelatingBuildingElement_? : IfcElement
  private RelatedCoverings_? : Array<IfcCovering>

  public get RelatingBuildingElement() : IfcElement {
    if ( this.RelatingBuildingElement_ === void 0 ) {
      this.RelatingBuildingElement_ = this.extractElement( 4, 4, 3, false, IfcElement )
    }

    return this.RelatingBuildingElement_ as IfcElement
  }

  public get RelatedCoverings() : Array<IfcCovering> {
    if ( this.RelatedCoverings_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 5, 4, 3 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcCovering> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcCovering )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.RelatedCoverings_ = value
    }

    return this.RelatedCoverings_ as Array<IfcCovering>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELCOVERSBLDGELEMENTS ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELCOVERSBLDGELEMENTS
}
