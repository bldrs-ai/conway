
import { IfcSolidModel } from "./index"
import { IfcCurve } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcParameterValue } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcSweptDiskSolid extends IfcSolidModel {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCSWEPTDISKSOLID
  }
  private Directrix_? : IfcCurve
  private Radius_? : number
  private InnerRadius_? : number | null
  private StartParam_? : number | null
  private EndParam_? : number | null

  public get Directrix() : IfcCurve {
    if ( this.Directrix_ === void 0 ) {
      this.Directrix_ = this.extractElement( 0, 0, 3, false, IfcCurve )
    }

    return this.Directrix_ as IfcCurve
  }

  public get Radius() : number {
    if ( this.Radius_ === void 0 ) {
      this.Radius_ = this.extractNumber( 1, 0, 3, false )
    }

    return this.Radius_ as number
  }

  public get InnerRadius() : number | null {
    if ( this.InnerRadius_ === void 0 ) {
      this.InnerRadius_ = this.extractNumber( 2, 0, 3, true )
    }

    return this.InnerRadius_ as number | null
  }

  public get StartParam() : number | null {
    if ( this.StartParam_ === void 0 ) {
      this.StartParam_ = this.extractNumber( 3, 0, 3, true )
    }

    return this.StartParam_ as number | null
  }

  public get EndParam() : number | null {
    if ( this.EndParam_ === void 0 ) {
      this.EndParam_ = this.extractNumber( 4, 0, 3, true )
    }

    return this.EndParam_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcSweptDiskSolid.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcSweptDiskSolid" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCSWEPTDISKSOLID, EntityTypesIfc4x3.IFCSWEPTDISKSOLIDPOLYGONAL ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCSWEPTDISKSOLID
}
