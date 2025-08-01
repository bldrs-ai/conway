
import { IfcMaterialDefinition } from "./index"
import { IfcLabel } from "./index"
import { IfcText } from "./index"
import { IfcMaterial } from "./index"
import { IfcProfileDef } from "./index"
import { IfcInteger } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcmaterialprofile.htm */
export  class IfcMaterialProfile extends IfcMaterialDefinition {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCMATERIALPROFILE
  }
  private Name_? : string | null
  private Description_? : string | null
  private Material_? : IfcMaterial | null
  private Profile_? : IfcProfileDef
  private Priority_? : number | null
  private Category_? : string | null

  public get Name() : string | null {
    if ( this.Name_ === void 0 ) {
      this.Name_ = this.extractString( 0, 0, 1, true )
    }

    return this.Name_ as string | null
  }

  public get Description() : string | null {
    if ( this.Description_ === void 0 ) {
      this.Description_ = this.extractString( 1, 0, 1, true )
    }

    return this.Description_ as string | null
  }

  public get Material() : IfcMaterial | null {
    if ( this.Material_ === void 0 ) {
      this.Material_ = this.extractElement( 2, 0, 1, true, IfcMaterial )
    }

    return this.Material_ as IfcMaterial | null
  }

  public get Profile() : IfcProfileDef {
    if ( this.Profile_ === void 0 ) {
      this.Profile_ = this.extractElement( 3, 0, 1, false, IfcProfileDef )
    }

    return this.Profile_ as IfcProfileDef
  }

  public get Priority() : number | null {
    if ( this.Priority_ === void 0 ) {
      this.Priority_ = this.extractNumber( 4, 0, 1, true )
    }

    return this.Priority_ as number | null
  }

  public get Category() : string | null {
    if ( this.Category_ === void 0 ) {
      this.Category_ = this.extractString( 5, 0, 1, true )
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
    [ EntityTypesIfc.IFCMATERIALPROFILE, EntityTypesIfc.IFCMATERIALPROFILEWITHOFFSETS ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCMATERIALPROFILE
}
