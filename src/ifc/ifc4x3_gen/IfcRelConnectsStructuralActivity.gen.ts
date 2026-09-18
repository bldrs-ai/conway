
import { IfcRelConnects } from "./index"
import { IfcElement } from "./index"
import { IfcStructuralItem } from "./index"
import { IfcStructuralActivity } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcRelConnectsStructuralActivity extends IfcRelConnects {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCRELCONNECTSSTRUCTURALACTIVITY
  }
  private RelatingElement_? : IfcElement | IfcStructuralItem
  private RelatedStructuralActivity_? : IfcStructuralActivity

  public get RelatingElement() : IfcElement | IfcStructuralItem {
    if ( this.RelatingElement_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 > = 
        this.extractReference( 4, 4, 3, false )

      if ( !( value instanceof IfcElement ) && !( value instanceof IfcStructuralItem ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.RelatingElement_ = value as (IfcElement | IfcStructuralItem)

    }

    return this.RelatingElement_ as IfcElement | IfcStructuralItem
  }

  public get RelatedStructuralActivity() : IfcStructuralActivity {
    if ( this.RelatedStructuralActivity_ === void 0 ) {
      this.RelatedStructuralActivity_ = this.extractElement( 5, 4, 3, false, IfcStructuralActivity )
    }

    return this.RelatedStructuralActivity_ as IfcStructuralActivity
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcRelConnectsStructuralActivity.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcRelConnectsStructuralActivity" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCRELCONNECTSSTRUCTURALACTIVITY ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCRELCONNECTSSTRUCTURALACTIVITY
}
