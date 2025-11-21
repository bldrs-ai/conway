
import { IfcConnectionPointGeometry } from "./index"
import { IfcLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcconnectionpointeccentricity.htm */
export  class IfcConnectionPointEccentricity extends IfcConnectionPointGeometry {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCONNECTIONPOINTECCENTRICITY
  }
  private EccentricityInX_? : number | null
  private EccentricityInY_? : number | null
  private EccentricityInZ_? : number | null

  public get EccentricityInX() : number | null {
    if ( this.EccentricityInX_ === void 0 ) {
      this.EccentricityInX_ = this.extractNumber( 2, 2, 2, true )
    }

    return this.EccentricityInX_ as number | null
  }

  public get EccentricityInY() : number | null {
    if ( this.EccentricityInY_ === void 0 ) {
      this.EccentricityInY_ = this.extractNumber( 3, 2, 2, true )
    }

    return this.EccentricityInY_ as number | null
  }

  public get EccentricityInZ() : number | null {
    if ( this.EccentricityInZ_ === void 0 ) {
      this.EccentricityInZ_ = this.extractNumber( 4, 2, 2, true )
    }

    return this.EccentricityInZ_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCONNECTIONPOINTECCENTRICITY ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCONNECTIONPOINTECCENTRICITY
}
