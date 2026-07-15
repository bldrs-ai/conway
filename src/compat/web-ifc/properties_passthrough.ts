/**
 * A web-ifc tape value handle — `{ type: 1, value: 'str' }` for strings.
 * Consumers (e.g. `@bldrs-ai/ifclib`'s `deref`) switch on the tape type
 * code, so bare `{ value }` objects are not interchangeable with these.
 */
export interface NodeValueHandle {
  type: number
  value: string | number
}

export interface Node {
  expressID: number
  type: string
  children: Node[]

  // Present in the `'names'` spatial-structure mode (and, along with the
  // rest of the flattened attribute record, in the `true` mode).
  Name?: NodeValueHandle
  LongName?: NodeValueHandle
  GlobalId?: NodeValueHandle
}

/**
 * Spatial-structure property inclusion mode:
 * - `false`/`undefined` — bare nodes (expressID/type/children).
 * - `'names'` — bare nodes plus Name/LongName/GlobalId value handles,
 *   read without materialising each node's full attribute record.
 * - `true` — full flattened attribute record spread into each node
 *   (web-ifc parity behavior).
 */
export type IncludeProperties = boolean | 'names'

/**
 * Optional spatial-structure shaping, beyond web-ifc parity.
 */
export interface SpatialStructureOptions {

  /**
   * STEP (AP214/AP242) only: surface ephemeral solid-level nodes beneath
   * multibody products — pickable bodies that carry identity in the file but
   * no product semantics (`type: 'solid'`, `ephemeral: true`). Ignored by the
   * IFC surface. See `design/new/step-nonproduct-semantics.md`.
   */
  includeSolids?: boolean
}

export interface PropertiesPassthrough {

  getIfcType(type: number): string | undefined

  getItemProperties(id: number, recursive?: boolean ): Promise< any >

  getPropertySets(elementID: number, recursive?: boolean ): Promise< any[] >

  getTypeProperties(elementID: number, recursive?: boolean ): Promise< any[] >

  getMaterialsProperties(elementID: number, recursive?: boolean): Promise< any[] >

  getSpatialStructure(
    includeProperties?: IncludeProperties,
    options?: SpatialStructureOptions ): Promise< Node >

  getAllItemsOfType(type: number, verbose: boolean): Promise< any[] >
}
