
import { IfcConnectionGeometry } from "./index"
import { IfcClosedShell } from "./index"
import { IfcSolidModel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcconnectionvolumegeometry.htm */
export  class IfcConnectionVolumeGeometry extends IfcConnectionGeometry {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCONNECTIONVOLUMEGEOMETRY
  }
  private VolumeOnRelatingElement_? : IfcClosedShell | IfcSolidModel
  private VolumeOnRelatedElement_? : IfcClosedShell | IfcSolidModel | null

  public get VolumeOnRelatingElement() : IfcClosedShell | IfcSolidModel {
    if ( this.VolumeOnRelatingElement_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc > = 
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
      
      const value : StepEntityBase< EntityTypesIfc >| null = 
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCONNECTIONVOLUMEGEOMETRY ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCONNECTIONVOLUMEGEOMETRY
}
