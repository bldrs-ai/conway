
import { IfcSystem } from "./index"
import { IfcAnalysisModelTypeEnum, IfcAnalysisModelTypeEnumDeserializeStep } from "./index"
import { IfcAxis2Placement3D } from "./index"
import { IfcStructuralLoadGroup } from "./index"
import { IfcStructuralResultGroup } from "./index"
import { IfcObjectPlacement } from "./index"
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
export  class IfcStructuralAnalysisModel extends IfcSystem {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCSTRUCTURALANALYSISMODEL
  }
  private PredefinedType_? : IfcAnalysisModelTypeEnum
  private OrientationOf2DPlane_? : IfcAxis2Placement3D | null
  private LoadedBy_? : Array<IfcStructuralLoadGroup> | null
  private HasResults_? : Array<IfcStructuralResultGroup> | null
  private SharedPlacement_? : IfcObjectPlacement | null

  public get PredefinedType() : IfcAnalysisModelTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 5, 5, 5, IfcAnalysisModelTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcAnalysisModelTypeEnum
  }

  public get OrientationOf2DPlane() : IfcAxis2Placement3D | null {
    if ( this.OrientationOf2DPlane_ === void 0 ) {
      this.OrientationOf2DPlane_ = this.extractElement( 6, 5, 5, true, IfcAxis2Placement3D )
    }

    return this.OrientationOf2DPlane_ as IfcAxis2Placement3D | null
  }

  public get LoadedBy() : Array<IfcStructuralLoadGroup> | null {
    if ( this.LoadedBy_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 7, 5, 5 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return null
      }

      const value : Array<IfcStructuralLoadGroup> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcStructuralLoadGroup )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.LoadedBy_ = value
    }

    return this.LoadedBy_ as Array<IfcStructuralLoadGroup> | null
  }

  public get HasResults() : Array<IfcStructuralResultGroup> | null {
    if ( this.HasResults_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 8, 5, 5 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return null
      }

      const value : Array<IfcStructuralResultGroup> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcStructuralResultGroup )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.HasResults_ = value
    }

    return this.HasResults_ as Array<IfcStructuralResultGroup> | null
  }

  public get SharedPlacement() : IfcObjectPlacement | null {
    if ( this.SharedPlacement_ === void 0 ) {
      this.SharedPlacement_ = this.extractElement( 9, 5, 5, true, IfcObjectPlacement )
    }

    return this.SharedPlacement_ as IfcObjectPlacement | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcStructuralAnalysisModel.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcStructuralAnalysisModel" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCSTRUCTURALANALYSISMODEL ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCSTRUCTURALANALYSISMODEL
}
