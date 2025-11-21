
import { IfcMaterialLayer } from "./index"
import { IfcLayerSetDirectionEnum, IfcLayerSetDirectionEnumDeserializeStep } from "./index"
import { IfcLengthMeasure } from "./index"
import {
  stepExtractOptional,
  stepExtractNumber,
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcmateriallayerwithoffsets.htm */
export  class IfcMaterialLayerWithOffsets extends IfcMaterialLayer {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCMATERIALLAYERWITHOFFSETS
  }
  private OffsetDirection_? : IfcLayerSetDirectionEnum
  private OffsetValues_? : Array< number >

  public get OffsetDirection() : IfcLayerSetDirectionEnum {
    if ( this.OffsetDirection_ === void 0 ) {
      this.OffsetDirection_ = this.extractLambda( 7, 7, 2, IfcLayerSetDirectionEnumDeserializeStep, false )
    }

    return this.OffsetDirection_ as IfcLayerSetDirectionEnum
  }

  public get OffsetValues() : Array< number > {
    if ( this.OffsetValues_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 8, 7, 2 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<number> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = stepExtractNumber( buffer, cursor, endCursor )

        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.OffsetValues_ = value
    }

    return this.OffsetValues_ as Array< number >
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCMATERIALLAYERWITHOFFSETS ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCMATERIALLAYERWITHOFFSETS
}
