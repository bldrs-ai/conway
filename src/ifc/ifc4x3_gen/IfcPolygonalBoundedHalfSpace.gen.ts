
import { IfcHalfSpaceSolid } from "./index"
import { IfcAxis2Placement3D } from "./index"
import { IfcBoundedCurve } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcPolygonalBoundedHalfSpace extends IfcHalfSpaceSolid {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCPOLYGONALBOUNDEDHALFSPACE
  }
  private Position_? : IfcAxis2Placement3D
  private PolygonalBoundary_? : IfcBoundedCurve

  public get Position() : IfcAxis2Placement3D {
    if ( this.Position_ === void 0 ) {
      this.Position_ = this.extractElement( 2, 2, 3, false, IfcAxis2Placement3D )
    }

    return this.Position_ as IfcAxis2Placement3D
  }

  public get PolygonalBoundary() : IfcBoundedCurve {
    if ( this.PolygonalBoundary_ === void 0 ) {
      this.PolygonalBoundary_ = this.extractElement( 3, 2, 3, false, IfcBoundedCurve )
    }

    return this.PolygonalBoundary_ as IfcBoundedCurve
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcPolygonalBoundedHalfSpace.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcPolygonalBoundedHalfSpace" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCPOLYGONALBOUNDEDHALFSPACE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCPOLYGONALBOUNDEDHALFSPACE
}
