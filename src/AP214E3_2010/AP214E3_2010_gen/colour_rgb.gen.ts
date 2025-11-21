
import { colour_specification } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class colour_rgb extends colour_specification {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.COLOUR_RGB
  }
  private red_? : number
  private green_? : number
  private blue_? : number

  public get red() : number {
    if ( this.red_ === void 0 ) {
      this.red_ = this.extractNumber( 1, 1, 2, false )
    }

    return this.red_ as number
  }

  public get green() : number {
    if ( this.green_ === void 0 ) {
      this.green_ = this.extractNumber( 2, 1, 2, false )
    }

    return this.green_ as number
  }

  public get blue() : number {
    if ( this.blue_ === void 0 ) {
      this.blue_ = this.extractNumber( 3, 1, 2, false )
    }

    return this.blue_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === colour_rgb.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for colour_rgb" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.COLOUR_RGB ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.COLOUR_RGB
}
