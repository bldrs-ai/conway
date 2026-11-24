
import { IfcMapConversion } from "./index"
import { IfcReal } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcMapConversionScaled extends IfcMapConversion {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCMAPCONVERSIONSCALED
  }
  private FactorX_? : number
  private FactorY_? : number
  private FactorZ_? : number

  public get FactorX() : number {
    if ( this.FactorX_ === void 0 ) {
      this.FactorX_ = this.extractNumber( 8, 8, 2, false )
    }

    return this.FactorX_ as number
  }

  public get FactorY() : number {
    if ( this.FactorY_ === void 0 ) {
      this.FactorY_ = this.extractNumber( 9, 8, 2, false )
    }

    return this.FactorY_ as number
  }

  public get FactorZ() : number {
    if ( this.FactorZ_ === void 0 ) {
      this.FactorZ_ = this.extractNumber( 10, 8, 2, false )
    }

    return this.FactorZ_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcMapConversionScaled.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcMapConversionScaled" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCMAPCONVERSIONSCALED ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCMAPCONVERSIONSCALED
}
