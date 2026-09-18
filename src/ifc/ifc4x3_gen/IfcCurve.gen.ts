
import { IfcGeometricRepresentationItem } from "./index"
import { IfcDimensionCount } from "./index"
import {
  IfcCurveDim,
} from '../ifc4x3_functions'

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcCurve extends IfcGeometricRepresentationItem {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCCURVE
  }


  public get Dim() : number {
    return IfcCurveDim(this);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcCurve.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcCurve" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCLINE, EntityTypesIfc4x3.IFCPCURVE, EntityTypesIfc4x3.IFCPOLYNOMIALCURVE, EntityTypesIfc4x3.IFCSURFACECURVE, EntityTypesIfc4x3.IFCCOMPOSITECURVE, EntityTypesIfc4x3.IFCINDEXEDPOLYCURVE, EntityTypesIfc4x3.IFCPOLYLINE, EntityTypesIfc4x3.IFCTRIMMEDCURVE, EntityTypesIfc4x3.IFCBSPLINECURVEWITHKNOTS, EntityTypesIfc4x3.IFCRATIONALBSPLINECURVEWITHKNOTS, EntityTypesIfc4x3.IFCCOMPOSITECURVEONSURFACE, EntityTypesIfc4x3.IFCGRADIENTCURVE, EntityTypesIfc4x3.IFCSEGMENTEDREFERENCECURVE, EntityTypesIfc4x3.IFCBOUNDARYCURVE, EntityTypesIfc4x3.IFCOUTERBOUNDARYCURVE, EntityTypesIfc4x3.IFCCIRCLE, EntityTypesIfc4x3.IFCELLIPSE, EntityTypesIfc4x3.IFCOFFSETCURVE2D, EntityTypesIfc4x3.IFCOFFSETCURVE3D, EntityTypesIfc4x3.IFCOFFSETCURVEBYDISTANCES, EntityTypesIfc4x3.IFCCLOTHOID, EntityTypesIfc4x3.IFCCOSINESPIRAL, EntityTypesIfc4x3.IFCSECONDORDERPOLYNOMIALSPIRAL, EntityTypesIfc4x3.IFCSEVENTHORDERPOLYNOMIALSPIRAL, EntityTypesIfc4x3.IFCSINESPIRAL, EntityTypesIfc4x3.IFCTHIRDORDERPOLYNOMIALSPIRAL, EntityTypesIfc4x3.IFCINTERSECTIONCURVE, EntityTypesIfc4x3.IFCSEAMCURVE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCCURVE
}
