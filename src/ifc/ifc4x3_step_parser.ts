import ParsingBuffer from '../parsing/parsing_buffer'
import StepParser, {ParseProgressCallback, ParseResult} from '../step/parsing/step_parser'
import Ifc4x3StepModel from './ifc4x3_step_model'
import EntityTypesIfc4x3 from './ifc4x3_gen/entity_types_ifc4x3.gen'
import EntityTypesIfc4x3Search from './ifc4x3_gen/entity_types_search.gen'

/**
 * Parser for taking IFC4X3 files serialized in step and turning them into a
 * lazily parsed model.
 *
 * IfcStepParser's phase-2a sibling (bldrs-ai/conway#280): same generic
 * StepParser<T> infrastructure, a different (non-interoperable) type index
 * — mirrors AP214StepParser's precedent for running two independent entity
 * enums through it.
 */
export default class Ifc4x3StepParser extends StepParser< EntityTypesIfc4x3 > {
  /**
   * Construct the IFC4X3 step parser.
   */
  constructor() {
    super( EntityTypesIfc4x3Search )
  }

  /**
   * An easily accessible and re-usable instance of the parser.
   *
   * Note the parser itself is free of mutable state in the class, so there's no problems
   * with just using a single one.
   */
  public static readonly Instance = new Ifc4x3StepParser()

  /**
   * Parse data to the model
   *
   * @param input The parsing buffer, set to user data, to read.
   * @param onProgress Optional byte-cursor progress callback for the data parse.
   * @return {[ParseResult, Ifc4x3StepModel | undefined]} The parse result as well as the model,
   * if it can be extracted.
   */
  public parseDataToModel(
      input: ParsingBuffer,
      onProgress?: ParseProgressCallback ): [ParseResult, Ifc4x3StepModel | undefined] {
    const [itemIndex, parseResult] = this.parseDataBlock( input, onProgress )

    return [parseResult, new Ifc4x3StepModel( input.buffer, itemIndex.elements )]
  }

  /**
   * Cooperative variant of parseDataToModel — periodically yields to the
   * event loop mid-parse (see StepParser.parseDataBlockAsync, issue #301 §2).
   *
   * @param input The parsing buffer, set to user data, to read.
   * @param onProgress Optional byte-cursor progress callback for the data parse.
   * @return {Promise<[ParseResult, Ifc4x3StepModel | undefined]>} The parse result as well
   * as the model, if it can be extracted.
   */
  public async parseDataToModelAsync(
      input: ParsingBuffer,
      onProgress?: ParseProgressCallback ):
      Promise<[ParseResult, Ifc4x3StepModel | undefined]> {
    const [itemIndex, parseResult] = await this.parseDataBlockAsync( input, onProgress )

    return [parseResult, new Ifc4x3StepModel( input.buffer, itemIndex.elements )]
  }
}
