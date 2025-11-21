
import { IfcResourceLevelRelationship } from "./index"
import { IfcProperty } from "./index"
import { IfcText } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcpropertydependencyrelationship.htm */
export  class IfcPropertyDependencyRelationship extends IfcResourceLevelRelationship {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCPROPERTYDEPENDENCYRELATIONSHIP
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCPROPERTYDEPENDENCYRELATIONSHIP ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCPROPERTYDEPENDENCYRELATIONSHIP
}
