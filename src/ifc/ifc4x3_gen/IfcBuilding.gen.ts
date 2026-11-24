
import { IfcFacility } from "./index"
import { IfcLengthMeasure } from "./index"
import { IfcPostalAddress } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcBuilding extends IfcFacility {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCBUILDING
  }
  private ElevationOfRefHeight_? : number | null
  private ElevationOfTerrain_? : number | null
  private BuildingAddress_? : IfcPostalAddress | null

  public get ElevationOfRefHeight() : number | null {
    if ( this.ElevationOfRefHeight_ === void 0 ) {
      this.ElevationOfRefHeight_ = this.extractNumber( 9, 9, 7, true )
    }

    return this.ElevationOfRefHeight_ as number | null
  }

  public get ElevationOfTerrain() : number | null {
    if ( this.ElevationOfTerrain_ === void 0 ) {
      this.ElevationOfTerrain_ = this.extractNumber( 10, 9, 7, true )
    }

    return this.ElevationOfTerrain_ as number | null
  }

  public get BuildingAddress() : IfcPostalAddress | null {
    if ( this.BuildingAddress_ === void 0 ) {
      this.BuildingAddress_ = this.extractElement( 11, 9, 7, true, IfcPostalAddress )
    }

    return this.BuildingAddress_ as IfcPostalAddress | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcBuilding.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcBuilding" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCBUILDING ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCBUILDING
}
