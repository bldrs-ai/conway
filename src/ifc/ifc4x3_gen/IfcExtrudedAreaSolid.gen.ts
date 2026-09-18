
import { IfcSweptAreaSolid } from "./index"
import { IfcDirection } from "./index"
import { IfcPositiveLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcExtrudedAreaSolid extends IfcSweptAreaSolid {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCEXTRUDEDAREASOLID
  }
  private ExtrudedDirection_? : IfcDirection
  private Depth_? : number

  public get ExtrudedDirection() : IfcDirection {
    if ( this.ExtrudedDirection_ === void 0 ) {
      this.ExtrudedDirection_ = this.extractElement( 2, 2, 4, false, IfcDirection )
    }

    return this.ExtrudedDirection_ as IfcDirection
  }

  public get Depth() : number {
    if ( this.Depth_ === void 0 ) {
      this.Depth_ = this.extractNumber( 3, 2, 4, false )
    }

    return this.Depth_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcExtrudedAreaSolid.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcExtrudedAreaSolid" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCEXTRUDEDAREASOLID, EntityTypesIfc4x3.IFCEXTRUDEDAREASOLIDTAPERED ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCEXTRUDEDAREASOLID
}
