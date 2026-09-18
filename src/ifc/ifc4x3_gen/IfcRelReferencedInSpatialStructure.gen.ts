
import { IfcRelConnects } from "./index"
import { IfcGroup } from "./index"
import { IfcProduct } from "./index"
import { IfcSpatialElement } from "./index"
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
export  class IfcRelReferencedInSpatialStructure extends IfcRelConnects {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCRELREFERENCEDINSPATIALSTRUCTURE
  }
  private RelatedElements_? : Array<IfcGroup | IfcProduct>
  private RelatingStructure_? : IfcSpatialElement

  public get RelatedElements() : Array<IfcGroup | IfcProduct> {
    if ( this.RelatedElements_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 4, 4, 3 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcGroup | IfcProduct> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesIfc4x3 > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof IfcGroup ) && !( value1Untyped instanceof IfcProduct ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (IfcGroup | IfcProduct)
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

    return this.RelatedElements_ as Array<IfcGroup | IfcProduct>
  }

  public get RelatingStructure() : IfcSpatialElement {
    if ( this.RelatingStructure_ === void 0 ) {
      this.RelatingStructure_ = this.extractElement( 5, 4, 3, false, IfcSpatialElement )
    }

    return this.RelatingStructure_ as IfcSpatialElement
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcRelReferencedInSpatialStructure.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcRelReferencedInSpatialStructure" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCRELREFERENCEDINSPATIALSTRUCTURE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCRELREFERENCEDINSPATIALSTRUCTURE
}
