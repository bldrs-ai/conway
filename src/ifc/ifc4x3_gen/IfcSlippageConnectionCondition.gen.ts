
import { IfcStructuralConnectionCondition } from "./index"
import { IfcLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcSlippageConnectionCondition extends IfcStructuralConnectionCondition {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCSLIPPAGECONNECTIONCONDITION
  }
  private SlippageX_? : number | null
  private SlippageY_? : number | null
  private SlippageZ_? : number | null

  public get SlippageX() : number | null {
    if ( this.SlippageX_ === void 0 ) {
      this.SlippageX_ = this.extractNumber( 1, 1, 1, true )
    }

    return this.SlippageX_ as number | null
  }

  public get SlippageY() : number | null {
    if ( this.SlippageY_ === void 0 ) {
      this.SlippageY_ = this.extractNumber( 2, 1, 1, true )
    }

    return this.SlippageY_ as number | null
  }

  public get SlippageZ() : number | null {
    if ( this.SlippageZ_ === void 0 ) {
      this.SlippageZ_ = this.extractNumber( 3, 1, 1, true )
    }

    return this.SlippageZ_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcSlippageConnectionCondition.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcSlippageConnectionCondition" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCSLIPPAGECONNECTIONCONDITION ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCSLIPPAGECONNECTIONCONDITION
}
