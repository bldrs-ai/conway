
import { IfcRelConnects } from "./index"
import { IfcProcess } from "./index"
import { IfcLagTime } from "./index"
import { IfcSequenceEnum, IfcSequenceEnumDeserializeStep } from "./index"
import { IfcLabel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrelsequence.htm */
export  class IfcRelSequence extends IfcRelConnects {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELSEQUENCE
  }
  private RelatingProcess_? : IfcProcess
  private RelatedProcess_? : IfcProcess
  private TimeLag_? : IfcLagTime | null
  private SequenceType_? : IfcSequenceEnum | null
  private UserDefinedSequenceType_? : string | null

  public get RelatingProcess() : IfcProcess {
    if ( this.RelatingProcess_ === void 0 ) {
      this.RelatingProcess_ = this.extractElement( 4, 4, 3, false, IfcProcess )
    }

    return this.RelatingProcess_ as IfcProcess
  }

  public get RelatedProcess() : IfcProcess {
    if ( this.RelatedProcess_ === void 0 ) {
      this.RelatedProcess_ = this.extractElement( 5, 4, 3, false, IfcProcess )
    }

    return this.RelatedProcess_ as IfcProcess
  }

  public get TimeLag() : IfcLagTime | null {
    if ( this.TimeLag_ === void 0 ) {
      this.TimeLag_ = this.extractElement( 6, 4, 3, true, IfcLagTime )
    }

    return this.TimeLag_ as IfcLagTime | null
  }

  public get SequenceType() : IfcSequenceEnum | null {
    if ( this.SequenceType_ === void 0 ) {
      this.SequenceType_ = this.extractLambda( 7, 4, 3, IfcSequenceEnumDeserializeStep, true )
    }

    return this.SequenceType_ as IfcSequenceEnum | null
  }

  public get UserDefinedSequenceType() : string | null {
    if ( this.UserDefinedSequenceType_ === void 0 ) {
      this.UserDefinedSequenceType_ = this.extractString( 8, 4, 3, true )
    }

    return this.UserDefinedSequenceType_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELSEQUENCE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELSEQUENCE
}
