
import { IfcGeometricRepresentationItem } from "./index"
import { IfcTransitionCode, IfcTransitionCodeDeserializeStep } from "./index"
import { IfcDimensionCount } from "./index"
// Hand-added: the generator omits this import for IfcSegment's DERIVE
// clause (a generator bug specific to IFC4X3_ADD2.exp — see
// ifc4x3_functions.ts's top-of-file comment). A regenerate will drop this
// line and re-break the build until that's fixed upstream.
import { IfcSegmentDim } from '../ifc4x3_functions'

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcSegment extends IfcGeometricRepresentationItem {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCSEGMENT
  }
  private Transition_? : IfcTransitionCode

  public get Transition() : IfcTransitionCode {
    if ( this.Transition_ === void 0 ) {
      this.Transition_ = this.extractLambda( 0, 0, 2, IfcTransitionCodeDeserializeStep, false )
    }

    return this.Transition_ as IfcTransitionCode
  }

  public get Dim() : number {
    return IfcSegmentDim(this);
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcSegment.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcSegment" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCCOMPOSITECURVESEGMENT, EntityTypesIfc4x3.IFCCURVESEGMENT, EntityTypesIfc4x3.IFCREPARAMETRISEDCOMPOSITECURVESEGMENT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCSEGMENT
}
