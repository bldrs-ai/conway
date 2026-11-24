
import { IfcGeometricRepresentationItem } from "./index"
import { IfcDirection } from "./index"
import { IfcCartesianPoint } from "./index"
import { IfcReal } from "./index"
import { IfcDimensionCount } from "./index"
import {
  NVL,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcCartesianTransformationOperator extends IfcGeometricRepresentationItem {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCCARTESIANTRANSFORMATIONOPERATOR
  }
  private Axis1_? : IfcDirection | null
  private Axis2_? : IfcDirection | null
  private LocalOrigin_? : IfcCartesianPoint
  private Scale_? : number | null

  public get Axis1() : IfcDirection | null {
    if ( this.Axis1_ === void 0 ) {
      this.Axis1_ = this.extractElement( 0, 0, 2, true, IfcDirection )
    }

    return this.Axis1_ as IfcDirection | null
  }

  public get Axis2() : IfcDirection | null {
    if ( this.Axis2_ === void 0 ) {
      this.Axis2_ = this.extractElement( 1, 0, 2, true, IfcDirection )
    }

    return this.Axis2_ as IfcDirection | null
  }

  public get LocalOrigin() : IfcCartesianPoint {
    if ( this.LocalOrigin_ === void 0 ) {
      this.LocalOrigin_ = this.extractElement( 2, 0, 2, false, IfcCartesianPoint )
    }

    return this.LocalOrigin_ as IfcCartesianPoint
  }

  public get Scale() : number | null {
    if ( this.Scale_ === void 0 ) {
      this.Scale_ = this.extractNumber( 3, 0, 2, true )
    }

    return this.Scale_ as number | null
  }

  public get Scl() : number {
    return NVL(this?.Scale,1.0);
  }

  public get Dim() : number {
    return this?.LocalOrigin?.Dim;
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcCartesianTransformationOperator.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcCartesianTransformationOperator" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCCARTESIANTRANSFORMATIONOPERATOR2D, EntityTypesIfc4x3.IFCCARTESIANTRANSFORMATIONOPERATOR3D, EntityTypesIfc4x3.IFCCARTESIANTRANSFORMATIONOPERATOR2DNONUNIFORM, EntityTypesIfc4x3.IFCCARTESIANTRANSFORMATIONOPERATOR3DNONUNIFORM ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCCARTESIANTRANSFORMATIONOPERATOR
}
