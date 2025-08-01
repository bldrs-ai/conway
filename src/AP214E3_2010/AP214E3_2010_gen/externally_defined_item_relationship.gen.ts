
import { label } from "./index"
import { text } from "./index"
import { externally_defined_item } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class externally_defined_item_relationship extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.EXTERNALLY_DEFINED_ITEM_RELATIONSHIP
  }
  private name_? : string
  private description_? : string | null
  private relating_item_? : externally_defined_item
  private related_item_? : externally_defined_item

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

  public get relating_item() : externally_defined_item {
    if ( this.relating_item_ === void 0 ) {
      this.relating_item_ = this.extractElement( 2, 0, 0, false, externally_defined_item )
    }

    return this.relating_item_ as externally_defined_item
  }

  public get related_item() : externally_defined_item {
    if ( this.related_item_ === void 0 ) {
      this.related_item_ = this.extractElement( 3, 0, 0, false, externally_defined_item )
    }

    return this.related_item_ as externally_defined_item
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === externally_defined_item_relationship.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for externally_defined_item_relationship" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.EXTERNALLY_DEFINED_ITEM_RELATIONSHIP ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.EXTERNALLY_DEFINED_ITEM_RELATIONSHIP
}
