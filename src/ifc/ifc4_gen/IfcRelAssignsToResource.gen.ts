
import { IfcRelAssigns } from "./index"
import { IfcResource } from "./index"
import { IfcTypeResource } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrelassignstoresource.htm */
export  class IfcRelAssignsToResource extends IfcRelAssigns {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELASSIGNSTORESOURCE
  }
  private RelatingResource_? : IfcResource | IfcTypeResource

  public get RelatingResource() : IfcResource | IfcTypeResource {
    if ( this.RelatingResource_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc > = 
        this.extractReference( 6, 6, 3, false )

      if ( !( value instanceof IfcResource ) && !( value instanceof IfcTypeResource ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.RelatingResource_ = value as (IfcResource | IfcTypeResource)

    }

    return this.RelatingResource_ as IfcResource | IfcTypeResource
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELASSIGNSTORESOURCE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELASSIGNSTORESOURCE
}
