
import { IfcGeometricRepresentationItem } from "./index"
import { IfcDirection } from "./index"
import { IfcCartesianPoint } from "./index"
import { IfcReal } from "./index"
import { IfcDimensionCount } from "./index"
import {
  NVL,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccartesiantransformationoperator.htm */
export abstract class IfcCartesianTransformationOperator extends IfcGeometricRepresentationItem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCARTESIANTRANSFORMATIONOPERATOR
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCARTESIANTRANSFORMATIONOPERATOR2D, EntityTypesIfc.IFCCARTESIANTRANSFORMATIONOPERATOR3D, EntityTypesIfc.IFCCARTESIANTRANSFORMATIONOPERATOR2DNONUNIFORM, EntityTypesIfc.IFCCARTESIANTRANSFORMATIONOPERATOR3DNONUNIFORM ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCARTESIANTRANSFORMATIONOPERATOR
}
