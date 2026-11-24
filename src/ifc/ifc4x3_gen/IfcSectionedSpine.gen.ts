
import { IfcGeometricRepresentationItem } from "./index"
import { IfcCompositeCurve } from "./index"
import { IfcProfileDef } from "./index"
import { IfcAxis2Placement3D } from "./index"
import { IfcDimensionCount } from "./index"
import {
  stepExtractOptional,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcSectionedSpine extends IfcGeometricRepresentationItem {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCSECTIONEDSPINE
  }
  private SpineCurve_? : IfcCompositeCurve
  private CrossSections_? : Array<IfcProfileDef>
  private CrossSectionPositions_? : Array<IfcAxis2Placement3D>

  public get SpineCurve() : IfcCompositeCurve {
    if ( this.SpineCurve_ === void 0 ) {
      this.SpineCurve_ = this.extractElement( 0, 0, 2, false, IfcCompositeCurve )
    }

    return this.SpineCurve_ as IfcCompositeCurve
  }

  public get CrossSections() : Array<IfcProfileDef> {
    if ( this.CrossSections_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 1, 0, 2 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcProfileDef> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcProfileDef )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.CrossSections_ = value
    }

    return this.CrossSections_ as Array<IfcProfileDef>
  }

  public get CrossSectionPositions() : Array<IfcAxis2Placement3D> {
    if ( this.CrossSectionPositions_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 2, 0, 2 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcAxis2Placement3D> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcAxis2Placement3D )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.CrossSectionPositions_ = value
    }

    return this.CrossSectionPositions_ as Array<IfcAxis2Placement3D>
  }

  public get Dim() : number {
    return 3;
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcSectionedSpine.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcSectionedSpine" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCSECTIONEDSPINE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCSECTIONEDSPINE
}
