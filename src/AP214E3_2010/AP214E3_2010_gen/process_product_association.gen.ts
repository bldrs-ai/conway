
import { label } from "./index"
import { text } from "./index"
import { product_definition } from "./index"
import { product_definition_relationship } from "./index"
import { product_definition_process } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class process_product_association extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.PROCESS_PRODUCT_ASSOCIATION
  }
  private name_? : string
  private description_? : string
  private defined_product_? : product_definition | product_definition_relationship
  private process_? : product_definition_process

  public get name() : string {
    if ( this.name_ === void 0 ) {
      this.name_ = this.extractString( 0, false )
    }

    return this.name_ as string
  }

  public get description() : string {
    if ( this.description_ === void 0 ) {
      this.description_ = this.extractString( 1, false )
    }

    return this.description_ as string
  }

  public get defined_product() : product_definition | product_definition_relationship {
    if ( this.defined_product_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 2, false )

      if ( !( value instanceof product_definition ) && !( value instanceof product_definition_relationship ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.defined_product_ = value as (product_definition | product_definition_relationship)

    }

    return this.defined_product_ as product_definition | product_definition_relationship
  }

  public get process() : product_definition_process {
    if ( this.process_ === void 0 ) {
      this.process_ = this.extractElement( 3, false, product_definition_process )
    }

    return this.process_ as product_definition_process
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.PROCESS_PRODUCT_ASSOCIATION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.PROCESS_PRODUCT_ASSOCIATION
}
