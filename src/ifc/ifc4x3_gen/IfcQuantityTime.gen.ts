
import { IfcPhysicalSimpleQuantity } from "./index"
import { IfcTimeMeasure } from "./index"
import { IfcLabel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcQuantityTime extends IfcPhysicalSimpleQuantity {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCQUANTITYTIME
  }
  private TimeValue_? : number
  private Formula_? : string | null

  public get TimeValue() : number {
    if ( this.TimeValue_ === void 0 ) {
      this.TimeValue_ = this.extractNumber( 3, 3, 2, false )
    }

    return this.TimeValue_ as number
  }

  public get Formula() : string | null {
    if ( this.Formula_ === void 0 ) {
      this.Formula_ = this.extractString( 4, 3, 2, true )
    }

    return this.Formula_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcQuantityTime.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcQuantityTime" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCQUANTITYTIME ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCQUANTITYTIME
}
