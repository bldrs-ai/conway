
import { IfcGroup } from "./index"
import { IfcAnalysisTheoryTypeEnum, IfcAnalysisTheoryTypeEnumDeserializeStep } from "./index"
import { IfcStructuralLoadGroup } from "./index"
import { IfcBoolean } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcStructuralResultGroup extends IfcGroup {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCSTRUCTURALRESULTGROUP
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcStructuralResultGroup.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcStructuralResultGroup" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCSTRUCTURALRESULTGROUP ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCSTRUCTURALRESULTGROUP
}
