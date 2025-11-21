
import { IfcGeometricRepresentationItem } from "./index"
import { IfcCurveStyle } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcVector } from "./index"
import { IfcCartesianPoint } from "./index"
import { IfcPlaneAngleMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcfillareastylehatching.htm */
export  class IfcFillAreaStyleHatching extends IfcGeometricRepresentationItem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCFILLAREASTYLEHATCHING
  }
  private HatchLineAppearance_? : IfcCurveStyle
  private StartOfNextHatchLine_? : IfcPositiveLengthMeasure | IfcVector
  private PointOfReferenceHatchLine_? : IfcCartesianPoint | null
  private PatternStart_? : IfcCartesianPoint | null
  private HatchLineAngle_? : number

  public get HatchLineAppearance() : IfcCurveStyle {
    if ( this.HatchLineAppearance_ === void 0 ) {
      this.HatchLineAppearance_ = this.extractElement( 0, 0, 2, false, IfcCurveStyle )
    }

    return this.HatchLineAppearance_ as IfcCurveStyle
  }

  public get StartOfNextHatchLine() : IfcPositiveLengthMeasure | IfcVector {
    if ( this.StartOfNextHatchLine_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc > = 
        this.extractReference( 1, 0, 2, false )

      if ( !( value instanceof IfcPositiveLengthMeasure ) && !( value instanceof IfcVector ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.StartOfNextHatchLine_ = value as (IfcPositiveLengthMeasure | IfcVector)

    }

    return this.StartOfNextHatchLine_ as IfcPositiveLengthMeasure | IfcVector
  }

  public get PointOfReferenceHatchLine() : IfcCartesianPoint | null {
    if ( this.PointOfReferenceHatchLine_ === void 0 ) {
      this.PointOfReferenceHatchLine_ = this.extractElement( 2, 0, 2, true, IfcCartesianPoint )
    }

    return this.PointOfReferenceHatchLine_ as IfcCartesianPoint | null
  }

  public get PatternStart() : IfcCartesianPoint | null {
    if ( this.PatternStart_ === void 0 ) {
      this.PatternStart_ = this.extractElement( 3, 0, 2, true, IfcCartesianPoint )
    }

    return this.PatternStart_ as IfcCartesianPoint | null
  }

  public get HatchLineAngle() : number {
    if ( this.HatchLineAngle_ === void 0 ) {
      this.HatchLineAngle_ = this.extractNumber( 4, 0, 2, false )
    }

    return this.HatchLineAngle_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCFILLAREASTYLEHATCHING ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCFILLAREASTYLEHATCHING
}
