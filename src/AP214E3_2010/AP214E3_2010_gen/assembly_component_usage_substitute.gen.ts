
import { label } from "./index"
import { text } from "./index"
import { assembly_component_usage } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class assembly_component_usage_substitute extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.ASSEMBLY_COMPONENT_USAGE_SUBSTITUTE
  }
  private name_? : string
  private definition_? : string | null
  private base_? : assembly_component_usage
  private substitute_? : assembly_component_usage

  public get name() : string {
    if ( this.name_ === void 0 ) {
      this.name_ = this.extractString( 0, 0, 0, false )
    }

    return this.name_ as string
  }

  public get definition() : string | null {
    if ( this.definition_ === void 0 ) {
      this.definition_ = this.extractString( 1, 0, 0, true )
    }

    return this.definition_ as string | null
  }

  public get base() : assembly_component_usage {
    if ( this.base_ === void 0 ) {
      this.base_ = this.extractElement( 2, 0, 0, false, assembly_component_usage )
    }

    return this.base_ as assembly_component_usage
  }

  public get substitute() : assembly_component_usage {
    if ( this.substitute_ === void 0 ) {
      this.substitute_ = this.extractElement( 3, 0, 0, false, assembly_component_usage )
    }

    return this.substitute_ as assembly_component_usage
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === assembly_component_usage_substitute.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for assembly_component_usage_substitute" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.ASSEMBLY_COMPONENT_USAGE_SUBSTITUTE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.ASSEMBLY_COMPONENT_USAGE_SUBSTITUTE
}
