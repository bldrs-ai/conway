import {
  AP214ProductStructureExtraction,
  ProductStructureNode,
} from '../../AP214E3_2010/ap214_product_structure_extraction'
import {
  AP214PropertyExtraction,
  ExtractedProperty,
  ExtractedPropertyMap,
} from '../../AP214E3_2010/ap214_property_extraction'
import EntityTypesAP214 from '../../AP214E3_2010/AP214E3_2010_gen/entity_types_ap214.gen'
import AP214StepModel from '../../AP214E3_2010/ap214_step_model'
import { IfcApiProxyAP214 } from './ifc_api_proxy_ap214'
import { Node } from './properties_passthrough'


/**
 * Spatial node enriched with the STEP fields Share consumes
 * (`bldrsSpatialTree.js serializeNode` preserves `Name`) plus the occurrence
 * identity that STEP forces.
 */
interface AP214Node extends Node {

  /** Display label, emitted from `product.name`. */
  Name: string

  /** Express id of the underlying `product_definition` (the part *type*). */
  productDefinitionExpressID: number

  /**
   * Ordered occurrence path (NAUO express ids) root→node. This is the
   * format-agnostic selection / permalink token that a scalar `expressID`
   * cannot represent — see `design/new/step-metadata-nist.md`
   * §"Occurrence identity". Share still keys selection on `expressID` today;
   * generalizing that to this path is the STEP-driven follow-up flagged in the
   * plan.
   */
  occurrencePath: number[]

  children: AP214Node[]
}

/** A property row as surfaced to the web-ifc compat consumers. */
interface AP214PropertyRow {
  Name: string
  NominalValue: string | number
  group: string
}

/** Express id used for a synthetic root when a file has multiple roots. */
const SYNTHETIC_ROOT_EXPRESS_ID = 0

/**
 * web-ifc-compatible property/spatial surface over an AP214/AP242 step model.
 *
 * Backed by {@link AP214ProductStructureExtraction} and
 * {@link AP214PropertyExtraction}: `getSpatialStructure` returns the real
 * nested, named, occurrence-keyed tree (replacing the old flat, nameless stub);
 * `getItemProperties` / `getPropertySets` return the extracted attribute and
 * validation rows; `getAllItemsOfType` is backed by the model type index.
 *
 * This is the seam Share consumes (via `IfcApiProxyAP214`); nothing in Share
 * changes — it lights up the moment this returns a real tree.
 */
export class AP214Properties {

  private structureRoots_?: ProductStructureNode[]
  private propertyMap_?: ExtractedPropertyMap
  private ownerByExpressID_?: Map<number, number>

  /**
   * @param api The AP214 passthrough proxy owning the step model.
   */
  constructor( private api: IfcApiProxyAP214 ) {
  }

  /**
   * No-op type-name lookup retained for interface compatibility; AP214 surfaces
   * STEP entity names directly on the nodes.
   *
   * @param type The numeric type code.
   * @return {string} The empty string (AP214 has no IFC type-name map).
   */
  getIfcType( type: number ): string {
    return ''
  }

  /**
   * Get a part's merged item properties: its node identity plus extracted
   * key/values.
   *
   * @param id Node express id (a NAUO occurrence id, or a product-definition id
   * for single-part files).
   * @param recursive Unused; kept for web-ifc signature parity.
   * @return {Promise<object>} The merged item-properties object.
   */
  async getItemProperties( id: number, recursive = false ): Promise<object> {

    const properties: Record<string, string | number> = {
      expressID: id,
    }

    for ( const row of this.rowsForElement( id ) ) {
      properties[row.Name] = row.NominalValue
    }

    return properties
  }

  /**
   * Get a part's property sets: one set per grouping label (plain attributes vs.
   * validation properties), each carrying its key/value rows.
   *
   * @param elementID Node express id.
   * @param recursive Unused; kept for web-ifc signature parity.
   * @return {Promise<any[]>} The property-set rows for the element.
   */
  async getPropertySets( elementID: number, recursive = false ): Promise<any[]> {

    const rows = this.rowsForElement( elementID )

    if ( rows.length === 0 ) {
      return []
    }

    const byGroup = new Map<string, AP214PropertyRow[]>()

    for ( const row of rows ) {

      let groupRows = byGroup.get( row.group )

      if ( groupRows === void 0 ) {
        groupRows = []
        byGroup.set( row.group, groupRows )
      }

      groupRows.push( row )
    }

    const propertySets: any[] = []

    for ( const [ group, groupRows ] of byGroup ) {
      propertySets.push( {
        Name: group.length > 0 ? group : 'Attributes',
        HasProperties: groupRows.map( ( row ) => ( {
          Name: row.Name,
          NominalValue: { value: row.NominalValue },
        } ) ),
      } )
    }

    return propertySets
  }

  /**
   * Type properties are not modeled for AP214 at the Simplified tier.
   *
   * @param elementID Node express id.
   * @param recursive Unused; kept for web-ifc signature parity.
   * @return {Promise<any[]>} An empty array.
   */
  async getTypeProperties( elementID: number, recursive = false ): Promise<any[]> {
    return []
  }

