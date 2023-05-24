
import { IfcControl } from "./index"
import { IfcActionRequestTypeEnum, IfcActionRequestTypeEnumDeserializeStep } from "./index"
import { IfcLabel } from "./index"
import { IfcText } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcactionrequest.htm */
export  class IfcActionRequest extends IfcControl {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCACTIONREQUEST
  }
  private PredefinedType_? : IfcActionRequestTypeEnum | null
  private Status_? : string | null
  private LongDescription_? : string | null

  public get PredefinedType() : IfcActionRequestTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 6, IfcActionRequestTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcActionRequestTypeEnum | null
  }

  public get Status() : string | null {
    if ( this.Status_ === void 0 ) {
      this.Status_ = this.extractString( 7, true )
    }

    return this.Status_ as string | null
  }

  public get LongDescription() : string | null {
    if ( this.LongDescription_ === void 0 ) {
      this.LongDescription_ = this.extractString( 8, true )
    }

    return this.LongDescription_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCACTIONREQUEST ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCACTIONREQUEST
}
