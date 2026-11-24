
import { IfcStructuralConnectionCondition } from "./index"
import { IfcForceMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcFailureConnectionCondition extends IfcStructuralConnectionCondition {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCFAILURECONNECTIONCONDITION
  }
  private TensionFailureX_? : number | null
  private TensionFailureY_? : number | null
  private TensionFailureZ_? : number | null
  private CompressionFailureX_? : number | null
  private CompressionFailureY_? : number | null
  private CompressionFailureZ_? : number | null

  public get TensionFailureX() : number | null {
    if ( this.TensionFailureX_ === void 0 ) {
      this.TensionFailureX_ = this.extractNumber( 1, 1, 1, true )
    }

    return this.TensionFailureX_ as number | null
  }

  public get TensionFailureY() : number | null {
    if ( this.TensionFailureY_ === void 0 ) {
      this.TensionFailureY_ = this.extractNumber( 2, 1, 1, true )
    }

    return this.TensionFailureY_ as number | null
  }

  public get TensionFailureZ() : number | null {
    if ( this.TensionFailureZ_ === void 0 ) {
      this.TensionFailureZ_ = this.extractNumber( 3, 1, 1, true )
    }

    return this.TensionFailureZ_ as number | null
  }

  public get CompressionFailureX() : number | null {
    if ( this.CompressionFailureX_ === void 0 ) {
      this.CompressionFailureX_ = this.extractNumber( 4, 1, 1, true )
    }

    return this.CompressionFailureX_ as number | null
  }

  public get CompressionFailureY() : number | null {
    if ( this.CompressionFailureY_ === void 0 ) {
      this.CompressionFailureY_ = this.extractNumber( 5, 1, 1, true )
    }

    return this.CompressionFailureY_ as number | null
  }

  public get CompressionFailureZ() : number | null {
    if ( this.CompressionFailureZ_ === void 0 ) {
      this.CompressionFailureZ_ = this.extractNumber( 6, 1, 1, true )
    }

    return this.CompressionFailureZ_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcFailureConnectionCondition.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcFailureConnectionCondition" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCFAILURECONNECTIONCONDITION ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCFAILURECONNECTIONCONDITION
}
