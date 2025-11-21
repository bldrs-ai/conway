
import { edge } from "./index"
import { dimension_count } from "./index"
import { curve } from "./index"
import {
  dimension_of,
} from '../ap214_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class edge_curve extends edge {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.EDGE_CURVE
  }
  private edge_geometry_? : curve
  private same_sense_? : boolean

  public get dim() : number {
    return dimension_of(this);
  }

  public get edge_geometry() : curve {
    if ( this.edge_geometry_ === void 0 ) {
      this.edge_geometry_ = this.extractElement( 3, 3, 3, false, curve )
    }

    return this.edge_geometry_ as curve
  }

  public get same_sense() : boolean {
    if ( this.same_sense_ === void 0 ) {
      this.same_sense_ = this.extractBoolean( 4, 3, 3, false )
    }

    return this.same_sense_ as boolean
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === edge_curve.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for edge_curve" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.EDGE_CURVE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.EDGE_CURVE
}
