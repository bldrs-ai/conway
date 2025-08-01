
import { geometric_representation_item } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class solid_model extends geometric_representation_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.SOLID_MODEL
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === solid_model.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for solid_model" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.SOLID_MODEL, EntityTypesAP214.CSG_SOLID, EntityTypesAP214.MANIFOLD_SOLID_BREP, EntityTypesAP214.SWEPT_FACE_SOLID, EntityTypesAP214.SWEPT_AREA_SOLID, EntityTypesAP214.SWEPT_DISK_SOLID, EntityTypesAP214.SOLID_REPLICA, EntityTypesAP214.EXTRUDED_FACE_SOLID, EntityTypesAP214.REVOLVED_FACE_SOLID, EntityTypesAP214.REVOLVED_AREA_SOLID, EntityTypesAP214.EXTRUDED_AREA_SOLID, EntityTypesAP214.SURFACE_CURVE_SWEPT_AREA_SOLID ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.SOLID_MODEL
}
