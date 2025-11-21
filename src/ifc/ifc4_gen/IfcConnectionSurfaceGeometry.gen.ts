
import { IfcConnectionGeometry } from "./index"
import { IfcFaceBasedSurfaceModel } from "./index"
import { IfcFaceSurface } from "./index"
import { IfcSurface } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcconnectionsurfacegeometry.htm */
export  class IfcConnectionSurfaceGeometry extends IfcConnectionGeometry {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCONNECTIONSURFACEGEOMETRY
  }
  private SurfaceOnRelatingElement_? : IfcFaceBasedSurfaceModel | IfcFaceSurface | IfcSurface
  private SurfaceOnRelatedElement_? : IfcFaceBasedSurfaceModel | IfcFaceSurface | IfcSurface | null

  public get SurfaceOnRelatingElement() : IfcFaceBasedSurfaceModel | IfcFaceSurface | IfcSurface {
    if ( this.SurfaceOnRelatingElement_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc > = 
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
      
      const value : StepEntityBase< EntityTypesIfc >| null = 
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCONNECTIONSURFACEGEOMETRY ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCONNECTIONSURFACEGEOMETRY
}
