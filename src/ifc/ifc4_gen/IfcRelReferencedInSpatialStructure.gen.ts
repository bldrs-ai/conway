
import { IfcRelConnects } from "./index"
import { IfcProduct } from "./index"
import { IfcSpatialElement } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrelreferencedinspatialstructure.htm */
export  class IfcRelReferencedInSpatialStructure extends IfcRelConnects {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELREFERENCEDINSPATIALSTRUCTURE
  }
  private RelatedElements_? : Array<IfcProduct>
  private RelatingStructure_? : IfcSpatialElement

  public get RelatedElements() : Array<IfcProduct> {
    if ( this.RelatedElements_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 4, 4, 3 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcProduct> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcProduct )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.RelatedElements_ = value
    }

    return this.RelatedElements_ as Array<IfcProduct>
  }

  public get RelatingStructure() : IfcSpatialElement {
    if ( this.RelatingStructure_ === void 0 ) {
      this.RelatingStructure_ = this.extractElement( 5, 4, 3, false, IfcSpatialElement )
    }

    return this.RelatingStructure_ as IfcSpatialElement
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELREFERENCEDINSPATIALSTRUCTURE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELREFERENCEDINSPATIALSTRUCTURE
}
