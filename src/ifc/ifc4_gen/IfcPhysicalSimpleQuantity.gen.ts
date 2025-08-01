
import { IfcPhysicalQuantity } from "./index"
import { IfcNamedUnit } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcphysicalsimplequantity.htm */
export abstract class IfcPhysicalSimpleQuantity extends IfcPhysicalQuantity {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCPHYSICALSIMPLEQUANTITY
  }
  private Unit_? : IfcNamedUnit | null

  public get Unit() : IfcNamedUnit | null {
    if ( this.Unit_ === void 0 ) {
      this.Unit_ = this.extractElement( 2, 2, 1, true, IfcNamedUnit )
    }

    return this.Unit_ as IfcNamedUnit | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCQUANTITYAREA, EntityTypesIfc.IFCQUANTITYCOUNT, EntityTypesIfc.IFCQUANTITYLENGTH, EntityTypesIfc.IFCQUANTITYTIME, EntityTypesIfc.IFCQUANTITYVOLUME, EntityTypesIfc.IFCQUANTITYWEIGHT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCPHYSICALSIMPLEQUANTITY
}
