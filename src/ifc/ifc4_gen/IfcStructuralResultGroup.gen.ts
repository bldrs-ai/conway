
import { IfcGroup } from "./index"
import { IfcAnalysisTheoryTypeEnum, IfcAnalysisTheoryTypeEnumDeserializeStep } from "./index"
import { IfcStructuralLoadGroup } from "./index"
import { IfcBoolean } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcstructuralresultgroup.htm */
export  class IfcStructuralResultGroup extends IfcGroup {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSTRUCTURALRESULTGROUP
  }
  private TheoryType_? : IfcAnalysisTheoryTypeEnum
  private ResultForLoadGroup_? : IfcStructuralLoadGroup | null
  private IsLinear_? : boolean

  public get TheoryType() : IfcAnalysisTheoryTypeEnum {
    if ( this.TheoryType_ === void 0 ) {
      this.TheoryType_ = this.extractLambda( 5, 5, 4, IfcAnalysisTheoryTypeEnumDeserializeStep, false )
    }

    return this.TheoryType_ as IfcAnalysisTheoryTypeEnum
  }

  public get ResultForLoadGroup() : IfcStructuralLoadGroup | null {
    if ( this.ResultForLoadGroup_ === void 0 ) {
      this.ResultForLoadGroup_ = this.extractElement( 6, 5, 4, true, IfcStructuralLoadGroup )
    }

    return this.ResultForLoadGroup_ as IfcStructuralLoadGroup | null
  }

  public get IsLinear() : boolean {
    if ( this.IsLinear_ === void 0 ) {
      this.IsLinear_ = this.extractBoolean( 7, 5, 4, false )
    }

    return this.IsLinear_ as boolean
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSTRUCTURALRESULTGROUP ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSTRUCTURALRESULTGROUP
}
