
import { IfcTypeResource } from "./index"
import { IfcAppliedValue } from "./index"
import { IfcPhysicalQuantity } from "./index"
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
export abstract class IfcConstructionResourceType extends IfcTypeResource {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCCONSTRUCTIONRESOURCETYPE
  }
  private BaseCosts_? : Array<IfcAppliedValue> | null
  private BaseQuantity_? : IfcPhysicalQuantity | null

  public get BaseCosts() : Array<IfcAppliedValue> | null {
    if ( this.BaseCosts_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 9, 9, 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return null
      }

      const value : Array<IfcAppliedValue> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcAppliedValue )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.BaseCosts_ = value
    }

    return this.BaseCosts_ as Array<IfcAppliedValue> | null
  }

  public get BaseQuantity() : IfcPhysicalQuantity | null {
    if ( this.BaseQuantity_ === void 0 ) {
      this.BaseQuantity_ = this.extractElement( 10, 9, 4, true, IfcPhysicalQuantity )
    }

    return this.BaseQuantity_ as IfcPhysicalQuantity | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcConstructionResourceType.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcConstructionResourceType" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCCONSTRUCTIONEQUIPMENTRESOURCETYPE, EntityTypesIfc4x3.IFCCONSTRUCTIONMATERIALRESOURCETYPE, EntityTypesIfc4x3.IFCCONSTRUCTIONPRODUCTRESOURCETYPE, EntityTypesIfc4x3.IFCCREWRESOURCETYPE, EntityTypesIfc4x3.IFCLABORRESOURCETYPE, EntityTypesIfc4x3.IFCSUBCONTRACTRESOURCETYPE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCCONSTRUCTIONRESOURCETYPE
}
