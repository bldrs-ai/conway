
import { IfcLinearElement } from "./index"
import { IfcAlignmentParameterSegment } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcAlignmentSegment extends IfcLinearElement {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCALIGNMENTSEGMENT
  }
  private DesignParameters_? : IfcAlignmentParameterSegment

  public get DesignParameters() : IfcAlignmentParameterSegment {
    if ( this.DesignParameters_ === void 0 ) {
      this.DesignParameters_ = this.extractElement( 7, 7, 5, false, IfcAlignmentParameterSegment )
    }

    return this.DesignParameters_ as IfcAlignmentParameterSegment
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcAlignmentSegment.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcAlignmentSegment" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCALIGNMENTSEGMENT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCALIGNMENTSEGMENT
}
