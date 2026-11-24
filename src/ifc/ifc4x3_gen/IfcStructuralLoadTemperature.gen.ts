
import { IfcStructuralLoadStatic } from "./index"
import { IfcThermodynamicTemperatureMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcStructuralLoadTemperature extends IfcStructuralLoadStatic {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCSTRUCTURALLOADTEMPERATURE
  }
  private DeltaTConstant_? : number | null
  private DeltaTY_? : number | null
  private DeltaTZ_? : number | null

  public get DeltaTConstant() : number | null {
    if ( this.DeltaTConstant_ === void 0 ) {
      this.DeltaTConstant_ = this.extractNumber( 1, 1, 3, true )
    }

    return this.DeltaTConstant_ as number | null
  }

  public get DeltaTY() : number | null {
    if ( this.DeltaTY_ === void 0 ) {
      this.DeltaTY_ = this.extractNumber( 2, 1, 3, true )
    }

    return this.DeltaTY_ as number | null
  }

  public get DeltaTZ() : number | null {
    if ( this.DeltaTZ_ === void 0 ) {
      this.DeltaTZ_ = this.extractNumber( 3, 1, 3, true )
    }

    return this.DeltaTZ_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcStructuralLoadTemperature.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcStructuralLoadTemperature" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCSTRUCTURALLOADTEMPERATURE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCSTRUCTURALLOADTEMPERATURE
}
