
import { edge } from "./index"
import { vertex } from "./index"
import {
  boolean_choose,
} from '../ap214_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class oriented_edge extends edge {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.ORIENTED_EDGE
  }
  private edge_element_? : edge
  private orientation_? : boolean

  public get edge_element() : edge {
    if ( this.edge_element_ === void 0 ) {
      this.edge_element_ = this.extractElement( 3, 3, 3, false, edge )
    }

    return this.edge_element_ as edge
  }

  public get orientation() : boolean {
    if ( this.orientation_ === void 0 ) {
      this.orientation_ = this.extractBoolean( 4, 3, 3, false )
    }

    return this.orientation_ as boolean
  }

  public get edge_start() : vertex {
    return boolean_choose(this?.orientation,this?.edge_element.edge_start,this?.edge_element.edge_end);
  }

  public get edge_end() : vertex {
    return boolean_choose(this?.orientation,this?.edge_element.edge_end,this?.edge_element.edge_start);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === oriented_edge.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for oriented_edge" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.ORIENTED_EDGE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.ORIENTED_EDGE
}
