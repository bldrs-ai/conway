
import { IfcGeometricRepresentationItem } from "./index"
import { IfcCurve } from "./index"
import { IfcPoint } from "./index"
import { IfcSurface } from "./index"
import { IfcDimensionCount } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcgeometricset.htm */
export  class IfcGeometricSet extends IfcGeometricRepresentationItem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCGEOMETRICSET
  }
  private Elements_? : Array<IfcCurve | IfcPoint | IfcSurface>

  public get Elements() : Array<IfcCurve | IfcPoint | IfcSurface> {
    if ( this.Elements_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 0, 0, 2 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcCurve | IfcPoint | IfcSurface> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesIfc > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof IfcCurve ) && !( value1Untyped instanceof IfcPoint ) && !( value1Untyped instanceof IfcSurface ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (IfcCurve | IfcPoint | IfcSurface)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.Elements_ = value
    }

    return this.Elements_ as Array<IfcCurve | IfcPoint | IfcSurface>
  }

  public get Dim() : number {
    return this?.Elements?.[1 - 1].Dim;
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCGEOMETRICSET, EntityTypesIfc.IFCGEOMETRICCURVESET ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCGEOMETRICSET
}
