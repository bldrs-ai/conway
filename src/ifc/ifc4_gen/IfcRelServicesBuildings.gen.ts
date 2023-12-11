
import { IfcRelConnects } from "./index"
import { IfcSystem } from "./index"
import { IfcSpatialElement } from "./index"
import {
  stepExtractOptional,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrelservicesbuildings.htm */
export  class IfcRelServicesBuildings extends IfcRelConnects {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELSERVICESBUILDINGS
  }
  private RelatingSystem_? : IfcSystem
  private RelatedBuildings_? : Array<IfcSpatialElement>

  public get RelatingSystem() : IfcSystem {
    if ( this.RelatingSystem_ === void 0 ) {
      this.RelatingSystem_ = this.extractElement( 4, false, IfcSystem )
    }

    return this.RelatingSystem_ as IfcSystem
  }

  public get RelatedBuildings() : Array<IfcSpatialElement> {
    if ( this.RelatedBuildings_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 5 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcSpatialElement> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcSpatialElement )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.RelatedBuildings_ = value
    }

    return this.RelatedBuildings_ as Array<IfcSpatialElement>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELSERVICESBUILDINGS ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELSERVICESBUILDINGS
}
