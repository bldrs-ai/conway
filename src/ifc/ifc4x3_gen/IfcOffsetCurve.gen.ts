
import { IfcCurve } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcOffsetCurve extends IfcCurve {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCOFFSETCURVE
  }
  private BasisCurve_? : IfcCurve

  public get BasisCurve() : IfcCurve {
    if ( this.BasisCurve_ === void 0 ) {
      this.BasisCurve_ = this.extractElement( 0, 0, 3, false, IfcCurve )
    }

    return this.BasisCurve_ as IfcCurve
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcOffsetCurve.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcOffsetCurve" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCOFFSETCURVE2D, EntityTypesIfc4x3.IFCOFFSETCURVE3D, EntityTypesIfc4x3.IFCOFFSETCURVEBYDISTANCES ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCOFFSETCURVE
}
