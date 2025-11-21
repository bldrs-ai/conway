
import { IfcShapeModel } from "./index"
import { IfcLabel } from "./index"
import { IfcText } from "./index"
import { IfcLogical } from "./index"
import { IfcProductDefinitionShape } from "./index"
import { IfcRepresentationMap } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcshapeaspect.htm */
export  class IfcShapeAspect extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSHAPEASPECT
  }
  private ShapeRepresentations_? : Array<IfcShapeModel>
  private Name_? : string | null
  private Description_? : string | null
  private ProductDefinitional_? : boolean | null
  private PartOfProductDefinitionShape_? : IfcProductDefinitionShape | IfcRepresentationMap | null

  public get ShapeRepresentations() : Array<IfcShapeModel> {
    if ( this.ShapeRepresentations_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 0, 0, 0 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcShapeModel> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcShapeModel )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.ShapeRepresentations_ = value
    }

    return this.ShapeRepresentations_ as Array<IfcShapeModel>
  }

  public get Name() : string | null {
    if ( this.Name_ === void 0 ) {
      this.Name_ = this.extractString( 1, 0, 0, true )
    }

    return this.Name_ as string | null
  }

  public get Description() : string | null {
    if ( this.Description_ === void 0 ) {
      this.Description_ = this.extractString( 2, 0, 0, true )
    }

    return this.Description_ as string | null
  }

  public get ProductDefinitional() : boolean | null {
    if ( this.ProductDefinitional_ === void 0 ) {
      this.ProductDefinitional_ = this.extractLogical( 3, 0, 0, false )
    }

    return this.ProductDefinitional_ as boolean | null
  }

  public get PartOfProductDefinitionShape() : IfcProductDefinitionShape | IfcRepresentationMap | null {
    if ( this.PartOfProductDefinitionShape_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc >| null = 
        this.extractReference( 4, 0, 0, true )

      if ( !( value instanceof IfcProductDefinitionShape ) && !( value instanceof IfcRepresentationMap ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.PartOfProductDefinitionShape_ = value as (IfcProductDefinitionShape | IfcRepresentationMap)

    }

    return this.PartOfProductDefinitionShape_ as IfcProductDefinitionShape | IfcRepresentationMap | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSHAPEASPECT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSHAPEASPECT
}
