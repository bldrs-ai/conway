
import { IfcLightSourcePositional } from "./index"
import { IfcDirection } from "./index"
import { IfcReal } from "./index"
import { IfcPositivePlaneAngleMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifclightsourcespot.htm */
export  class IfcLightSourceSpot extends IfcLightSourcePositional {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCLIGHTSOURCESPOT
  }
  private Orientation_? : IfcDirection
  private ConcentrationExponent_? : number | null
  private SpreadAngle_? : number
  private BeamWidthAngle_? : number

  public get Orientation() : IfcDirection {
    if ( this.Orientation_ === void 0 ) {
      this.Orientation_ = this.extractElement( 9, 9, 4, false, IfcDirection )
    }

    return this.Orientation_ as IfcDirection
  }

  public get ConcentrationExponent() : number | null {
    if ( this.ConcentrationExponent_ === void 0 ) {
      this.ConcentrationExponent_ = this.extractNumber( 10, 9, 4, true )
    }

    return this.ConcentrationExponent_ as number | null
  }

  public get SpreadAngle() : number {
    if ( this.SpreadAngle_ === void 0 ) {
      this.SpreadAngle_ = this.extractNumber( 11, 9, 4, false )
    }

    return this.SpreadAngle_ as number
  }

  public get BeamWidthAngle() : number {
    if ( this.BeamWidthAngle_ === void 0 ) {
      this.BeamWidthAngle_ = this.extractNumber( 12, 9, 4, false )
    }

    return this.BeamWidthAngle_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCLIGHTSOURCESPOT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCLIGHTSOURCESPOT
}
