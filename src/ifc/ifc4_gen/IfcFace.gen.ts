
import { IfcTopologicalRepresentationItem } from "./index"
import { IfcFaceBound } from "./index"
import {
  stepExtractArray,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcface.htm */
export  class IfcFace extends IfcTopologicalRepresentationItem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCFACE
  }
  private Bounds_? : Array<IfcFaceBound>

  public get Bounds() : Array<IfcFaceBound> {
    if ( this.Bounds_ === void 0 ) {
      this.Bounds_ = this.extractLambda( 0, (buffer, cursor, endCursor) => {

      let value : Array<IfcFaceBound> = [];

      for ( let address of stepExtractArray( buffer, cursor, endCursor ) ) {
        value.push( (() => {
          const cursor = address
           let value = this.extractBufferReference( buffer, cursor, endCursor )
    
          if ( !( value instanceof IfcFaceBound ) )  {
            throw new Error( 'Value in STEP was incorrectly typed for field' )
          }
    
          return value
        })() )
      }
      return value }, false )
    }

    return this.Bounds_ as Array<IfcFaceBound>
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCFACE, EntityTypesIfc.IFCFACESURFACE, EntityTypesIfc.IFCADVANCEDFACE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCFACE
}