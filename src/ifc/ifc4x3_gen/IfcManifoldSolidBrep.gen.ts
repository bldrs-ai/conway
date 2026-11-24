
import { IfcSolidModel } from "./index"
import { IfcClosedShell } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcManifoldSolidBrep extends IfcSolidModel {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCMANIFOLDSOLIDBREP
  }
  private Outer_? : IfcClosedShell

  public get Outer() : IfcClosedShell {
    if ( this.Outer_ === void 0 ) {
      this.Outer_ = this.extractElement( 0, 0, 3, false, IfcClosedShell )
    }

    return this.Outer_ as IfcClosedShell
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcManifoldSolidBrep.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcManifoldSolidBrep" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCADVANCEDBREP, EntityTypesIfc4x3.IFCFACETEDBREP, EntityTypesIfc4x3.IFCADVANCEDBREPWITHVOIDS, EntityTypesIfc4x3.IFCFACETEDBREPWITHVOIDS ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCMANIFOLDSOLIDBREP
}
