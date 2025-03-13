import { ParseBuffer } from '../../dependencies/conway-geom/interface/parse_buffer'
import { Entity } from '../core/entity'
import { EntityDescription, EntityFieldsDescription } from '../core/entity_description'
import { EntityFieldDescription } from '../core/entity_field_description'
import { WasmModule } from '../core/native_types'
import {
  stepExtractArray,
  stepExtractBinary,
  stepExtractBoolean,
  stepExtractInlineElemement,
  stepExtractLogical,
  stepExtractNumber,
  stepExtractOptional,
  stepExtractReference,
  stepExtractString,
} from './parsing/step_deserialization_functions'
import { StepEntityConstructorAbstract } from './step_entity_constructor'
import StepEntityInternalReference,
{ StepEntityInternalReferencePrivate } from './step_entity_internal_reference'
import StepModelBase from './step_model_base'

 
enum IfcTokenType {
  UNKNOWN = 0,
  STRING,
  LABEL,
  ENUM,
  REAL,
  REF,
  EMPTY,
  SET_BEGIN,
  SET_END,
  LINE_END
}

/**
 * Merge the entity field descriptions.
 *
 * Merging uses "hasOwnProperty" semantics to avoid overwriting
 * keys that have already been merged.
 *
 * @param to Merge to this fields object.
 * @param from Merge from this fields object.
 */
function merge<EntityTypeIDs extends number>(
    to: EntityFieldsDescription<EntityTypeIDs>,
    from: EntityFieldsDescription<EntityTypeIDs>): void {

  for (const key of Object.keys(from)) {

    // eslint-disable-next-line no-prototype-builtins
    if (!to.hasOwnProperty(key)) {

      to[key] = from[key]

    }
  }
}

/**
 * The base type for entities parsed from STEP.
 */
export default abstract class StepEntityBase<EntityTypeIDs extends number> implements Entity {
  /**
   * Get the final type of this STEP entity.
   */
  public abstract get type(): EntityTypeIDs

  /**
   * Get the reflecterd type info for this element/entity.
   *
   * @return {EntityDescription} The entity description for this.
   */
  public get typeInfo(): EntityDescription<EntityTypeIDs> {

    const localType = this.type

    return this.model.schema.reflection[localType]
  }

  /**
   * Get the reflected fields of this.
   *
   * @return {EntityFieldsDescription}
   */
  public get fields(): EntityFieldsDescription<EntityTypeIDs> {

    const fields = {} as EntityFieldsDescription<EntityTypeIDs>

    let typeID: EntityTypeIDs | undefined = this.type

    while (typeID !== void 0) {

      const localTypeInfo: EntityDescription<EntityTypeIDs> =
        this.model.schema.reflection[typeID]

      merge(fields, localTypeInfo.fields)

      typeID = localTypeInfo.superType
    }

    return fields
  }

  /**
   * Get the reflected fields of this.
   *
   * @return {EntityFieldsDescription}
   */
  public get orderedFields(): [string, EntityFieldDescription<EntityTypeIDs>][] {

    const fields = [] as [string, EntityFieldDescription<EntityTypeIDs>][]
    const internalFields = this.fields

    Object.keys(internalFields).reduce<[string, EntityFieldDescription<EntityTypeIDs>][]>(
        (previous, current) => {

          // eslint-disable-next-line no-prototype-builtins
          if (internalFields.hasOwnProperty(current)) {

            const field = internalFields[current]

            if (field.offset !== void 0) {
              previous.push([current, internalFields[current]])
            }
          }

          return previous
        }, fields)

    fields.sort((a, b) => (a[1].offset as number) - (b[1].offset as number))

    return fields
  }

  /**
   * Get the number of dimensions for this, some functions require every object to have this,
   *
   * The default value is 0.
   *
   * @return {number} The number of dimensions.
   */
  public get Dim(): number {
    return 0
  }

