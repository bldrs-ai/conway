
import { IfcMaterialDefinition } from "./index"
import { IfcLabel } from "./index"
import { IfcText } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcmaterial.htm */
export  class IfcMaterial extends IfcMaterialDefinition {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCMATERIAL
  }
  private Name_? : string
  private Description_? : string | null
  private Category_? : string | null

  public get Name() : string {
    if ( this.Name_ === void 0 ) {
      this.Name_ = this.extractString( 0, 0, 1, false )
    }

    return this.Name_ as string
  }

  public get Description() : string | null {
    if ( this.Description_ === void 0 ) {
      this.Description_ = this.extractString( 1, 0, 1, true )
    }

    return this.Description_ as string | null
  }

  public get Category() : string | null {
    if ( this.Category_ === void 0 ) {
      this.Category_ = this.extractString( 2, 0, 1, true )
    }

    return this.Category_ as string | null
  }



  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCMATERIAL ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCMATERIAL
}
