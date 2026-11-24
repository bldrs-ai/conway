
import { IfcLightSource } from "./index"
import { IfcCartesianPoint } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcReal } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcLightSourcePositional extends IfcLightSource {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCLIGHTSOURCEPOSITIONAL
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcLightSourcePositional.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcLightSourcePositional" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCLIGHTSOURCEPOSITIONAL, EntityTypesIfc4x3.IFCLIGHTSOURCESPOT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCLIGHTSOURCEPOSITIONAL
}
