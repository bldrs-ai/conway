
import { conic } from "./index"
import { positive_length_measure } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class ellipse extends conic {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.ELLIPSE
  }
  private semi_axis_1_? : number
  private semi_axis_2_? : number

  public get semi_axis_1() : number {
    if ( this.semi_axis_1_ === void 0 ) {
      this.semi_axis_1_ = this.extractNumber( 2, 2, 4, false )
    }

    return this.semi_axis_1_ as number
  }

  public get semi_axis_2() : number {
    if ( this.semi_axis_2_ === void 0 ) {
      this.semi_axis_2_ = this.extractNumber( 3, 2, 4, false )
    }

    return this.semi_axis_2_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === ellipse.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for ellipse" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.ELLIPSE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.ELLIPSE
}
