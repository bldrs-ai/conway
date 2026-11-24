
import { IfcConnectionPointGeometry } from "./index"
import { IfcLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcConnectionPointEccentricity extends IfcConnectionPointGeometry {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCCONNECTIONPOINTECCENTRICITY
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcConnectionPointEccentricity.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcConnectionPointEccentricity" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCCONNECTIONPOINTECCENTRICITY ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCCONNECTIONPOINTECCENTRICITY
}
