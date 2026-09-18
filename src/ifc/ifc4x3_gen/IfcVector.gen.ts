
import { IfcGeometricRepresentationItem } from "./index"
import { IfcDirection } from "./index"
import { IfcLengthMeasure } from "./index"
import { IfcDimensionCount } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcVector extends IfcGeometricRepresentationItem {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCVECTOR
  }
  private Orientation_? : IfcDirection
  private Magnitude_? : number

  public get Orientation() : IfcDirection {
    if ( this.Orientation_ === void 0 ) {
      this.Orientation_ = this.extractElement( 0, 0, 2, false, IfcDirection )
    }

    return this.Orientation_ as IfcDirection
  }

  public get Magnitude() : number {
    if ( this.Magnitude_ === void 0 ) {
      this.Magnitude_ = this.extractNumber( 1, 0, 2, false )
    }

    return this.Magnitude_ as number
  }

  public get Dim() : number {
    return this?.Orientation?.Dim;
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcVector.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcVector" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCVECTOR ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCVECTOR
}
