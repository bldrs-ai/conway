
import { IfcLabel } from "./index"
import { IfcText } from "./index"
import { IfcIdentifier } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccoordinatereferencesystem.htm */
export abstract class IfcCoordinateReferenceSystem extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCOORDINATEREFERENCESYSTEM
  }
  private Name_? : string
  private Description_? : string | null
  private GeodeticDatum_? : string | null
  private VerticalDatum_? : string | null

  public get Name() : string {
    if ( this.Name_ === void 0 ) {
      this.Name_ = this.extractString( 0, 0, 0, false )
    }

    return this.Name_ as string
  }

  public get Description() : string | null {
    if ( this.Description_ === void 0 ) {
      this.Description_ = this.extractString( 1, 0, 0, true )
    }

    return this.Description_ as string | null
  }

  public get GeodeticDatum() : string | null {
    if ( this.GeodeticDatum_ === void 0 ) {
      this.GeodeticDatum_ = this.extractString( 2, 0, 0, true )
    }

    return this.GeodeticDatum_ as string | null
  }

  public get VerticalDatum() : string | null {
    if ( this.VerticalDatum_ === void 0 ) {
      this.VerticalDatum_ = this.extractString( 3, 0, 0, true )
    }

    return this.VerticalDatum_ as string | null
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCPROJECTEDCRS ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCOORDINATEREFERENCESYSTEM
}
