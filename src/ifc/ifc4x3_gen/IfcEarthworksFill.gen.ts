
import { IfcEarthworksElement } from "./index"
import { IfcEarthworksFillTypeEnum, IfcEarthworksFillTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcEarthworksFill extends IfcEarthworksElement {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCEARTHWORKSFILL
  }
  private PredefinedType_? : IfcEarthworksFillTypeEnum | null

  public get PredefinedType() : IfcEarthworksFillTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 7, IfcEarthworksFillTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcEarthworksFillTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcEarthworksFill.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcEarthworksFill" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCEARTHWORKSFILL ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCEARTHWORKSFILL
}
