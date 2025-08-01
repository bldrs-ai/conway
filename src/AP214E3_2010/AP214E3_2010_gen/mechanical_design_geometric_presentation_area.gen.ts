
import { presentation_area } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class mechanical_design_geometric_presentation_area extends presentation_area {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.MECHANICAL_DESIGN_GEOMETRIC_PRESENTATION_AREA
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === mechanical_design_geometric_presentation_area.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for mechanical_design_geometric_presentation_area" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.MECHANICAL_DESIGN_GEOMETRIC_PRESENTATION_AREA ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.MECHANICAL_DESIGN_GEOMETRIC_PRESENTATION_AREA
}
