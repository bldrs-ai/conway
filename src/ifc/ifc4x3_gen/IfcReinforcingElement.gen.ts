
import { IfcElementComponent } from "./index"
import { IfcLabel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcReinforcingElement extends IfcElementComponent {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCREINFORCINGELEMENT
  }
  private SteelGrade_? : string | null

  public get SteelGrade() : string | null {
    if ( this.SteelGrade_ === void 0 ) {
      this.SteelGrade_ = this.extractString( 8, 8, 6, true )
    }

    return this.SteelGrade_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcReinforcingElement.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcReinforcingElement" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCREINFORCINGBAR, EntityTypesIfc4x3.IFCREINFORCINGMESH, EntityTypesIfc4x3.IFCTENDON, EntityTypesIfc4x3.IFCTENDONANCHOR, EntityTypesIfc4x3.IFCTENDONCONDUIT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCREINFORCINGELEMENT
}
