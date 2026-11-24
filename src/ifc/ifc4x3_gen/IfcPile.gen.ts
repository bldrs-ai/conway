
import { IfcDeepFoundation } from "./index"
import { IfcPileTypeEnum, IfcPileTypeEnumDeserializeStep } from "./index"
import { IfcPileConstructionEnum, IfcPileConstructionEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcPile extends IfcDeepFoundation {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCPILE
  }
  private PredefinedType_? : IfcPileTypeEnum | null
  private ConstructionType_? : IfcPileConstructionEnum | null

  public get PredefinedType() : IfcPileTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 7, IfcPileTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcPileTypeEnum | null
  }

  public get ConstructionType() : IfcPileConstructionEnum | null {
    if ( this.ConstructionType_ === void 0 ) {
      this.ConstructionType_ = this.extractLambda( 9, 8, 7, IfcPileConstructionEnumDeserializeStep, true )
    }

    return this.ConstructionType_ as IfcPileConstructionEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcPile.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcPile" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCPILE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCPILE
}
