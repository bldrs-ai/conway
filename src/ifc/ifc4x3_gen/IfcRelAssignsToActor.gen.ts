
import { IfcRelAssigns } from "./index"
import { IfcActor } from "./index"
import { IfcActorRole } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcRelAssignsToActor extends IfcRelAssigns {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCRELASSIGNSTOACTOR
  }
  private RelatingActor_? : IfcActor
  private ActingRole_? : IfcActorRole | null

  public get RelatingActor() : IfcActor {
    if ( this.RelatingActor_ === void 0 ) {
      this.RelatingActor_ = this.extractElement( 6, 6, 3, false, IfcActor )
    }

    return this.RelatingActor_ as IfcActor
  }

  public get ActingRole() : IfcActorRole | null {
    if ( this.ActingRole_ === void 0 ) {
      this.ActingRole_ = this.extractElement( 7, 6, 3, true, IfcActorRole )
    }

    return this.ActingRole_ as IfcActorRole | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcRelAssignsToActor.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcRelAssignsToActor" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCRELASSIGNSTOACTOR ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCRELASSIGNSTOACTOR
}
