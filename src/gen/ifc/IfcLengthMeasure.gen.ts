
/* This is generated code, don't alter */

import EntityTypesIfc from "./entity_types_ifc.gen"
import StepEntityInternalReference from "../../core/step_entity_internal_reference"
import StepEntityBase from "../../core/step_entity_base"
import StepModelBase from "../../core/step_model_base"
import {
  stepExtractBoolean,
  stepExtractEnum,
  stepExtractString,
  stepExtractOptional,
  stepExtractBinary,
  stepExtractReference,
  stepExtractNumber,
  stepExtractInlineElemement,
  stepExtractArray
} from '../../../dependencies/conway-ds/src/parsing/step/step_deserialization_functions'


///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifclengthmeasure.htm */
export class IfcLengthMeasure extends StepEntityBase< EntityTypesIfc > {    
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCLENGTHMEASURE
  }

  private Value_? : number;

  public get Value() : number {
    if ( this.Value_ === void 0 ) {
      this.Value_ = (() => { 
        this.guaranteeVTable()

      let internalReference = this.internalReference_ as Required< StepEntityInternalReference< EntityTypesIfc > >

      if ( 0 >= internalReference.vtableCount ) {
        throw new Error( "Couldn't read field due to too few fields in record" )
      }
            
      let vtableSlot = internalReference.vtableIndex + 0

      let cursor    = internalReference.vtable[ vtableSlot ]
      let buffer    = internalReference.buffer
      let endCursor = buffer.length

     let value = stepExtractNumber( buffer, cursor, endCursor )

      if ( value === void 0 )  {
        throw new Error( 'Value in STEP was incorrectly typed' )
      }

      return value })()
    }

    return this.Value_ as number
  }

  constructor(
      localID: number,
      internalReference: StepEntityInternalReference< EntityTypesIfc >,
      model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
     super( localID, internalReference, model )
  }

  public static readonly query =
    [ EntityTypesIfc.IFCLENGTHMEASURE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCLENGTHMEASURE
}