
import { IfcCoordinateReferenceSystem } from "./index"
import { IfcGeometricRepresentationContext } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccoordinateoperation.htm */
export abstract class IfcCoordinateOperation extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCOORDINATEOPERATION
  }
  private SourceCRS_? : IfcCoordinateReferenceSystem | IfcGeometricRepresentationContext
  private TargetCRS_? : IfcCoordinateReferenceSystem

  public get SourceCRS() : IfcCoordinateReferenceSystem | IfcGeometricRepresentationContext {
    if ( this.SourceCRS_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc > = 
        this.extractReference( 0, 0, 0, false )

      if ( !( value instanceof IfcCoordinateReferenceSystem ) && !( value instanceof IfcGeometricRepresentationContext ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.SourceCRS_ = value as (IfcCoordinateReferenceSystem | IfcGeometricRepresentationContext)

    }

    return this.SourceCRS_ as IfcCoordinateReferenceSystem | IfcGeometricRepresentationContext
  }

  public get TargetCRS() : IfcCoordinateReferenceSystem {
    if ( this.TargetCRS_ === void 0 ) {
      this.TargetCRS_ = this.extractElement( 1, 0, 0, false, IfcCoordinateReferenceSystem )
    }

    return this.TargetCRS_ as IfcCoordinateReferenceSystem
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCMAPCONVERSION ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCOORDINATEOPERATION
}