  /**
   * Get the express ID for this, note that if an element is inlined,
   * it will have not have an express ID.
   *
   * @return {number | undefined} The express ID of this or undefined if there isn't one.
   */
  public get expressID(): number | undefined {
    return this.internalReference_.expressID
  }

  /**
   * Is this an inline element or fully specified?
   *
   * @return {boolean} Is this inline?
   */
  public get isInline(): boolean {
    return this.expressID === void 0
  }

  /**
   * Convert this to a string (which is the equivalent to a reference or
   * '#inline' for inline elements).
   *
   * @return {string} Convert this to a string
   */
  public toString(): string {
    return `#${this.expressID ?? `inline(${this.localID})`}`
  }

  /**
   * Extract a number at the particular vtable offset (i.e. the position
   * in the matching step object).
   *
   * Used by other extraction methods with wrappers to perform
   * semantically correct extraction.
   *
   * @param vtableOffset The offset in the vtable to extract from
   * @param optional Whether this is a potentially optional field
   * @return {number | null | undefined} The extracted number.
   */
  public extractNumber(vtableOffset: number, optional: true): number | null
  public extractNumber(vtableOffset: number, optional: false): number
  public extractNumber(vtableOffset: number, optional: boolean): number | null {

    this.guaranteeVTable()

    const [cursor, endCursor] = this.getOffsetAndEndCursor( vtableOffset )
    const buffer    = this.buffer

    const value = stepExtractNumber(buffer, cursor, endCursor)

    if (value === void 0) {

      if (!optional) {
        throw new Error('Value in STEP was incorrectly typed')
      }

      const buffer    = this.buffer

      if ( !this.model.nullOnErrors && stepExtractOptional(buffer, cursor, endCursor) !== null ) {
        throw new Error('Value in STEP was incorrectly typed')
      }

      return null
    }

    return value
  }

  /**
   * Extract a string at the particular vtable offset (i.e. the position
   * in the matching step object).
   *
   * Used by other extraction methods with wrappers to perform
   * semantically correct extraction.
   *
   * @param offset The offset in the vtable to extract from
   * @param optional Is this an optional field?
   * @return {string | null} The extracted string, or null if optional
   * and this value isn't specified.
   */
  public extractString(offset: number, optional: true): string | null
  public extractString(offset: number, optional: false): string
  public extractString(offset: number, optional: boolean): string | null {

    const [cursor, endCursor] = this.getOffsetAndEndCursor( offset )
    const buffer              = this.buffer

    const value = stepExtractString(buffer, cursor, endCursor)

    if (value === void 0) {
      if (!optional) {
        throw new Error('Value in STEP was incorrectly typed')
      }

      if ( !this.model.nullOnErrors && stepExtractOptional(buffer, cursor, endCursor) !== null) {
        throw new Error('Value in STEP was incorrectly typed')
      }

      return null
    }

    return value
  }


  /**
   * Extract a number at the particular vtable offset (i.e. the position
   * in the matching step object).
   *
   * Used by other extraction methods with wrappers to perform
   * semantically correct extraction.
   *
   * @param offset The offset in the vtable to extract from
   * @param optional Is this an optional field?
   * @return {boolean | null} The extracted logical or null for optionals.
   */
  public extractLogical(offset: number, optional: true): boolean | null
  public extractLogical(offset: number, optional: false): boolean
  public extractLogical(offset: number, optional: boolean): boolean | null {

    const [cursor, endCursor] = this.getOffsetAndEndCursor( offset )
    const buffer              = this.buffer

    const value = stepExtractLogical(buffer, cursor, endCursor)

    if (value === void 0) {
      if (!optional) {
        throw new Error('Value in STEP was incorrectly typed')
      }

      if ( !this.model.nullOnErrors && stepExtractOptional(buffer, cursor, endCursor) !== null) {
        throw new Error('Value in STEP was incorrectly typed')
      }

      return null
    }

    return value
  }


