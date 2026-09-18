
import { IfcPoint } from "./index"
import { IfcLengthMeasure } from "./index"
import { IfcParameterValue } from "./index"
import { IfcCurve } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcPointByDistanceExpression extends IfcPoint {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCPOINTBYDISTANCEEXPRESSION
  }
  private DistanceAlong_? : IfcLengthMeasure | IfcParameterValue
  private OffsetLateral_? : number | null
  private OffsetVertical_? : number | null
  private OffsetLongitudinal_? : number | null
  private BasisCurve_? : IfcCurve

  public get DistanceAlong() : IfcLengthMeasure | IfcParameterValue {
    if ( this.DistanceAlong_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 > = 
        this.extractReference( 0, 0, 3, false )

      if ( !( value instanceof IfcLengthMeasure ) && !( value instanceof IfcParameterValue ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.DistanceAlong_ = value as (IfcLengthMeasure | IfcParameterValue)

    }

    return this.DistanceAlong_ as IfcLengthMeasure | IfcParameterValue
  }

  public get OffsetLateral() : number | null {
    if ( this.OffsetLateral_ === void 0 ) {
      this.OffsetLateral_ = this.extractNumber( 1, 0, 3, true )
    }

    return this.OffsetLateral_ as number | null
  }

  public get OffsetVertical() : number | null {
    if ( this.OffsetVertical_ === void 0 ) {
      this.OffsetVertical_ = this.extractNumber( 2, 0, 3, true )
    }

    return this.OffsetVertical_ as number | null
  }

  public get OffsetLongitudinal() : number | null {
    if ( this.OffsetLongitudinal_ === void 0 ) {
      this.OffsetLongitudinal_ = this.extractNumber( 3, 0, 3, true )
    }

    return this.OffsetLongitudinal_ as number | null
  }

  public get BasisCurve() : IfcCurve {
    if ( this.BasisCurve_ === void 0 ) {
      this.BasisCurve_ = this.extractElement( 4, 0, 3, false, IfcCurve )
    }

    return this.BasisCurve_ as IfcCurve
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcPointByDistanceExpression.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcPointByDistanceExpression" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCPOINTBYDISTANCEEXPRESSION ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCPOINTBYDISTANCEEXPRESSION
}
