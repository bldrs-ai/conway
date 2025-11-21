
import { IfcGroup } from "./index"
import { IfcLoadGroupTypeEnum, IfcLoadGroupTypeEnumDeserializeStep } from "./index"
import { IfcActionTypeEnum, IfcActionTypeEnumDeserializeStep } from "./index"
import { IfcActionSourceTypeEnum, IfcActionSourceTypeEnumDeserializeStep } from "./index"
import { IfcRatioMeasure } from "./index"
import { IfcLabel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcstructuralloadgroup.htm */
export  class IfcStructuralLoadGroup extends IfcGroup {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSTRUCTURALLOADGROUP
  }
  private PredefinedType_? : IfcLoadGroupTypeEnum
  private ActionType_? : IfcActionTypeEnum
  private ActionSource_? : IfcActionSourceTypeEnum
  private Coefficient_? : number | null
  private Purpose_? : string | null

  public get PredefinedType() : IfcLoadGroupTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 5, 5, 4, IfcLoadGroupTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcLoadGroupTypeEnum
  }

  public get ActionType() : IfcActionTypeEnum {
    if ( this.ActionType_ === void 0 ) {
      this.ActionType_ = this.extractLambda( 6, 5, 4, IfcActionTypeEnumDeserializeStep, false )
    }

    return this.ActionType_ as IfcActionTypeEnum
  }

  public get ActionSource() : IfcActionSourceTypeEnum {
    if ( this.ActionSource_ === void 0 ) {
      this.ActionSource_ = this.extractLambda( 7, 5, 4, IfcActionSourceTypeEnumDeserializeStep, false )
    }

    return this.ActionSource_ as IfcActionSourceTypeEnum
  }

  public get Coefficient() : number | null {
    if ( this.Coefficient_ === void 0 ) {
      this.Coefficient_ = this.extractNumber( 8, 5, 4, true )
    }

    return this.Coefficient_ as number | null
  }

  public get Purpose() : string | null {
    if ( this.Purpose_ === void 0 ) {
      this.Purpose_ = this.extractString( 9, 5, 4, true )
    }

    return this.Purpose_ as string | null
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSTRUCTURALLOADGROUP, EntityTypesIfc.IFCSTRUCTURALLOADCASE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSTRUCTURALLOADGROUP
}
