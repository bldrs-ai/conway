
import { solid_model } from "./index"
import { curve } from "./index"
import { positive_length_measure } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class swept_disk_solid extends solid_model {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.SWEPT_DISK_SOLID
  }
  private directrix_? : curve
  private radius_? : number
  private inner_radius_? : number | null
  private start_param_? : number
  private end_param_? : number

  public get directrix() : curve {
    if ( this.directrix_ === void 0 ) {
      this.directrix_ = this.extractElement( 1, 1, 3, false, curve )
    }

    return this.directrix_ as curve
  }

  public get radius() : number {
    if ( this.radius_ === void 0 ) {
      this.radius_ = this.extractNumber( 2, 1, 3, false )
    }

    return this.radius_ as number
  }

  public get inner_radius() : number | null {
    if ( this.inner_radius_ === void 0 ) {
      this.inner_radius_ = this.extractNumber( 3, 1, 3, true )
    }

    return this.inner_radius_ as number | null
  }

  public get start_param() : number {
    if ( this.start_param_ === void 0 ) {
      this.start_param_ = this.extractNumber( 4, 1, 3, false )
    }

    return this.start_param_ as number
  }

  public get end_param() : number {
    if ( this.end_param_ === void 0 ) {
      this.end_param_ = this.extractNumber( 5, 1, 3, false )
    }

    return this.end_param_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === swept_disk_solid.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for swept_disk_solid" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.SWEPT_DISK_SOLID ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.SWEPT_DISK_SOLID
}
