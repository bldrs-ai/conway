
import { IfcObject } from "./index"
import { IfcOrganization } from "./index"
import { IfcPerson } from "./index"
import { IfcPersonAndOrganization } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcActor extends IfcObject {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCACTOR
  }
  private TheActor_? : IfcOrganization | IfcPerson | IfcPersonAndOrganization

  public get TheActor() : IfcOrganization | IfcPerson | IfcPersonAndOrganization {
    if ( this.TheActor_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 > = 
        this.extractReference( 5, 5, 3, false )

      if ( !( value instanceof IfcOrganization ) && !( value instanceof IfcPerson ) && !( value instanceof IfcPersonAndOrganization ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.TheActor_ = value as (IfcOrganization | IfcPerson | IfcPersonAndOrganization)

    }

    return this.TheActor_ as IfcOrganization | IfcPerson | IfcPersonAndOrganization
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcActor.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcActor" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCACTOR, EntityTypesIfc4x3.IFCOCCUPANT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCACTOR
}
