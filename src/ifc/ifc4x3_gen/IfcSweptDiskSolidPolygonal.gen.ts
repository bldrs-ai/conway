
import { IfcSweptDiskSolid } from "./index"
import { IfcNonNegativeLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcSweptDiskSolidPolygonal extends IfcSweptDiskSolid {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCSWEPTDISKSOLIDPOLYGONAL
  }
  private FilletRadius_? : number | null

  public get FilletRadius() : number | null {
    if ( this.FilletRadius_ === void 0 ) {
      this.FilletRadius_ = this.extractNumber( 5, 5, 4, true )
    }

    return this.FilletRadius_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcSweptDiskSolidPolygonal.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcSweptDiskSolidPolygonal" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCSWEPTDISKSOLIDPOLYGONAL ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCSWEPTDISKSOLIDPOLYGONAL
}