  /**
   * Extract a reference from an offset, without type check.
   *
   * @param offset The offset in the vtable to extract from
   * @param optional Is this an optional field?
   * @return {StepEntityBase | undefined} Extracted entity or undefined.
   */
  public extractReference(offset: number, optional: true): StepEntityBase<EntityTypeIDs> | null
  public extractReference(offset: number, optional: false): StepEntityBase<EntityTypeIDs>
  public extractReference(offset: number, optional: boolean): StepEntityBase<EntityTypeIDs> | null {

    const cursor    = this.getOffsetCursor( offset )
    const buffer    = this.buffer
    const endCursor = buffer.length

    const expressID = stepExtractReference(buffer, cursor, endCursor)
    const value: StepEntityBase<EntityTypeIDs> | undefined =
      expressID !== void 0 ? this.model.getElementByExpressID(expressID) :
        (this.model.getInlineElementByAddress(
            stepExtractInlineElemement(buffer, cursor, endCursor)))

    if (value === void 0) {
      if (!optional) {
        throw new Error('Value in STEP was incorrectly typed')
      }

      if ( !this.model.nullOnErrors && stepExtractOptional(buffer, cursor, endCursor) !== null) {
        throw new Error('Value in STEP was incorrectly typed')
      }

      return null
    }

    return value
  }

  /**
   *
   * @param buffer
   * @param cursor
   * @return {{ data: string, length: number }} string and length
   */
  readStringView(buffer: Uint8Array, cursor: number): { data: string, length: number } {
    const view = new DataView(buffer.buffer)
    const length = view.getUint16(cursor, true) // Little-endian
    cursor += 2 // 2 bytes for UInt16

    let data = ''
    for (let i = 0; i < length; i++) {
      data += String.fromCharCode(view.getUint8(cursor + i))
    }

    return { data, length }
  }

   
  /**
   *
   * @param buffer
   * @param cursor
   * @param t ifc token type
   * @return {any} ifc token
   */
  readValue(buffer: Uint8Array, cursor: number, t: IfcTokenType) {
    const view = new DataView(buffer.buffer)
    /* eslint-disable no-case-declarations */
    switch (t) {
      case IfcTokenType.STRING:
      case IfcTokenType.ENUM:
        const { data, length } = this.readStringView(buffer, cursor)
        return { value: data, length: 2 + length } // 2 bytes for length, plus the string itself

      case IfcTokenType.REAL:
        const realValue = view.getFloat64(cursor, true) // Little-endian
        return { value: realValue, length: 8 } // 8 bytes for double

      case IfcTokenType.REF:
        const refValue = view.getUint32(cursor, true) // Little-endian
        return { value: refValue, length: 4 } // 4 bytes for UInt32

      default:
        return { value: undefined, length: 0 }
    }
    /* eslint-enable no-case-declarations */
     
  }

  /**
   *
   * @return {Uint8Array} buffer containing line data up to the semicolon
   */
  extractLineArguments(): Uint8Array {

    this.guaranteeBuffer()
    const internalReference = this.internalReference_ as
    Required<StepEntityInternalReference<EntityTypeIDs>>

    const cursor = internalReference.address
    const buffer = internalReference.buffer
    const endCursor = cursor + internalReference.length

    // include the Open parenthesis + ending semicolon
    const subArray = buffer.subarray(cursor, endCursor)
    return subArray
  }

  /**
   * Extract a reference from a buffer, without type check.
   *
   * @param buffer The buffer to extract from.
   * @param cursor The position in the buffer to extract from.
   * @param endCursor The ending cursor.
   * @return {StepEntityBase | undefined} Extracted entity or undefined.
   */
  protected extractBufferReference(
      buffer: Uint8Array,
      cursor: number,
      endCursor: number): StepEntityBase<EntityTypeIDs> | undefined {

    const expressID = stepExtractReference(buffer, cursor, endCursor)
    const value: StepEntityBase<EntityTypeIDs> | undefined =
      expressID !== void 0 ? this.model.getElementByExpressID(expressID) :
        (this.model.getInlineElementByAddress(
            stepExtractInlineElemement(buffer, cursor, endCursor)))

    return value
  }

