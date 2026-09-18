
import { IfcResourceLevelRelationship } from "./index"
import { IfcProperty } from "./index"
import { IfcText } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcPropertyDependencyRelationship extends IfcResourceLevelRelationship {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCPROPERTYDEPENDENCYRELATIONSHIP
  }
  private DependingProperty_? : IfcProperty
  private DependantProperty_? : IfcProperty
  private Expression_? : string | null

  public get DependingProperty() : IfcProperty {
    if ( this.DependingProperty_ === void 0 ) {
      this.DependingProperty_ = this.extractElement( 2, 2, 1, false, IfcProperty )
    }

    return this.DependingProperty_ as IfcProperty
  }

  public get DependantProperty() : IfcProperty {
    if ( this.DependantProperty_ === void 0 ) {
      this.DependantProperty_ = this.extractElement( 3, 2, 1, false, IfcProperty )
    }

    return this.DependantProperty_ as IfcProperty
  }

  public get Expression() : string | null {
    if ( this.Expression_ === void 0 ) {
      this.Expression_ = this.extractString( 4, 2, 1, true )
    }

    return this.Expression_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcPropertyDependencyRelationship.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcPropertyDependencyRelationship" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCPROPERTYDEPENDENCYRELATIONSHIP ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCPROPERTYDEPENDENCYRELATIONSHIP
}
