
import { IfcRoleEnum, IfcRoleEnumDeserializeStep } from "./index"
import { IfcLabel } from "./index"
import { IfcText } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcActorRole extends StepEntityBase< EntityTypesIfc4x3 > {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCACTORROLE
  }
  private Role_? : IfcRoleEnum
  private UserDefinedRole_? : string | null
  private Description_? : string | null

  public get Role() : IfcRoleEnum {
    if ( this.Role_ === void 0 ) {
      this.Role_ = this.extractLambda( 0, 0, 0, IfcRoleEnumDeserializeStep, false )
    }

    return this.Role_ as IfcRoleEnum
  }

  public get UserDefinedRole() : string | null {
    if ( this.UserDefinedRole_ === void 0 ) {
      this.UserDefinedRole_ = this.extractString( 1, 0, 0, true )
    }

    return this.UserDefinedRole_ as string | null
  }

  public get Description() : string | null {
    if ( this.Description_ === void 0 ) {
      this.Description_ = this.extractString( 2, 0, 0, true )
    }

    return this.Description_ as string | null
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcActorRole.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcActorRole" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCACTORROLE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCACTORROLE
}
