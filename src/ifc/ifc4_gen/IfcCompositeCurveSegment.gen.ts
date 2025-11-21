
import { IfcGeometricRepresentationItem } from "./index"
import { IfcTransitionCode, IfcTransitionCodeDeserializeStep } from "./index"
import { IfcBoolean } from "./index"
import { IfcCurve } from "./index"
import { IfcDimensionCount } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccompositecurvesegment.htm */
export  class IfcCompositeCurveSegment extends IfcGeometricRepresentationItem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCOMPOSITECURVESEGMENT
  }
  private Transition_? : IfcTransitionCode
  private SameSense_? : boolean
  private ParentCurve_? : IfcCurve

  public get Transition() : IfcTransitionCode {
    if ( this.Transition_ === void 0 ) {
      this.Transition_ = this.extractLambda( 0, 0, 2, IfcTransitionCodeDeserializeStep, false )
    }

    return this.Transition_ as IfcTransitionCode
  }

  public get SameSense() : boolean {
    if ( this.SameSense_ === void 0 ) {
      this.SameSense_ = this.extractBoolean( 1, 0, 2, false )
    }

    return this.SameSense_ as boolean
  }

  public get ParentCurve() : IfcCurve {
    if ( this.ParentCurve_ === void 0 ) {
      this.ParentCurve_ = this.extractElement( 2, 0, 2, false, IfcCurve )
    }

    return this.ParentCurve_ as IfcCurve
  }

  public get Dim() : number {
    return this?.ParentCurve?.Dim;
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCOMPOSITECURVESEGMENT, EntityTypesIfc.IFCREPARAMETRISEDCOMPOSITECURVESEGMENT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCOMPOSITECURVESEGMENT
}
