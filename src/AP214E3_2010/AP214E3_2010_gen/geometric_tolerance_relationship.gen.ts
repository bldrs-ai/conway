
import { label } from "./index"
import { text } from "./index"
import { geometric_tolerance } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class geometric_tolerance_relationship extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.GEOMETRIC_TOLERANCE_RELATIONSHIP
  }
  private name_? : string
  private description_? : string
  private relating_geometric_tolerance_? : geometric_tolerance
  private related_geometric_tolerance_? : geometric_tolerance

  public get name() : string {
    if ( this.name_ === void 0 ) {
      this.name_ = this.extractString( 0, 0, 0, false )
    }

    return this.name_ as string
  }

  public get description() : string {
    if ( this.description_ === void 0 ) {
      this.description_ = this.extractString( 1, 0, 0, false )
    }

    return this.description_ as string
  }

  public get relating_geometric_tolerance() : geometric_tolerance {
    if ( this.relating_geometric_tolerance_ === void 0 ) {
      this.relating_geometric_tolerance_ = this.extractElement( 2, 0, 0, false, geometric_tolerance )
    }

    return this.relating_geometric_tolerance_ as geometric_tolerance
  }

  public get related_geometric_tolerance() : geometric_tolerance {
    if ( this.related_geometric_tolerance_ === void 0 ) {
      this.related_geometric_tolerance_ = this.extractElement( 3, 0, 0, false, geometric_tolerance )
    }

    return this.related_geometric_tolerance_ as geometric_tolerance
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === geometric_tolerance_relationship.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for geometric_tolerance_relationship" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.GEOMETRIC_TOLERANCE_RELATIONSHIP ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.GEOMETRIC_TOLERANCE_RELATIONSHIP
}
