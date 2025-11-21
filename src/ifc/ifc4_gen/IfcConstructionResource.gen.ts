
import { IfcResource } from "./index"
import { IfcResourceTime } from "./index"
import { IfcAppliedValue } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcconstructionresource.htm */
export abstract class IfcConstructionResource extends IfcResource {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCONSTRUCTIONRESOURCE
  }
  private Usage_? : IfcResourceTime | null
  private BaseCosts_? : Array<IfcAppliedValue> | null
  private BaseQuantity_? : IfcPhysicalQuantity | null

  public get Usage() : IfcResourceTime | null {
    if ( this.Usage_ === void 0 ) {
      this.Usage_ = this.extractElement( 7, 7, 4, true, IfcResourceTime )
    }

    return this.Usage_ as IfcResourceTime | null
  }

  public get BaseCosts() : Array<IfcAppliedValue> | null {
    if ( this.BaseCosts_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 8, 7, 4 )
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
      this.BaseQuantity_ = this.extractElement( 9, 7, 4, true, IfcPhysicalQuantity )
    }

    return this.BaseQuantity_ as IfcPhysicalQuantity | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCONSTRUCTIONEQUIPMENTRESOURCE, EntityTypesIfc.IFCCONSTRUCTIONMATERIALRESOURCE, EntityTypesIfc.IFCCONSTRUCTIONPRODUCTRESOURCE, EntityTypesIfc.IFCCREWRESOURCE, EntityTypesIfc.IFCLABORRESOURCE, EntityTypesIfc.IFCSUBCONTRACTRESOURCE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCONSTRUCTIONRESOURCE
}
