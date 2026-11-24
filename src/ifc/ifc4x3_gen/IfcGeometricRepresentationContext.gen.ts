
import { IfcRepresentationContext } from "./index"
import { IfcDimensionCount } from "./index"
import { IfcReal } from "./index"
import { IfcAxis2Placement2D } from "./index"
import { IfcAxis2Placement3D } from "./index"
import { IfcDirection } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcGeometricRepresentationContext extends IfcRepresentationContext {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCGEOMETRICREPRESENTATIONCONTEXT
  }
  private CoordinateSpaceDimension_? : number
  private Precision_? : number | null
  private WorldCoordinateSystem_? : IfcAxis2Placement2D | IfcAxis2Placement3D
  private TrueNorth_? : IfcDirection | null

  public get CoordinateSpaceDimension() : number {
    if ( this.CoordinateSpaceDimension_ === void 0 ) {
      this.CoordinateSpaceDimension_ = this.extractNumber( 2, 2, 1, false )
    }

    return this.CoordinateSpaceDimension_ as number
  }

  public get Precision() : number | null {
    if ( this.Precision_ === void 0 ) {
      this.Precision_ = this.extractNumber( 3, 2, 1, true )
    }

    return this.Precision_ as number | null
  }

  public get WorldCoordinateSystem() : IfcAxis2Placement2D | IfcAxis2Placement3D {
    if ( this.WorldCoordinateSystem_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 > = 
        this.extractReference( 4, 2, 1, false )

      if ( !( value instanceof IfcAxis2Placement2D ) && !( value instanceof IfcAxis2Placement3D ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.WorldCoordinateSystem_ = value as (IfcAxis2Placement2D | IfcAxis2Placement3D)

    }

    return this.WorldCoordinateSystem_ as IfcAxis2Placement2D | IfcAxis2Placement3D
  }

  public get TrueNorth() : IfcDirection | null {
    if ( this.TrueNorth_ === void 0 ) {
      this.TrueNorth_ = this.extractElement( 5, 2, 1, true, IfcDirection )
    }

    return this.TrueNorth_ as IfcDirection | null
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcGeometricRepresentationContext.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcGeometricRepresentationContext" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCGEOMETRICREPRESENTATIONCONTEXT, EntityTypesIfc4x3.IFCGEOMETRICREPRESENTATIONSUBCONTEXT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCGEOMETRICREPRESENTATIONCONTEXT
}
