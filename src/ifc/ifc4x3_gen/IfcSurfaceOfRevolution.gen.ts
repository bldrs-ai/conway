
import { IfcSweptSurface } from "./index"
import { IfcAxis1Placement } from "./index"
import { IfcLine } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcSurfaceOfRevolution extends IfcSweptSurface {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCSURFACEOFREVOLUTION
  }
  private AxisPosition_? : IfcAxis1Placement

  public get AxisPosition() : IfcAxis1Placement {
    if ( this.AxisPosition_ === void 0 ) {
      this.AxisPosition_ = this.extractElement( 2, 2, 4, false, IfcAxis1Placement )
    }

    return this.AxisPosition_ as IfcAxis1Placement
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcSurfaceOfRevolution.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcSurfaceOfRevolution" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCSURFACEOFREVOLUTION ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCSURFACEOFREVOLUTION
}