  /**
   * Extract a flat array of references
   *
   * @param offset offset in ifc line
   * @return {Array<any>} array of values
   */
  public extractArray(offset: number): Array< StepEntityBase< EntityTypeIDs > | undefined > {

    const arrayObjects: Array< StepEntityBase< EntityTypeIDs > | undefined > =
      this.extractLambda(offset, (buffer, cursor, endCursor) => {

      const value: Array< StepEntityBase< EntityTypeIDs > | undefined > = []

      for (const address of stepExtractArray(buffer, cursor, endCursor)) {

        const itemValue = this.extractBufferReference(buffer, address, endCursor)

        value.push( itemValue )
      }
      return value
    }, false)

    return arrayObjects
  }

  /**
   * Extract a number at the particular vtable offset (i.e. the position
   * in the matching step object).
   *
   * Used by other extraction methods with wrappers to perform
   * semantically correct extraction.
   *
   * ExtractionType Type to be extracted
   *
   * @param offset The offset in the vtable to extract from
   * @param extractor The function to be used for extraction.
   * @param optional Is this an optional field? (true)
   * @return {ExtractionType | null} The extracted value or null for optionals.
   */
  public extractLambda<ExtractionType>(
    offset: number,
    extractor: (buffer: Uint8Array, cursor: number, endCursor: number) =>
      ExtractionType | null | undefined,
    optional: true): ExtractionType | null
  /**
   * Extract a number at the particular vtable offset (i.e. the position
   * in the matching step object).
   *
   * Used by other extraction methods with wrappers to perform
   * semantically correct extraction.
   *
   * ExtractionType Type to be extracted
   *
   * @param offset The offset in the vtable to extract from
   * @param extractor The function to be used for extraction.
   * @param optional Is this an optional field? (false)
   * @return {ExtractionType} The extracted value or null for optionals.
   */
  public extractLambda<ExtractionType>(
    offset: number,
    extractor: (buffer: Uint8Array, cursor: number, endCursor: number) =>
      ExtractionType | undefined,
    optional: false): ExtractionType
  /**
   * Extract a number at the particular vtable offset (i.e. the position
   * in the matching step object).
   *
   * Used by other extraction methods with wrappers to perform
   * semantically correct extraction.
   *
   * ExtractionType Type to be extracted
   *
   * @param offset The offset in the vtable to extract from
   * @param extractor The function to be used for extraction.
   * @param optional Is this an optional field?
   * @return {ExtractionType | null} The extracted value or null for optionals.
   */
  public extractLambda<ExtractionType>(
      offset: number,
      extractor: (buffer: Uint8Array, cursor: number, endCursor: number) =>
      ExtractionType | null | undefined,
      optional: boolean): ExtractionType | null {

    const [cursor, endCursor] = this.getOffsetAndEndCursor( offset )
    const buffer              = this.buffer

    const value = extractor(buffer, cursor, endCursor)

    if (value === void 0) {
      if (!optional) {
        throw new Error('Value in STEP was incorrectly typed')
      }

      if ( !this.model.nullOnErrors && stepExtractOptional(buffer, cursor, endCursor) !== null) {
        throw new Error('Value in STEP was incorrectly typed')
      }

      return null
    }

    return value
  }


