
import { IfcNamedUnit } from "./index"
import { IfcLabel } from "./index"
import { IfcMeasureWithUnit } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcconversionbasedunit.htm */
export  class IfcConversionBasedUnit extends IfcNamedUnit {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCONVERSIONBASEDUNIT
  }
  private Name_? : string
  private ConversionFactor_? : IfcMeasureWithUnit

  public get Name() : string {
    if ( this.Name_ === void 0 ) {
      this.Name_ = this.extractString( 2, 2, 1, false )
    }

    return this.Name_ as string
  }

  public get ConversionFactor() : IfcMeasureWithUnit {
    if ( this.ConversionFactor_ === void 0 ) {
      this.ConversionFactor_ = this.extractElement( 3, 2, 1, false, IfcMeasureWithUnit )
    }

    return this.ConversionFactor_ as IfcMeasureWithUnit
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCONVERSIONBASEDUNIT, EntityTypesIfc.IFCCONVERSIONBASEDUNITWITHOFFSET ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCONVERSIONBASEDUNIT
}
