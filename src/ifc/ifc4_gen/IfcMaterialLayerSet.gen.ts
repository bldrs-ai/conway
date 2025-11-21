
import { IfcMaterialDefinition } from "./index"
import { IfcMaterialLayer } from "./index"
import { IfcLabel } from "./index"
import { IfcText } from "./index"
import { IfcLengthMeasure } from "./index"
import {
  stepExtractOptional,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
} from '../../step/parsing/step_deserialization_functions'
import {
  IfcMlsTotalThickness,
} from '../ifc_functions'

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcmateriallayerset.htm */
export  class IfcMaterialLayerSet extends IfcMaterialDefinition {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCMATERIALLAYERSET
  }
  private MaterialLayers_? : Array<IfcMaterialLayer>
  private LayerSetName_? : string | null
  private Description_? : string | null

  public get MaterialLayers() : Array<IfcMaterialLayer> {
    if ( this.MaterialLayers_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 0, 0, 1 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcMaterialLayer> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcMaterialLayer )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.MaterialLayers_ = value
    }

    return this.MaterialLayers_ as Array<IfcMaterialLayer>
  }

  public get LayerSetName() : string | null {
    if ( this.LayerSetName_ === void 0 ) {
      this.LayerSetName_ = this.extractString( 1, 0, 1, true )
    }

    return this.LayerSetName_ as string | null
  }

  public get Description() : string | null {
    if ( this.Description_ === void 0 ) {
      this.Description_ = this.extractString( 2, 0, 1, true )
    }

    return this.Description_ as string | null
  }

  public get TotalThickness() : number {
    return IfcMlsTotalThickness(this);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCMATERIALLAYERSET ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCMATERIALLAYERSET
}
