
import { IfcConnectionGeometry } from "./index"
import { IfcBoundedCurve } from "./index"
import { IfcEdgeCurve } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcConnectionCurveGeometry extends IfcConnectionGeometry {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCCONNECTIONCURVEGEOMETRY
  }
  private CurveOnRelatingElement_? : IfcBoundedCurve | IfcEdgeCurve
  private CurveOnRelatedElement_? : IfcBoundedCurve | IfcEdgeCurve | null

  public get CurveOnRelatingElement() : IfcBoundedCurve | IfcEdgeCurve {
    if ( this.CurveOnRelatingElement_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 > = 
        this.extractReference( 0, 0, 1, false )

      if ( !( value instanceof IfcBoundedCurve ) && !( value instanceof IfcEdgeCurve ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.CurveOnRelatingElement_ = value as (IfcBoundedCurve | IfcEdgeCurve)

    }

    return this.CurveOnRelatingElement_ as IfcBoundedCurve | IfcEdgeCurve
  }

  public get CurveOnRelatedElement() : IfcBoundedCurve | IfcEdgeCurve | null {
    if ( this.CurveOnRelatedElement_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 >| null = 
        this.extractReference( 1, 0, 1, true )

      if ( !( value instanceof IfcBoundedCurve ) && !( value instanceof IfcEdgeCurve ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.CurveOnRelatedElement_ = value as (IfcBoundedCurve | IfcEdgeCurve)

    }

    return this.CurveOnRelatedElement_ as IfcBoundedCurve | IfcEdgeCurve | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcConnectionCurveGeometry.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcConnectionCurveGeometry" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCCONNECTIONCURVEGEOMETRY ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCCONNECTIONCURVEGEOMETRY
}
