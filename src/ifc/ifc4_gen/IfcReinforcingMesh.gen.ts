
import { IfcReinforcingElement } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcAreaMeasure } from "./index"
import { IfcReinforcingMeshTypeEnum, IfcReinforcingMeshTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcreinforcingmesh.htm */
export  class IfcReinforcingMesh extends IfcReinforcingElement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCREINFORCINGMESH
  }
  private MeshLength_? : number | null
  private MeshWidth_? : number | null
  private LongitudinalBarNominalDiameter_? : number | null
  private TransverseBarNominalDiameter_? : number | null
  private LongitudinalBarCrossSectionArea_? : number | null
  private TransverseBarCrossSectionArea_? : number | null
  private LongitudinalBarSpacing_? : number | null
  private TransverseBarSpacing_? : number | null
  private PredefinedType_? : IfcReinforcingMeshTypeEnum | null

  public get MeshLength() : number | null {
    if ( this.MeshLength_ === void 0 ) {
      this.MeshLength_ = this.extractNumber( 9, 9, 7, true )
    }

    return this.MeshLength_ as number | null
  }

  public get MeshWidth() : number | null {
    if ( this.MeshWidth_ === void 0 ) {
      this.MeshWidth_ = this.extractNumber( 10, 9, 7, true )
    }

    return this.MeshWidth_ as number | null
  }

  public get LongitudinalBarNominalDiameter() : number | null {
    if ( this.LongitudinalBarNominalDiameter_ === void 0 ) {
      this.LongitudinalBarNominalDiameter_ = this.extractNumber( 11, 9, 7, true )
    }

    return this.LongitudinalBarNominalDiameter_ as number | null
  }

  public get TransverseBarNominalDiameter() : number | null {
    if ( this.TransverseBarNominalDiameter_ === void 0 ) {
      this.TransverseBarNominalDiameter_ = this.extractNumber( 12, 9, 7, true )
    }

    return this.TransverseBarNominalDiameter_ as number | null
  }

  public get LongitudinalBarCrossSectionArea() : number | null {
    if ( this.LongitudinalBarCrossSectionArea_ === void 0 ) {
      this.LongitudinalBarCrossSectionArea_ = this.extractNumber( 13, 9, 7, true )
    }

    return this.LongitudinalBarCrossSectionArea_ as number | null
  }

  public get TransverseBarCrossSectionArea() : number | null {
    if ( this.TransverseBarCrossSectionArea_ === void 0 ) {
      this.TransverseBarCrossSectionArea_ = this.extractNumber( 14, 9, 7, true )
    }

    return this.TransverseBarCrossSectionArea_ as number | null
  }

  public get LongitudinalBarSpacing() : number | null {
    if ( this.LongitudinalBarSpacing_ === void 0 ) {
      this.LongitudinalBarSpacing_ = this.extractNumber( 15, 9, 7, true )
    }

    return this.LongitudinalBarSpacing_ as number | null
  }

  public get TransverseBarSpacing() : number | null {
    if ( this.TransverseBarSpacing_ === void 0 ) {
      this.TransverseBarSpacing_ = this.extractNumber( 16, 9, 7, true )
    }

    return this.TransverseBarSpacing_ as number | null
  }

  public get PredefinedType() : IfcReinforcingMeshTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 17, 9, 7, IfcReinforcingMeshTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcReinforcingMeshTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCREINFORCINGMESH ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCREINFORCINGMESH
}
