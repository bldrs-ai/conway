
import { IfcLightSource } from "./index"
import { IfcCartesianPoint } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcReal } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifclightsourcepositional.htm */
export  class IfcLightSourcePositional extends IfcLightSource {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCLIGHTSOURCEPOSITIONAL
  }
  private Position_? : IfcCartesianPoint
  private Radius_? : number
  private ConstantAttenuation_? : number
  private DistanceAttenuation_? : number
  private QuadricAttenuation_? : number

  public get Position() : IfcCartesianPoint {
    if ( this.Position_ === void 0 ) {
      this.Position_ = this.extractElement( 4, 4, 3, false, IfcCartesianPoint )
    }

    return this.Position_ as IfcCartesianPoint
  }

  public get Radius() : number {
    if ( this.Radius_ === void 0 ) {
      this.Radius_ = this.extractNumber( 5, 4, 3, false )
    }

    return this.Radius_ as number
  }

  public get ConstantAttenuation() : number {
    if ( this.ConstantAttenuation_ === void 0 ) {
      this.ConstantAttenuation_ = this.extractNumber( 6, 4, 3, false )
    }

    return this.ConstantAttenuation_ as number
  }

  public get DistanceAttenuation() : number {
    if ( this.DistanceAttenuation_ === void 0 ) {
      this.DistanceAttenuation_ = this.extractNumber( 7, 4, 3, false )
    }

    return this.DistanceAttenuation_ as number
  }

  public get QuadricAttenuation() : number {
    if ( this.QuadricAttenuation_ === void 0 ) {
      this.QuadricAttenuation_ = this.extractNumber( 8, 4, 3, false )
    }

    return this.QuadricAttenuation_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCLIGHTSOURCEPOSITIONAL, EntityTypesIfc.IFCLIGHTSOURCESPOT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCLIGHTSOURCEPOSITIONAL
}
