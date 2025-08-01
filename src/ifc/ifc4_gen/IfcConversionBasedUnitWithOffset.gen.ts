
import { IfcConversionBasedUnit } from "./index"
import { IfcReal } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcconversionbasedunitwithoffset.htm */
export  class IfcConversionBasedUnitWithOffset extends IfcConversionBasedUnit {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCONVERSIONBASEDUNITWITHOFFSET
  }
  private ConversionOffset_? : number

  public get ConversionOffset() : number {
    if ( this.ConversionOffset_ === void 0 ) {
      this.ConversionOffset_ = this.extractNumber( 4, 4, 2, false )
    }

    return this.ConversionOffset_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCONVERSIONBASEDUNITWITHOFFSET ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCONVERSIONBASEDUNITWITHOFFSET
}
