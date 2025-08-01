
import { label } from "./index"
import { text } from "./index"
import { representation_item } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class item_defined_transformation extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.ITEM_DEFINED_TRANSFORMATION
  }
  private name_? : string
  private description_? : string | null
  private transform_item_1_? : representation_item
  private transform_item_2_? : representation_item

  public get name() : string {
    if ( this.name_ === void 0 ) {
      this.name_ = this.extractString( 0, 0, 0, false )
    }

    return this.name_ as string
  }

  public get description() : string | null {
    if ( this.description_ === void 0 ) {
      this.description_ = this.extractString( 1, 0, 0, true )
    }

    return this.description_ as string | null
  }

  public get transform_item_1() : representation_item {
    if ( this.transform_item_1_ === void 0 ) {
      this.transform_item_1_ = this.extractElement( 2, 0, 0, false, representation_item )
    }

    return this.transform_item_1_ as representation_item
  }

  public get transform_item_2() : representation_item {
    if ( this.transform_item_2_ === void 0 ) {
      this.transform_item_2_ = this.extractElement( 3, 0, 0, false, representation_item )
    }

    return this.transform_item_2_ as representation_item
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === item_defined_transformation.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for item_defined_transformation" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.ITEM_DEFINED_TRANSFORMATION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.ITEM_DEFINED_TRANSFORMATION
}
