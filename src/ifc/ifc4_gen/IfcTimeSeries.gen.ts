
import { IfcLabel } from "./index"
import { IfcText } from "./index"
import { IfcDateTime } from "./index"
import { IfcTimeSeriesDataTypeEnum, IfcTimeSeriesDataTypeEnumDeserializeStep } from "./index"
import { IfcDataOriginEnum, IfcDataOriginEnumDeserializeStep } from "./index"
import { IfcDerivedUnit } from "./index"
import { IfcMonetaryUnit } from "./index"
import { IfcNamedUnit } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifctimeseries.htm */
export abstract class IfcTimeSeries extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCTIMESERIES
  }
  private Name_? : string
  private Description_? : string | null
  private StartTime_? : string
  private EndTime_? : string
  private TimeSeriesDataType_? : IfcTimeSeriesDataTypeEnum
  private DataOrigin_? : IfcDataOriginEnum
  private UserDefinedDataOrigin_? : string | null
  private Unit_? : IfcDerivedUnit | IfcMonetaryUnit | IfcNamedUnit | null

  public get Name() : string {
    if ( this.Name_ === void 0 ) {
      this.Name_ = this.extractString( 0, 0, 0, false )
    }

    return this.Name_ as string
  }

  public get Description() : string | null {
    if ( this.Description_ === void 0 ) {
      this.Description_ = this.extractString( 1, 0, 0, true )
    }

    return this.Description_ as string | null
  }

  public get StartTime() : string {
    if ( this.StartTime_ === void 0 ) {
      this.StartTime_ = this.extractString( 2, 0, 0, false )
    }

    return this.StartTime_ as string
  }

  public get EndTime() : string {
    if ( this.EndTime_ === void 0 ) {
      this.EndTime_ = this.extractString( 3, 0, 0, false )
    }

    return this.EndTime_ as string
  }

  public get TimeSeriesDataType() : IfcTimeSeriesDataTypeEnum {
    if ( this.TimeSeriesDataType_ === void 0 ) {
      this.TimeSeriesDataType_ = this.extractLambda( 4, 0, 0, IfcTimeSeriesDataTypeEnumDeserializeStep, false )
    }

    return this.TimeSeriesDataType_ as IfcTimeSeriesDataTypeEnum
  }

  public get DataOrigin() : IfcDataOriginEnum {
    if ( this.DataOrigin_ === void 0 ) {
      this.DataOrigin_ = this.extractLambda( 5, 0, 0, IfcDataOriginEnumDeserializeStep, false )
    }

    return this.DataOrigin_ as IfcDataOriginEnum
  }

  public get UserDefinedDataOrigin() : string | null {
    if ( this.UserDefinedDataOrigin_ === void 0 ) {
      this.UserDefinedDataOrigin_ = this.extractString( 6, 0, 0, true )
    }

    return this.UserDefinedDataOrigin_ as string | null
  }

  public get Unit() : IfcDerivedUnit | IfcMonetaryUnit | IfcNamedUnit | null {
    if ( this.Unit_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc >| null = 
        this.extractReference( 7, 0, 0, true )

      if ( !( value instanceof IfcDerivedUnit ) && !( value instanceof IfcMonetaryUnit ) && !( value instanceof IfcNamedUnit ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.Unit_ = value as (IfcDerivedUnit | IfcMonetaryUnit | IfcNamedUnit)

    }

    return this.Unit_ as IfcDerivedUnit | IfcMonetaryUnit | IfcNamedUnit | null
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCIRREGULARTIMESERIES, EntityTypesIfc.IFCREGULARTIMESERIES ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCTIMESERIES
}
