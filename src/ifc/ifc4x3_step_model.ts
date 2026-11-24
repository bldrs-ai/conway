import EntityTypesIfc4x3, {EntityTypesIfc4x3Count} from './ifc4x3_gen/entity_types_ifc4x3.gen'
import StepModelBase from '../step/step_model_base'
import SchemaIfc4x3 from './ifc4x3_gen/schema_ifc4x3.gen'
import {StepIndexEntry} from '../step/parsing/step_parser'
import {StepIndexColumns} from '../step/parsing/columnar_index'
import {StepTypeIndexer} from '../step/indexing/step_type_indexer'
import {MultiIndexSet} from '../indexing/multi_index_set'
import Ifc4x3StepExternalMapping from './ifc4x3_step_external_mapping'
import { StepBufferProvider } from '../step/step_buffer_provider'


const indexerInstance = new StepTypeIndexer< EntityTypesIfc4x3 >( EntityTypesIfc4x3Count )

/**
 * Represents an IFC4X3 model deserialized from step.
 *
 * This is IfcStepModel's phase-2a sibling (see bldrs-ai/conway#280): a
 * genuinely separate class over a genuinely separate, non-interoperable
 * entity enum (EntityTypesIfc4x3 renumbers AND reorders relative to
 * EntityTypesIfc — see that enum's doc comment), mirroring the precedent
 * AP214StepModel already set for running two independent entity spaces
 * through the same generic StepModelBase<T> infrastructure.
 *
 * Deliberately thin for phase 2a: geometry/profiles/curves/materials are
 * left unset (all optional on StepModelBase) because the extraction layer
 * (ifc_geometry_extraction.ts and friends) is still typed against
 * IfcStepModel/EntityTypesIfc and is NOT genericized by this phase — see
 * design/new/conway#280 phase 2b. This class's job is only to prove a 4X3
 * file parses with correct (4X3-numbered) entity identities at the model
 * layer; wiring it into geometry extraction is out of scope here.
 */
export default class Ifc4x3StepModel extends StepModelBase< EntityTypesIfc4x3 > {

  public readonly typeIndex: MultiIndexSet< EntityTypesIfc4x3 >
  public readonly externalMappingType = Ifc4x3StepExternalMapping
  public readonly geometry = void 0
  public readonly materials = void 0
  public readonly elementTypeIDs = EntityTypesIfc4x3

  /**
   * Construct this model given a buffer containing the data and the parsed data index on that,
   * adding the typeIndex on top of that.
   *
   * @param buffer The buffer to values from, or `undefined` with `provider`
   * set for a windowed (streaming) source.
   * @param elementIndex The parsed index to elements in the STEP.
   * @param provider Optional pre-built buffer provider (windowed source).
   */
  constructor(
      buffer: Uint8Array | undefined,
      elementIndex: StepIndexEntry< EntityTypesIfc4x3 >[] | StepIndexColumns< EntityTypesIfc4x3 >,
      provider?: StepBufferProvider ) {
    super( SchemaIfc4x3, buffer, elementIndex, provider )

    this.typeIndex = indexerInstance.createFor( elementIndex )
  }
}
