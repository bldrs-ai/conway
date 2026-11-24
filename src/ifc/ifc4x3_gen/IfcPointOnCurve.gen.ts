
import { IfcPoint } from "./index"
import { IfcCurve } from "./index"
import { IfcParameterValue } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcPointOnCurve extends IfcPoint {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCPOINTONCURVE
  }
  private BasisCurve_? : IfcCurve
  private PointParameter_? : number

  public get BasisCurve() : IfcCurve {
    if ( this.BasisCurve_ === void 0 ) {
      this.BasisCurve_ = this.extractElement( 0, 0, 3, false, IfcCurve )
    }

    return this.BasisCurve_ as IfcCurve
  }

  public get PointParameter() : number {
    if ( this.PointParameter_ === void 0 ) {
      this.PointParameter_ = this.extractNumber( 1, 0, 3, false )
    }

    return this.PointParameter_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcPointOnCurve.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcPointOnCurve" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCPOINTONCURVE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCPOINTONCURVE
}
