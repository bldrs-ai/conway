
import { IfcRepresentationContext } from "./index"
import { IfcDimensionCount } from "./index"
import { IfcReal } from "./index"
import { IfcAxis2Placement2D } from "./index"
import { IfcAxis2Placement3D } from "./index"
import { IfcDirection } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcgeometricrepresentationcontext.htm */
export  class IfcGeometricRepresentationContext extends IfcRepresentationContext {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCGEOMETRICREPRESENTATIONCONTEXT
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
      
      const value : StepEntityBase< EntityTypesIfc > = 
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCGEOMETRICREPRESENTATIONCONTEXT, EntityTypesIfc.IFCGEOMETRICREPRESENTATIONSUBCONTEXT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCGEOMETRICREPRESENTATIONCONTEXT
}
