
import { IfcSweptAreaSolid } from "./index"
import { IfcCurve } from "./index"
import { IfcLengthMeasure } from "./index"
import { IfcParameterValue } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcDirectrixCurveSweptAreaSolid extends IfcSweptAreaSolid {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCDIRECTRIXCURVESWEPTAREASOLID
  }
  private Directrix_? : IfcCurve
  private StartParam_? : IfcLengthMeasure | IfcParameterValue | null
  private EndParam_? : IfcLengthMeasure | IfcParameterValue | null

  public get Directrix() : IfcCurve {
    if ( this.Directrix_ === void 0 ) {
      this.Directrix_ = this.extractElement( 2, 2, 4, false, IfcCurve )
    }

    return this.Directrix_ as IfcCurve
  }

  public get StartParam() : IfcLengthMeasure | IfcParameterValue | null {
    if ( this.StartParam_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 >| null = 
        this.extractReference( 3, 2, 4, true )

      if ( !( value instanceof IfcLengthMeasure ) && !( value instanceof IfcParameterValue ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.StartParam_ = value as (IfcLengthMeasure | IfcParameterValue)

    }

    return this.StartParam_ as IfcLengthMeasure | IfcParameterValue | null
  }

  public get EndParam() : IfcLengthMeasure | IfcParameterValue | null {
    if ( this.EndParam_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 >| null = 
        this.extractReference( 4, 2, 4, true )

      if ( !( value instanceof IfcLengthMeasure ) && !( value instanceof IfcParameterValue ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.EndParam_ = value as (IfcLengthMeasure | IfcParameterValue)

    }

    return this.EndParam_ as IfcLengthMeasure | IfcParameterValue | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcDirectrixCurveSweptAreaSolid.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcDirectrixCurveSweptAreaSolid" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCFIXEDREFERENCESWEPTAREASOLID, EntityTypesIfc4x3.IFCSURFACECURVESWEPTAREASOLID, EntityTypesIfc4x3.IFCDIRECTRIXDERIVEDREFERENCESWEPTAREASOLID ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCDIRECTRIXCURVESWEPTAREASOLID
}
