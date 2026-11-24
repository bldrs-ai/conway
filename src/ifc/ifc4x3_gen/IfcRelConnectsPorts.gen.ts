
import { IfcRelConnects } from "./index"
import { IfcPort } from "./index"
import { IfcElement } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcRelConnectsPorts extends IfcRelConnects {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCRELCONNECTSPORTS
  }
  private RelatingPort_? : IfcPort
  private RelatedPort_? : IfcPort
  private RealizingElement_? : IfcElement | null

  public get RelatingPort() : IfcPort {
    if ( this.RelatingPort_ === void 0 ) {
      this.RelatingPort_ = this.extractElement( 4, 4, 3, false, IfcPort )
    }

    return this.RelatingPort_ as IfcPort
  }

  public get RelatedPort() : IfcPort {
    if ( this.RelatedPort_ === void 0 ) {
      this.RelatedPort_ = this.extractElement( 5, 4, 3, false, IfcPort )
    }

    return this.RelatedPort_ as IfcPort
  }

  public get RealizingElement() : IfcElement | null {
    if ( this.RealizingElement_ === void 0 ) {
      this.RealizingElement_ = this.extractElement( 6, 4, 3, true, IfcElement )
    }

    return this.RealizingElement_ as IfcElement | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcRelConnectsPorts.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcRelConnectsPorts" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCRELCONNECTSPORTS ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCRELCONNECTSPORTS
}
