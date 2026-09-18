
import { IfcMaterialDefinition } from "./index"
import { IfcMaterial } from "./index"
import { IfcNonNegativeLengthMeasure } from "./index"
import { IfcLogical } from "./index"
import { IfcLabel } from "./index"
import { IfcText } from "./index"
import { IfcInteger } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcMaterialLayer extends IfcMaterialDefinition {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCMATERIALLAYER
  }
  private Material_? : IfcMaterial | null
  private LayerThickness_? : number
  private IsVentilated_? : boolean | null
  private Name_? : string | null
  private Description_? : string | null
  private Category_? : string | null
  private Priority_? : number | null

  public get Material() : IfcMaterial | null {
    if ( this.Material_ === void 0 ) {
      this.Material_ = this.extractElement( 0, 0, 1, true, IfcMaterial )
    }

    return this.Material_ as IfcMaterial | null
  }

  public get LayerThickness() : number {
    if ( this.LayerThickness_ === void 0 ) {
      this.LayerThickness_ = this.extractNumber( 1, 0, 1, false )
    }

    return this.LayerThickness_ as number
  }

  public get IsVentilated() : boolean | null {
    if ( this.IsVentilated_ === void 0 ) {
      this.IsVentilated_ = this.extractLogical( 2, 0, 1, true )
    }

    return this.IsVentilated_ as boolean | null
  }

  public get Name() : string | null {
    if ( this.Name_ === void 0 ) {
      this.Name_ = this.extractString( 3, 0, 1, true )
    }

    return this.Name_ as string | null
  }

  public get Description() : string | null {
    if ( this.Description_ === void 0 ) {
      this.Description_ = this.extractString( 4, 0, 1, true )
    }

    return this.Description_ as string | null
  }

  public get Category() : string | null {
    if ( this.Category_ === void 0 ) {
      this.Category_ = this.extractString( 5, 0, 1, true )
    }

    return this.Category_ as string | null
  }

  public get Priority() : number | null {
    if ( this.Priority_ === void 0 ) {
      this.Priority_ = this.extractNumber( 6, 0, 1, true )
    }

    return this.Priority_ as number | null
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcMaterialLayer.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcMaterialLayer" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCMATERIALLAYER, EntityTypesIfc4x3.IFCMATERIALLAYERWITHOFFSETS ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCMATERIALLAYER
}