  /**
   * Extract a string at the particular vtable offset (i.e. the position
   * in the matching step object).
   *
   * Used by other extraction methods with wrappers to perform
   * semantically correct extraction.
   *
   * @param offset The offset in the vtable to extract from
   * @param optional Is this an optional field? (true)
   * @return {StepEntityBase | null} The extracted element, or null if optional
   * and this value isn't specified.
   */
  public extractElement<T extends StepEntityConstructorAbstract<EntityTypeIDs>>(
    offset: number,
    optional: true,
    entityConstructor: T):
    InstanceType<T> | null
  /**
   * Extract a string at the particular vtable offset (i.e. the position
   * in the matching step object).
   *
   * Used by other extraction methods with wrappers to perform
   * semantically correct extraction.
   *
   * @param offset The offset in the vtable to extract from
   * @param optional Is this an optional field? (false)
   * @return {StepEntityBase} The extracted element.
   */
  public extractElement<T extends StepEntityConstructorAbstract<EntityTypeIDs>>(
    offset: number,
    optional: false,
    entityConstructor: T):
    InstanceType<T>
  /**
   * Extract a string at the particular vtable offset (i.e. the position
   * in the matching step object).
   *
   * Used by other extraction methods with wrappers to perform
   * semantically correct extraction.
   *
   * @param offset The offset in the vtable to extract from
   * @param optional Is this an optional field?
   * @param entityConstructor
   * @return {StepEntityBase} The extracted element, or null if optional
   * and this value isn't specified.
   */
  public extractElement<T extends StepEntityConstructorAbstract<EntityTypeIDs>>(
      offset: number,
      optional: boolean,
      entityConstructor: T):
    InstanceType<T> | null {

    const [cursor, endCursor] = this.getOffsetAndEndCursor( offset )
    const buffer              = this.buffer
    const model               = this.model

    const expressID = stepExtractReference(buffer, cursor, endCursor)
    const value =
      expressID !== void 0 ? model.getElementByExpressID(expressID) :
        model.getInlineElementByAddress(
            stepExtractInlineElemement(buffer, cursor, endCursor))

    if (value === void 0) {
      if (!optional) {
        throw new Error('Value in STEP was incorrectly typed')
      }

      if ( !model.nullOnErrors && stepExtractOptional(buffer, cursor, endCursor) !== null) {
        throw new Error('Value in STEP was incorrectly typed')
      }

      return null
    }

    if (!(value instanceof entityConstructor)) {
      throw new Error('Value in STEP was incorrectly typed for field')
    }

    return value as InstanceType<T>
  }


  /**
   * Extract a string at the particular vtable offset (i.e. the position
   * in the matching step object).
   *
   * Used by other extraction methods with wrappers to perform
   * semantically correct extraction.
   *
   * @param buffer The buffer to extract from
   * @param cursor The cursor to extract from.
   * @param endCursor The end of the memory space to extract from.
   * @param entityConstructor The entity constructor to use for type checks.
   * @return {StepEntityBase | undefined } The extracted element, or null if optional
   * and this value isn't specified.
   */
  protected extractBufferElement< T extends StepEntityConstructorAbstract< EntityTypeIDs > >(
      buffer: Uint8Array,
      cursor: number,
      endCursor: number,
      entityConstructor: T ):
      InstanceType< T > | undefined {

    const model     = this.model
    const expressID = stepExtractReference( buffer, cursor, endCursor )
    const value =
      expressID !== void 0 ? model.getElementByExpressID( expressID ) :
      model.getInlineElementByAddress(
          stepExtractInlineElemement( buffer, cursor, endCursor ) )

    if ( value === void 0 ) {
      return
    }

    if ( !( value instanceof entityConstructor ) ) {
      throw new Error( 'Value in STEP was incorrectly typed for field' )
    }

    return value as InstanceType< T >
  }

