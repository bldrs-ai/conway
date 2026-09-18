
import { IfcColourSpecification } from "./index"
import { IfcNormalisedRatioMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcColourRgb extends IfcColourSpecification {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCCOLOURRGB
  }
  private Red_? : number
  private Green_? : number
  private Blue_? : number

  public get Red() : number {
    if ( this.Red_ === void 0 ) {
      this.Red_ = this.extractNumber( 1, 1, 2, false )
    }

    return this.Red_ as number
  }

  public get Green() : number {
    if ( this.Green_ === void 0 ) {
      this.Green_ = this.extractNumber( 2, 1, 2, false )
    }

    return this.Green_ as number
  }

  public get Blue() : number {
    if ( this.Blue_ === void 0 ) {
      this.Blue_ = this.extractNumber( 3, 1, 2, false )
    }

    return this.Blue_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcColourRgb.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcColourRgb" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCCOLOURRGB ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCCOLOURRGB
}
