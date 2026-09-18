
import { IfcCurve } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcBoundedCurve extends IfcCurve {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCBOUNDEDCURVE
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcBoundedCurve.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcBoundedCurve" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCCOMPOSITECURVE, EntityTypesIfc4x3.IFCINDEXEDPOLYCURVE, EntityTypesIfc4x3.IFCPOLYLINE, EntityTypesIfc4x3.IFCTRIMMEDCURVE, EntityTypesIfc4x3.IFCBSPLINECURVEWITHKNOTS, EntityTypesIfc4x3.IFCRATIONALBSPLINECURVEWITHKNOTS, EntityTypesIfc4x3.IFCCOMPOSITECURVEONSURFACE, EntityTypesIfc4x3.IFCGRADIENTCURVE, EntityTypesIfc4x3.IFCSEGMENTEDREFERENCECURVE, EntityTypesIfc4x3.IFCBOUNDARYCURVE, EntityTypesIfc4x3.IFCOUTERBOUNDARYCURVE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCBOUNDEDCURVE
}