  /**
   * Extract a number at the particular vtable offset (i.e. the position
   * in the matching step object).
   *
   * Used by other extraction methods with wrappers to perform
   * semantically correct extraction.
   *
   * @param vtableOffset The offset in the vtable to extract from
   * @param optional Is this an optional field?
   * @return {boolean | null} The extracted number.
   */
  public extractBinary(vtableOffset: number, optional: true): [Uint8Array, number] | null
  public extractBinary(vtableOffset: number, optional: false): [Uint8Array, number]
  public extractBinary(vtableOffset: number, optional: boolean): [Uint8Array, number] | null {

    const [cursor, endCursor] = this.getOffsetAndEndCursor( vtableOffset )
    const buffer              = this.buffer

    const value = stepExtractBinary(buffer, cursor, endCursor)

    if (value === void 0) {
      if (!optional) {
        throw new Error('Value in STEP was incorrectly typed')
      }

      if ( !this.model.nullOnErrors && stepExtractOptional(buffer, cursor, endCursor) !== null) {
        throw new Error('Value in STEP was incorrectly typed')
      }

      return null
    }

    return value
  }

  /**
   * Make it so this particular object is not held in the cache.
   */
  public invalidate(): void {

    ( this.internalReference_ as
      StepEntityInternalReferencePrivate< EntityTypeIDs, StepEntityBase< EntityTypeIDs > >).entity =
       void 0
  }

  /**
   * Extract a parse buffer at a particular vtable offset.
   *
   * @param offset
   * @param result
   * @param module
   * @param optional
   * @return {boolean} True if this extracts, false (usually because this is optional)
   */
  public extractParseBuffer(
      offset: number,
      result: ParseBuffer,
      module: WasmModule,
      optional: boolean ): boolean {

    this.guaranteeVTable()

    const internalReference =
      this.internalReference_ as Required< StepEntityInternalReference< EntityTypeIDs > >

    if ( offset >= internalReference.vtableCount ) {
      throw new Error( 'Couldn\'t read field due to too few fields in record' )
    }

    const buffer     = this.buffer
    const vtableSlot = internalReference.vtableIndex + offset
    const cursor     = internalReference.vtable[ vtableSlot ]
    const nextSlot   = vtableSlot + 1
    const endCursor  =
      nextSlot < internalReference.vtableCount ?
        ( internalReference.vtable[ nextSlot ] - 1 ) :
        internalReference.endCursor

    if ( optional && stepExtractOptional( buffer, cursor, endCursor ) === null ) {

      return false
    }

    const dataPtr = result.resize( endCursor - cursor )

    module.HEAPU8.set( buffer.subarray( cursor, endCursor ), dataPtr )

    return true
  }


  /**
   * Extract a number at the particular vtable offset (i.e. the position
   * in the matching step object).
   *
   * Used by other extraction methods with wrappers to perform
   * semantically correct extraction.
   *
   * @param offset The offset in the vtable to extract from
   * @param optional Is this an optional field? (true)
   * @return {boolean | null} The extracted number or null if it's
   * not supplied.
   */
  public extractBoolean(offset: number, optional: true): boolean | null
  /**
   * Extract a number at the particular vtable offset (i.e. the position
   * in the matching step object).
   *
   * Used by other extraction methods with wrappers to perform
   * semantically correct extraction.
   *
   * @param offset The offset in the vtable to extract from
   * @param optional Is this an optional field? (false).
   * @return {boolean} The extracted number.
   */
  public extractBoolean(offset: number, optional: false): boolean
  /**
   * Extract a number at the particular vtable offset (i.e. the position
   * in the matching step object).
   *
   * Used by other extraction methods with wrappers to perform
   * semantically correct extraction.
   *
   * @param offset The offset in the vtable to extract from
   * @param optional Is this an optional field?
   * @return {boolean | null} The extracted number or null if it's
   * not supplied.
   */
  public extractBoolean(offset: number, optional: boolean): boolean | null {

    const [cursor, endCursor] = this.getOffsetAndEndCursor( offset )
    const buffer              = this.buffer

    const value = stepExtractBoolean(buffer, cursor, endCursor)

    if (value === void 0) {
      if (!optional) {
        throw new Error('Value in STEP was incorrectly typed')
      }

      if ( !this.model.nullOnErrors && stepExtractOptional(buffer, cursor, endCursor) !== null) {
        throw new Error('Value in STEP was incorrectly typed')
      }

      return null
    }

    return value
  }

