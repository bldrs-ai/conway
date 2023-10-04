
import { IfcReinforcingElementType } from "./index"
import { IfcReinforcingBarTypeEnum, IfcReinforcingBarTypeEnumDeserializeStep } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcAreaMeasure } from "./index"
import { IfcReinforcingBarSurfaceEnum, IfcReinforcingBarSurfaceEnumDeserializeStep } from "./index"
import { IfcLabel } from "./index"
import { IfcLengthMeasure } from "./index"
import { IfcPlaneAngleMeasure } from "./index"
import {
  stepExtractOptional,
  stepExtractArray,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcreinforcingbartype.htm */
export  class IfcReinforcingBarType extends IfcReinforcingElementType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCREINFORCINGBARTYPE
  }
  private PredefinedType_? : IfcReinforcingBarTypeEnum
  private NominalDiameter_? : number | null
  private CrossSectionArea_? : number | null
  private BarLength_? : number | null
  private BarSurface_? : IfcReinforcingBarSurfaceEnum | null
  private BendingShapeCode_? : string | null
  private BendingParameters_? : Array<IfcLengthMeasure | IfcPlaneAngleMeasure> | null

  public get PredefinedType() : IfcReinforcingBarTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, IfcReinforcingBarTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcReinforcingBarTypeEnum
  }

  public get NominalDiameter() : number | null {
    if ( this.NominalDiameter_ === void 0 ) {
      this.NominalDiameter_ = this.extractNumber( 10, true )
    }

    return this.NominalDiameter_ as number | null
  }

  public get CrossSectionArea() : number | null {
    if ( this.CrossSectionArea_ === void 0 ) {
      this.CrossSectionArea_ = this.extractNumber( 11, true )
    }

    return this.CrossSectionArea_ as number | null
  }

  public get BarLength() : number | null {
    if ( this.BarLength_ === void 0 ) {
      this.BarLength_ = this.extractNumber( 12, true )
    }

    return this.BarLength_ as number | null
  }

  public get BarSurface() : IfcReinforcingBarSurfaceEnum | null {
    if ( this.BarSurface_ === void 0 ) {
      this.BarSurface_ = this.extractLambda( 13, IfcReinforcingBarSurfaceEnumDeserializeStep, true )
    }

    return this.BarSurface_ as IfcReinforcingBarSurfaceEnum | null
  }

  public get BendingShapeCode() : string | null {
    if ( this.BendingShapeCode_ === void 0 ) {
      this.BendingShapeCode_ = this.extractString( 14, true )
    }

    return this.BendingShapeCode_ as string | null
  }

  public get BendingParameters() : Array<IfcLengthMeasure | IfcPlaneAngleMeasure> | null {
    if ( this.BendingParameters_ === void 0 ) {
      this.BendingParameters_ = this.extractLambda( 15, (buffer, cursor, endCursor) => {

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return null
      }

      let value : Array<IfcLengthMeasure | IfcPlaneAngleMeasure> = [];

      for ( let address of stepExtractArray( buffer, cursor, endCursor ) ) {
        value.push( (() => {
          const cursor = address
          const value : StepEntityBase< EntityTypesIfc > | undefined =
            this.extractBufferReference( buffer, cursor, endCursor )
    
          if ( !( value instanceof IfcLengthMeasure ) && !( value instanceof IfcPlaneAngleMeasure ) ) {
            throw new Error( 'Value in select must be populated' )
          }
          return value as (IfcLengthMeasure | IfcPlaneAngleMeasure)})() )
      }
      return value }, true )
    }

    return this.BendingParameters_ as Array<IfcLengthMeasure | IfcPlaneAngleMeasure> | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCREINFORCINGBARTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCREINFORCINGBARTYPE
}
