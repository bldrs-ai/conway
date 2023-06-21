
import { IfcFacetedBrep } from "./index"
import { IfcClosedShell } from "./index"
import {
  stepExtractArray,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcfacetedbrepwithvoids.htm */
export  class IfcFacetedBrepWithVoids extends IfcFacetedBrep {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCFACETEDBREPWITHVOIDS
  }
  private Voids_? : Array<IfcClosedShell>

  public get Voids() : Array<IfcClosedShell> {
    if ( this.Voids_ === void 0 ) {
      this.Voids_ = this.extractLambda( 1, (buffer, cursor, endCursor) => {

      let value : Array<IfcClosedShell> = [];

      for ( let address of stepExtractArray( buffer, cursor, endCursor ) ) {
        value.push( (() => {
          const cursor = address
           let value = this.extractBufferReference( buffer, cursor, endCursor )
    
          if ( !( value instanceof IfcClosedShell ) )  {
            throw new Error( 'Value in STEP was incorrectly typed for field' )
          }
    
          return value
        })() )
      }
      return value }, false )
    }

    return this.Voids_ as Array<IfcClosedShell>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCFACETEDBREPWITHVOIDS ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCFACETEDBREPWITHVOIDS
}