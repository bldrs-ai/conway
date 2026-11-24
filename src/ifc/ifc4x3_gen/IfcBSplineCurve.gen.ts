
import { IfcBoundedCurve } from "./index"
import { IfcInteger } from "./index"
import { IfcCartesianPoint } from "./index"
import { IfcBSplineCurveForm, IfcBSplineCurveFormDeserializeStep } from "./index"
import { IfcLogical } from "./index"
import {
  stepExtractOptional,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
  SIZEOF,
} from '../../step/parsing/step_deserialization_functions'
import {
  IfcListToArray,
} from '../ifc4x3_functions'

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcBSplineCurve extends IfcBoundedCurve {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCBSPLINECURVE
  }
  private Degree_? : number
  private ControlPointsList_? : Array<IfcCartesianPoint>
  private CurveForm_? : IfcBSplineCurveForm
  private ClosedCurve_? : boolean | null
  private SelfIntersect_? : boolean | null

  public get Degree() : number {
    if ( this.Degree_ === void 0 ) {
      this.Degree_ = this.extractNumber( 0, 0, 4, false )
    }

    return this.Degree_ as number
  }

  public get ControlPointsList() : Array<IfcCartesianPoint> {
    if ( this.ControlPointsList_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 1, 0, 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcCartesianPoint> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcCartesianPoint )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.ControlPointsList_ = value
    }

    return this.ControlPointsList_ as Array<IfcCartesianPoint>
  }

  public get CurveForm() : IfcBSplineCurveForm {
    if ( this.CurveForm_ === void 0 ) {
      this.CurveForm_ = this.extractLambda( 2, 0, 4, IfcBSplineCurveFormDeserializeStep, false )
    }

    return this.CurveForm_ as IfcBSplineCurveForm
  }

  public get ClosedCurve() : boolean | null {
    if ( this.ClosedCurve_ === void 0 ) {
      this.ClosedCurve_ = this.extractLogical( 3, 0, 4, false )
    }

    return this.ClosedCurve_ as boolean | null
  }

  public get SelfIntersect() : boolean | null {
    if ( this.SelfIntersect_ === void 0 ) {
      this.SelfIntersect_ = this.extractLogical( 4, 0, 4, false )
    }

    return this.SelfIntersect_ as boolean | null
  }

  public get UpperIndexOnControlPoints() : number {
    return (SIZEOF(this?.ControlPointsList)-1);
  }

  public get ControlPoints() : Array<IfcCartesianPoint> {
    return IfcListToArray(this?.ControlPointsList,0,this?.UpperIndexOnControlPoints);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcBSplineCurve.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcBSplineCurve" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCBSPLINECURVEWITHKNOTS, EntityTypesIfc4x3.IFCRATIONALBSPLINECURVEWITHKNOTS ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCBSPLINECURVE
}
