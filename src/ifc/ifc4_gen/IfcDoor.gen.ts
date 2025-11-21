
import { IfcBuildingElement } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcDoorTypeEnum, IfcDoorTypeEnumDeserializeStep } from "./index"
import { IfcDoorTypeOperationEnum, IfcDoorTypeOperationEnumDeserializeStep } from "./index"
import { IfcLabel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcdoor.htm */
export  class IfcDoor extends IfcBuildingElement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCDOOR
  }
  private OverallHeight_? : number | null
  private OverallWidth_? : number | null
  private PredefinedType_? : IfcDoorTypeEnum | null
  private OperationType_? : IfcDoorTypeOperationEnum | null
  private UserDefinedOperationType_? : string | null

  public get OverallHeight() : number | null {
    if ( this.OverallHeight_ === void 0 ) {
      this.OverallHeight_ = this.extractNumber( 8, 8, 6, true )
    }

    return this.OverallHeight_ as number | null
  }

  public get OverallWidth() : number | null {
    if ( this.OverallWidth_ === void 0 ) {
      this.OverallWidth_ = this.extractNumber( 9, 8, 6, true )
    }

    return this.OverallWidth_ as number | null
  }

  public get PredefinedType() : IfcDoorTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 10, 8, 6, IfcDoorTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcDoorTypeEnum | null
  }

  public get OperationType() : IfcDoorTypeOperationEnum | null {
    if ( this.OperationType_ === void 0 ) {
      this.OperationType_ = this.extractLambda( 11, 8, 6, IfcDoorTypeOperationEnumDeserializeStep, true )
    }

    return this.OperationType_ as IfcDoorTypeOperationEnum | null
  }

  public get UserDefinedOperationType() : string | null {
    if ( this.UserDefinedOperationType_ === void 0 ) {
      this.UserDefinedOperationType_ = this.extractString( 12, 8, 6, true )
    }

    return this.UserDefinedOperationType_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCDOOR, EntityTypesIfc.IFCDOORSTANDARDCASE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCDOOR
}
