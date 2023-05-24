
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
      this.RelatingResource_ = this.extractLambda( 6, (buffer, cursor, endCursor) => {

      const value : StepEntityBase< EntityTypesIfc > | undefined =
        this.extractBufferReference( buffer, cursor, endCursor )

      if ( !( value instanceof IfcResource ) && !( value instanceof IfcTypeResource ) ) {
        return ( void 0 )
      }
      return value as (IfcResource | IfcTypeResource)
}, false )
    }

    return this.RelatingResource_ as IfcResource | IfcTypeResource
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELASSIGNSTORESOURCE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELASSIGNSTORESOURCE
}
