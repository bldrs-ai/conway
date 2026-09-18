
import { IfcEarthworksElement } from "./index"
import { IfcReinforcedSoilTypeEnum, IfcReinforcedSoilTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcReinforcedSoil extends IfcEarthworksElement {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCREINFORCEDSOIL
  }
  private PredefinedType_? : IfcReinforcedSoilTypeEnum | null

  public get PredefinedType() : IfcReinforcedSoilTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 7, IfcReinforcedSoilTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcReinforcedSoilTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcReinforcedSoil.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcReinforcedSoil" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCREINFORCEDSOIL ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCREINFORCEDSOIL
}
