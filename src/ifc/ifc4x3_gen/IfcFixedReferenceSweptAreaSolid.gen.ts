
import { IfcDirectrixCurveSweptAreaSolid } from "./index"
import { IfcDirection } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcFixedReferenceSweptAreaSolid extends IfcDirectrixCurveSweptAreaSolid {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCFIXEDREFERENCESWEPTAREASOLID
  }
  private FixedReference_? : IfcDirection

  public get FixedReference() : IfcDirection {
    if ( this.FixedReference_ === void 0 ) {
      this.FixedReference_ = this.extractElement( 5, 5, 5, false, IfcDirection )
    }

    return this.FixedReference_ as IfcDirection
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcFixedReferenceSweptAreaSolid.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcFixedReferenceSweptAreaSolid" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCFIXEDREFERENCESWEPTAREASOLID, EntityTypesIfc4x3.IFCDIRECTRIXDERIVEDREFERENCESWEPTAREASOLID ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCFIXEDREFERENCESWEPTAREASOLID
}
