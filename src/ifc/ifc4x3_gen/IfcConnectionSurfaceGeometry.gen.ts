
import { IfcConnectionGeometry } from "./index"
import { IfcFaceBasedSurfaceModel } from "./index"
import { IfcFaceSurface } from "./index"
import { IfcSurface } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcConnectionSurfaceGeometry extends IfcConnectionGeometry {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCCONNECTIONSURFACEGEOMETRY
  }
  private SurfaceOnRelatingElement_? : IfcFaceBasedSurfaceModel | IfcFaceSurface | IfcSurface
  private SurfaceOnRelatedElement_? : IfcFaceBasedSurfaceModel | IfcFaceSurface | IfcSurface | null

  public get SurfaceOnRelatingElement() : IfcFaceBasedSurfaceModel | IfcFaceSurface | IfcSurface {
    if ( this.SurfaceOnRelatingElement_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 > = 
        this.extractReference( 0, 0, 1, false )

      if ( !( value instanceof IfcFaceBasedSurfaceModel ) && !( value instanceof IfcFaceSurface ) && !( value instanceof IfcSurface ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.SurfaceOnRelatingElement_ = value as (IfcFaceBasedSurfaceModel | IfcFaceSurface | IfcSurface)

    }

    return this.SurfaceOnRelatingElement_ as IfcFaceBasedSurfaceModel | IfcFaceSurface | IfcSurface
  }

  public get SurfaceOnRelatedElement() : IfcFaceBasedSurfaceModel | IfcFaceSurface | IfcSurface | null {
    if ( this.SurfaceOnRelatedElement_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 >| null = 
        this.extractReference( 1, 0, 1, true )

      if ( !( value instanceof IfcFaceBasedSurfaceModel ) && !( value instanceof IfcFaceSurface ) && !( value instanceof IfcSurface ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.SurfaceOnRelatedElement_ = value as (IfcFaceBasedSurfaceModel | IfcFaceSurface | IfcSurface)

    }

    return this.SurfaceOnRelatedElement_ as IfcFaceBasedSurfaceModel | IfcFaceSurface | IfcSurface | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcConnectionSurfaceGeometry.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcConnectionSurfaceGeometry" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCCONNECTIONSURFACEGEOMETRY ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCCONNECTIONSURFACEGEOMETRY
}
