
import { IfcConnectionGeometry } from "./index"
import { IfcBoundedCurve } from "./index"
import { IfcEdgeCurve } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcconnectioncurvegeometry.htm */
export  class IfcConnectionCurveGeometry extends IfcConnectionGeometry {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCONNECTIONCURVEGEOMETRY
  }
  private CurveOnRelatingElement_? : IfcBoundedCurve | IfcEdgeCurve
  private CurveOnRelatedElement_? : IfcBoundedCurve | IfcEdgeCurve | null

  public get CurveOnRelatingElement() : IfcBoundedCurve | IfcEdgeCurve {
    if ( this.CurveOnRelatingElement_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc > = 
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
      
      const value : StepEntityBase< EntityTypesIfc >| null = 
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCONNECTIONCURVEGEOMETRY ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCONNECTIONCURVEGEOMETRY
}
