
import { IfcRoleEnum, IfcRoleEnumDeserializeStep } from "./index"
import { IfcLabel } from "./index"
import { IfcText } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcactorrole.htm */
export  class IfcActorRole extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCACTORROLE
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCACTORROLE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCACTORROLE
}
