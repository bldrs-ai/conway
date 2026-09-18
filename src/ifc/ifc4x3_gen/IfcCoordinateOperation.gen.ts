
import { IfcCoordinateReferenceSystem } from "./index"
import { IfcGeometricRepresentationContext } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcCoordinateOperation extends StepEntityBase< EntityTypesIfc4x3 > {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCCOORDINATEOPERATION
  }
  private SourceCRS_? : IfcCoordinateReferenceSystem | IfcGeometricRepresentationContext
  private TargetCRS_? : IfcCoordinateReferenceSystem

  public get SourceCRS() : IfcCoordinateReferenceSystem | IfcGeometricRepresentationContext {
    if ( this.SourceCRS_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 > = 
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcCoordinateOperation.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcCoordinateOperation" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCMAPCONVERSION, EntityTypesIfc4x3.IFCRIGIDOPERATION, EntityTypesIfc4x3.IFCMAPCONVERSIONSCALED ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCCOORDINATEOPERATION
}
