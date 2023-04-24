import ParsingBuffer from '../../../dependencies/conway-ds/src/parsing/parsing_buffer'
import StepParser, {ParseResult} from '../../../dependencies/conway-ds/src/parsing/step/step_parser'
import EntityTypesIfc from '../../gen/ifc/entity_types_ifc.bldrs'
import EntitTypesIfcSearch from '../../gen/ifc/entity_types_search.bldrs'
import IfcStepModel from './ifc_step_model'

/**
 * Parser for taking IFC file serialized in step and turning them into a lazily parsed model.
 */
export default class IfcStepParser extends StepParser< EntityTypesIfc > {
  /**
   * Construct the IFC step parser.
   */
  constructor() {
    super( EntitTypesIfcSearch )
  }

  /**
   * An easily accessible and re-usable instance of the parser.
   *
   * Note the parser itself is free of mutable state in the class, so there's no problems
   * with just using a single one.
   */
  public static readonly Instance = new IfcStepParser()

  /**
   * Parse data to the model
   *
   * @param input The parsing buffer, set to user data, to read.
   * @return {[ParseResult, IfcStepModel | undefined]} The parse result as well as the model,
   * if it can be extracted.
   */
  public parseDataToModel( input: ParsingBuffer ): [ParseResult, IfcStepModel | undefined] {
    const [itemIndex, parseResult] = this.parseDataBlock( input )

    return [parseResult, new IfcStepModel( input.buffer, itemIndex.elements )]
  }
}