
import { IfcTypeProcess } from "./index"
import { IfcTaskTypeEnum, IfcTaskTypeEnumDeserializeStep } from "./index"
import { IfcLabel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifctasktype.htm */
export  class IfcTaskType extends IfcTypeProcess {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCTASKTYPE
  }
  private PredefinedType_? : IfcTaskTypeEnum
  private WorkMethod_? : string | null

  public get PredefinedType() : IfcTaskTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 4, IfcTaskTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcTaskTypeEnum
  }

  public get WorkMethod() : string | null {
    if ( this.WorkMethod_ === void 0 ) {
      this.WorkMethod_ = this.extractString( 10, 9, 4, true )
    }

    return this.WorkMethod_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCTASKTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCTASKTYPE
}
