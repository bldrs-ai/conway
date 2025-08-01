
import { IfcLabel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcstructuralload.htm */
export abstract class IfcStructuralLoad extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSTRUCTURALLOAD
  }
  private Name_? : string | null

  public get Name() : string | null {
    if ( this.Name_ === void 0 ) {
      this.Name_ = this.extractString( 0, 0, 0, true )
    }

    return this.Name_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSTRUCTURALLOADCONFIGURATION, EntityTypesIfc.IFCSURFACEREINFORCEMENTAREA, EntityTypesIfc.IFCSTRUCTURALLOADLINEARFORCE, EntityTypesIfc.IFCSTRUCTURALLOADPLANARFORCE, EntityTypesIfc.IFCSTRUCTURALLOADSINGLEDISPLACEMENT, EntityTypesIfc.IFCSTRUCTURALLOADSINGLEFORCE, EntityTypesIfc.IFCSTRUCTURALLOADTEMPERATURE, EntityTypesIfc.IFCSTRUCTURALLOADSINGLEDISPLACEMENTDISTORTION, EntityTypesIfc.IFCSTRUCTURALLOADSINGLEFORCEWARPING ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSTRUCTURALLOAD
}
