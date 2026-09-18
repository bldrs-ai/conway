
import { IfcConnectionGeometry } from "./index"
import { IfcClosedShell } from "./index"
import { IfcSolidModel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcConnectionVolumeGeometry extends IfcConnectionGeometry {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCCONNECTIONVOLUMEGEOMETRY
  }
  private VolumeOnRelatingElement_? : IfcClosedShell | IfcSolidModel
  private VolumeOnRelatedElement_? : IfcClosedShell | IfcSolidModel | null

  public get VolumeOnRelatingElement() : IfcClosedShell | IfcSolidModel {
    if ( this.VolumeOnRelatingElement_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 > = 
        this.extractReference( 0, 0, 1, false )

      if ( !( value instanceof IfcClosedShell ) && !( value instanceof IfcSolidModel ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.VolumeOnRelatingElement_ = value as (IfcClosedShell | IfcSolidModel)

    }

    return this.VolumeOnRelatingElement_ as IfcClosedShell | IfcSolidModel
  }

  public get VolumeOnRelatedElement() : IfcClosedShell | IfcSolidModel | null {
    if ( this.VolumeOnRelatedElement_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 >| null = 
        this.extractReference( 1, 0, 1, true )

      if ( !( value instanceof IfcClosedShell ) && !( value instanceof IfcSolidModel ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.VolumeOnRelatedElement_ = value as (IfcClosedShell | IfcSolidModel)

    }

    return this.VolumeOnRelatedElement_ as IfcClosedShell | IfcSolidModel | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcConnectionVolumeGeometry.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcConnectionVolumeGeometry" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCCONNECTIONVOLUMEGEOMETRY ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCCONNECTIONVOLUMEGEOMETRY
}