  /**
   * Material properties are not modeled for AP214 at the Simplified tier.
   *
   * @param elementID Node express id.
   * @param recursive Unused; kept for web-ifc signature parity.
   * @return {Promise<any[]>} An empty array.
   */
  async getMaterialsProperties( elementID: number, recursive = false ): Promise<any[]> {
    return []
  }

  /**
   * Get the real nested, named, occurrence-keyed product structure.
   *
   * @param includeProperties When true, merge each node's item properties onto
   * the node (mirrors the IFC surface's `includeProperties`).
   * @return {Promise<Node>} The root node. A single-root file returns its root
   * directly; a multi-root file is wrapped in a synthetic container root.
   */
  async getSpatialStructure( includeProperties?: boolean ): Promise<Node> {

    const roots = this.productStructure()

    const nodes = await Promise.all(
        roots.map( ( root ) => this.toSpatialNode( root, includeProperties ) ) )

    if ( nodes.length === 1 ) {
      return nodes[0]
    }

    const syntheticRoot: AP214Node = {
      expressID: SYNTHETIC_ROOT_EXPRESS_ID,
      type: 'product_structure',
      Name: 'Model',
      productDefinitionExpressID: SYNTHETIC_ROOT_EXPRESS_ID,
      occurrencePath: [],
      children: nodes,
    }

    return syntheticRoot
  }

  /**
   * Get every element of a STEP entity type, backed by the model type index.
   *
   * @param type The numeric AP214 entity type id.
   * @param verbose When true, return raw line data; otherwise express ids.
   * @return {Promise<any[]>} The matching elements (ids or raw lines).
   */
  async getAllItemsOfType( type: number, verbose: boolean ): Promise<any[]> {

    const model = this.api.StepModel
    const results: any[] = []

    for ( const element of model.typeIDs( type as EntityTypesAP214 ) ) {

      const expressID = element.expressID

      if ( expressID === void 0 ) {
        continue
      }

      results.push( verbose ? this.api.getRawLineData( expressID ) : expressID )
    }

    return results
  }

  /**
   * Convert an extracted structure node into a spatial node for the compat
   * surface, recursing into children.
   *
   * @param node The extracted product-structure node.
   * @param includeProperties When true, merge the node's item properties.
   * @return {Promise<AP214Node>} The converted spatial node.
   */
  private async toSpatialNode(
      node: ProductStructureNode,
      includeProperties?: boolean ): Promise<AP214Node> {

    const children = await Promise.all(
        node.children.map( ( childNode ) => this.toSpatialNode( childNode, includeProperties ) ) )

    let spatialNode: AP214Node = {
      expressID: node.expressID,
      type: node.type,
      Name: node.name,
      productDefinitionExpressID: node.productDefinitionExpressID,
      occurrencePath: node.occurrencePath,
      children,
    }

    if ( includeProperties ) {
      const properties = await this.getItemProperties( node.expressID )
      spatialNode = { ...properties, ...spatialNode }
    }

    return spatialNode
  }

  /**
   * Resolve the property rows for an element, mapping an occurrence node id back
   * to its owning product definition (where properties are keyed).
   *
   * @param id Node express id.
   * @return {AP214PropertyRow[]} The element's property rows (possibly empty).
   */
  private rowsForElement( id: number ): AP214PropertyRow[] {

    this.productStructure()

    const ownerId = this.ownerByExpressID_?.get( id ) ?? id
    const extracted = this.properties().get( ownerId )

    if ( extracted === void 0 ) {
      return []
    }

    return extracted.map( ( property: ExtractedProperty ) => ( {
      Name: property.name,
      NominalValue: property.numericValue ?? property.value,
      group: property.group,
    } ) )
  }

  /**
   * Lazily build and cache the product structure, plus the
   * occurrence-id → product-definition-id index used to attach properties.
   *
   * @return {ProductStructureNode[]} The cached assembly roots.
   */
  private productStructure(): ProductStructureNode[] {

    if ( this.structureRoots_ !== void 0 ) {
      return this.structureRoots_
    }

    const model: AP214StepModel = this.api.StepModel

    this.structureRoots_ =
      new AP214ProductStructureExtraction( model ).extractProductStructure()

    this.ownerByExpressID_ = new Map<number, number>()

    for ( const root of this.structureRoots_ ) {
      this.indexOwners( root )
    }

    return this.structureRoots_
  }

  /**
   * Record the owning product-definition id for a node and its descendants.
   *
   * @param node The node to index.
   */
  private indexOwners( node: ProductStructureNode ): void {

    this.ownerByExpressID_!.set( node.expressID, node.productDefinitionExpressID )

    for ( const childNode of node.children ) {
      this.indexOwners( childNode )
    }
  }

  /**
   * Lazily build and cache the extracted property map.
   *
   * @return {ExtractedPropertyMap} The cached per-part property map.
   */
  private properties(): ExtractedPropertyMap {

    if ( this.propertyMap_ === void 0 ) {
      this.propertyMap_ = new AP214PropertyExtraction( this.api.StepModel ).extractProperties()
    }

    return this.propertyMap_
  }
}