  /**
   * Get the backing buffer for this. Note this is only for internal
   * code-gen purposes, and is unsafe otherwise.
   *
   * @return {Uint8Array} The buffer for this.
   */
  protected get buffer(): Uint8Array {

    return this.internalReference_.buffer as Uint8Array
  }

  /**
   * Get both the buffer offset and end cursor for
   * a particular vtable offset.
   *
   * @param vtableOffset The vtable offset to get the cursor/endcursor for.
   * @return {[number,number]} The cursor and end cursor in the read buffer.
   */
  protected getOffsetAndEndCursor( vtableOffset: number ): [number, number] {

    this.guaranteeVTable()

    const internalReference =
      this.internalReference_ as Required< StepEntityInternalReference< EntityTypeIDs > >

    if ( vtableOffset >= internalReference.vtableCount ) {
      throw new Error( 'Couldn\'t read field due to too few fields in record' )
    }

    const vtableSlot = internalReference.vtableIndex + vtableOffset

    return [
      internalReference.vtable[ vtableSlot ],
      ( ( vtableOffset + 1 ) !== internalReference.vtableCount ) ?
        ( internalReference.vtable[ vtableSlot + 1 ] - 1 ) :
        internalReference.endCursor,
    ]
  }

  /**
   * Get the buffer cursor for a particular offset.
   *
   * @param offset The offset in the v-table.
   * @return {number} The cursor.
   */
  protected getOffsetCursor( offset: number ): number {

    this.guaranteeVTable()

    const internalReference =
      this.internalReference_ as Required< StepEntityInternalReference< EntityTypeIDs > >

    if ( offset >= internalReference.vtableCount ) {
      throw new Error( 'Couldn\'t read field due to too few fields in record' )
    }

    const vtableSlot = internalReference.vtableIndex + offset

    return internalReference.vtable[ vtableSlot ]
  }

  /**
   * Get the buffer cursor for a particular offset.
   *
   * @param offset The offset in the v-table.
   * @return {number} The cursor.
   */
  protected getEndCursor( offset: number ): number {

    const internalReference =
      this.internalReference_ as Required< StepEntityInternalReference< EntityTypeIDs > >

    ++offset

    if ( offset === internalReference.vtableCount ) {

      return internalReference.endCursor
    }

    if ( offset > internalReference.vtableCount ) {
      throw new Error( 'Couldn\'t read field due to too few fields in record' )
    }

    const vtableSlot = internalReference.vtableIndex + offset

    return internalReference.vtable[ vtableSlot ]
  }

  /**
   * Construct this with the local ID, internal reference and
   * the model.
   *
   * @param localID The local (dense) ID within the model, that acts as a reference.
   * @param internalReference_  The internal reference to model components etc.
   * @param model The model this came from.
   */
   
  /* Note that ES lint doesn't parse the typescript meaning of this constructor
   * correctly. */
  constructor(
    public readonly localID: number,
    protected readonly internalReference_: StepEntityInternalReference<EntityTypeIDs>,
    public readonly model: StepModelBase<EntityTypeIDs>) { }
   

  /**
   * Guarantees the VTable of this has been parsed from the model so that values can be read out.
   */
  protected guaranteeVTable(): void {
    if (this.internalReference_.vtableIndex === void 0) {
      const populated = this.model.populateVtableEntry(this.localID)

      if (!populated) {
        throw new Error('Entity does not have matching table entry to read from model')
      }
    }
  }

  /**
   * Guarantees the VTable of this has been parsed from the model so that values can be read out.
   */
  protected guaranteeBuffer(): void {
    if (this.internalReference_.buffer === void 0) {
      this.model.populateBufferEntry(this.localID)
    }
  }
}
