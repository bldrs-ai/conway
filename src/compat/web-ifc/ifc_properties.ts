/* eslint-disable */
// Import the IFC type-code constants from their defining leaf module,
// NOT through the './ifc_api' re-export. ifc_api re-exports ifc2x4
// (`export * from './ifc2x4'`) AND pulls in the proxy → ifc_properties
// chain, so importing these values back through ifc_api forms a cycle
// whose const bindings are still in the temporal dead zone at load time
// (ReferenceError: Cannot access 'IFCRELAGGREGATES' before initialization).
import {
  IFCPROJECT, IFCRELAGGREGATES, IFCRELASSOCIATESMATERIAL,
  IFCRELCONTAINEDINSPATIALSTRUCTURE,
  IFCRELDEFINESBYPROPERTIES, IFCRELDEFINESBYTYPE,
} from './ifc2x4'
import { IfcApiProxyIfc } from './ifc_api_proxy_ifc';
import {
  IncludeProperties, Node, PropertiesPassthrough, PropertyReadOptions,
} from './properties_passthrough';

import { IfcElements, IfcTypesMap } from './types-map'


interface pName {
    name: number;
    relating: string;
    related: string;
    key: string;
}

const PropsNames = {
  aggregates: {
    name: IFCRELAGGREGATES,
    relating: 'RelatingObject',
    related: 'RelatedObjects',
    key: 'children',
  },
  spatial: {
    name: IFCRELCONTAINEDINSPATIALSTRUCTURE,
    relating: 'RelatingStructure',
    related: 'RelatedElements',
    key: 'children',
  },
  psets: {
    name: IFCRELDEFINESBYPROPERTIES,
    relating: 'RelatingPropertyDefinition',
    related: 'RelatedObjects',
    key: 'hasPsets',
  },
  materials: {
    name: IFCRELASSOCIATESMATERIAL,
    relating: 'RelatingMaterial',
    related: 'RelatedObjects',
    key: 'hasMaterial',
  },
  type: {
    name: IFCRELDEFINESBYTYPE,
    relating: 'RelatingType',
    related: 'RelatedObjects',
    key: 'hasType',
  },
}

/**
 * Element -> relating IDs for one relationship kind (property sets, types,
 * materials): parallel arrays sorted by `related`, so an element's pairs
 * are one contiguous run. 8 bytes per pair. See IfcProperties.relatedIndex.
 */
interface RelatedIndex {
  related: Uint32Array
  relating: Uint32Array
}

export class IfcProperties implements PropertiesPassthrough {

  private types: any

  /** Relationship type code -> its index, built on first use. */
  private readonly relatedIndexes_ = new Map<number, Promise<RelatedIndex>>()

  constructor(private api: IfcApiProxyIfc) {
  }

  getIfcType(type: number) {
    return IfcTypesMap[type]
  }

  /**
   * Page in the byte range backing a record before a synchronous read,
   * when the model's source has been spilled to an external store.
   * Fast no-op (no promise allocation) while fully resident.
   *
   * @param id The record's express ID.
   */
  private async ensureLine(id: number) {
    if (this.api.sourceIsExternal) {
      await this.api.ensureLineResident(id)
    }
  }

  // A recursive read leaves geometry representations as handles unless
  // `options.includeRepresentations`, and on a spilled source pages in the
  // record's #ref closure first; see IfcApiProxyIfc.getLineResident
  // (conway#761).
  async getItemProperties(id: number, recursive = false, options?: PropertyReadOptions) {
    return await this.api.getLineResident(id, recursive, options?.includeRepresentations === true)
  }

  async getPropertySets(elementID: number, recursive = false, options?: PropertyReadOptions) {
    return await this.getProperty(elementID, recursive, PropsNames.psets, options)
  }

  async getTypeProperties(elementID: number, recursive = false, options?: PropertyReadOptions) {
    return await this.getProperty(elementID, recursive, PropsNames.type, options)
  }

  async getMaterialsProperties(elementID: number, recursive = false, options?: PropertyReadOptions) {
    return await this.getProperty(elementID, recursive, PropsNames.materials, options)
  }

  async getSpatialStructure(includeProperties?: IncludeProperties): Promise< Node > {
    await this.getAllTypesOfModel()
    const chunks = await this.getSpatialTreeChunks()
    const allLines = await this.api.getLineIDsWithType(IFCPROJECT)
    const projectID = allLines.get(0)
    const project = IfcProperties.newIfcProject(projectID)
    // 'names' mode reads every node's Name/LongName/GlobalId up front, in
    // file order (conway#752). On a spilled source the walk below used to
    // page each node in tree order, which jumps across the file; on PSB
    // (860 MB, ~124 MB window) that re-read about 25x the file. The tree
    // is still assembled in its own order from the prefetched names.
    let names: Map<number, object> | undefined
    if (includeProperties === 'names') {
      names = await this.readNameAttributes(
          IfcProperties.reachableIDs(projectID, chunks))
      Object.assign(project, names.get(projectID))
    }
    await this.getSpatialNode(project, chunks, includeProperties, names)
    this.cleanupTypes()
    return project
  }

  /**
   * Every express ID the spatial walk will visit from `rootID`, the root
   * included. Order is not significant: the result only feeds the file-order
   * prefetch.
   *
   * @param rootID The walk's root (the IfcProject).
   * @param treeChunks Relating ID -> related IDs, from getSpatialTreeChunks.
   * @return {Set<number>} The reachable IDs.
   */
  private static reachableIDs(rootID: number, treeChunks: any): Set<number> {
    const reachable = new Set<number>([rootID])
    const frontier = [rootID]
    while (frontier.length > 0) {
      const children = treeChunks[frontier.pop()!]
      if (children == undefined) {
        continue
      }
      for (const child of children) {
        if (!reachable.has(child)) {
          reachable.add(child)
          frontier.push(child)
        }
      }
    }
    return reachable
  }

  /**
   * Name/LongName/GlobalId handles for each ID, read in one file-order pass
   * over a spilled source (a plain loop over a resident one).
   *
   * @param ids The records to read.
   * @return {Promise<Map<number, object>>} expressID -> name attributes.
   */
  private async readNameAttributes(ids: Iterable<number>): Promise<Map<number, object>> {
    const names = new Map<number, object>()
    await this.api.visitLinesInFileOrder(ids, (id) => {
      names.set(id, this.api.getLineNameAttributes(id))
    })
    return names
  }

  async getAllItemsOfType(type: number, verbose: boolean) {
    const items: number[] = []
    const lines = await this.api.getLineIDsWithType(type)
    for (let i = 0; i < lines.size(); i++) {
      items.push(lines.get(i))
    }
    if (!verbose) {
      return items
    }
    const result: any[] = []
    for (let i = 0; i < items.length; i++) {
      await this.ensureLine(items[i])
      result.push(await this.api.getLine(items[i]))
    }
    return result
  }

  private async getProperty(
      elementID: number, recursive = false, propName: pName, options?: PropertyReadOptions) {
    const index = await this.relatedIndex(propName)
    const propSetIds = IfcProperties.relatingIDsOf(index, elementID)
    const result: any[] = []
    for (let i = 0; i < propSetIds.length; i++) {
      result.push(await this.api.getLineResident(
          propSetIds[i], recursive, options?.includeRepresentations === true))
    }
    return result
  }

  private async getChunks(chunks: any, propNames: pName) {
    const relation = await this.api.getLineIDsWithType(propNames.name)
    const ids: number[] = []
    for (let i = 0; i < relation.size(); i++) {
      ids.push(relation.get(i))
    }
    // Read the relationship rows in one file-order pass, then save them in
    // type-index order: saveChunk concatenates, so its order is the
    // children's order in the tree (conway#752).
    const rels = new Map<number, any>()
    await this.api.visitLinesInFileOrder(ids, (id) => {
      rels.set(id, this.api.getLine(id, false))
    })
    for (const id of ids) {
      this.saveChunk(chunks, propNames, rels.get(id))
    }
  }

  private static newIfcProject(id: number): Node {
    return {
      expressID: id,
      type: 'IFCPROJECT',
      children: [],
    }
  }

  /**
   * Populate `node.children`, recursively.
   *
   * Aggregation and spatial containment both save into the same
   * `treeChunks`, keyed by the relating ID, so one list holds a node's
   * children of both kinds (aggregates first, in type-index order). This
   * used to walk that list once per relationship kind, both times writing
   * `children`, so the second walk replaced the first's identical result.
   * Done at every level, that is 2^depth walks of each subtree (conway#752).
   * One walk gives the same tree.
   *
   * @param node The node to fill.
   * @param treeChunks Relating ID -> related IDs.
   * @param includeProperties The properties mode.
   * @param names Prefetched name attributes for 'names' mode.
   */
  private async getSpatialNode(
      node: Node,
      treeChunks: any,
      includeProperties?: IncludeProperties,
      names?: Map<number, object>) {
    await this.getChildren(node, treeChunks, PropsNames.aggregates, includeProperties, names)
  }

  private async getChildren(
      node: Node,
      treeChunks: any,
      propNames: pName,
      includeProperties?: IncludeProperties,
      names?: Map<number, object>) {
    const children = treeChunks[node.expressID]
    if (children == undefined) {
      return
    }
    const prop = propNames.key as keyof Node
    const nodes: any[] = []
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      let node = this.newNode(child)
      if (includeProperties === 'names') {
        // Light mode: Name/LongName/GlobalId handles only, which decodes
        // just those vtable slots instead of flattening the whole record.
        // Prefetched in file order by getSpatialStructure.
        Object.assign(node, names?.get(node.expressID))
      } else if (includeProperties) {
        const properties = await this.getItemProperties(node.expressID) as any
        node = {...properties, ...node}
      }
      await this.getSpatialNode(node, treeChunks, includeProperties, names)
      nodes.push(node)
    }
    (node[prop] as Node[]) = nodes
  }

  private newNode(id: number): Node {
    const typeName = this.getNodeType(id)
    return {
      expressID: id,
      type: typeName,
      children: [],
    }
  }

  private getNodeType(id: number) {
    const typeID = this.types[id]
    return IfcElements[typeID]
  }

  private async getSpatialTreeChunks() {
    const treeChunks: any = {}
    await this.getChunks(treeChunks, PropsNames.aggregates)
    await this.getChunks(treeChunks, PropsNames.spatial)
    return treeChunks
  }

  private saveChunk(chunks: any, propNames: pName, rel: any) {
    const relating = rel[propNames.relating].value
    const related = rel[propNames.related].map((r: any) => r.value)
    if (chunks[relating] == undefined) {
      chunks[relating] = related
    } else {
      chunks[relating] = chunks[relating].concat(related)
    }
  }

  private getRelated(rel: any, propNames: pName, IDs: number[]) {
    const element = rel[propNames.relating]
    if (!Array.isArray(element)) {
      IDs.push(element.value)
    } else {
      element.forEach((ele) => IDs.push(ele.value))
    }
  }

  /**
   * The element -> relating-IDs index for one relationship kind, built on
   * the first property read of that kind and kept for the model's life.
   *
   * Each `getProperty` used to read every relationship record of the kind
   * to find the few naming its element, paging in the window under each
   * and never releasing one. On an 860 MB model whose property-set
   * relationships sit in every one of its windows, every read, first or
   * not, paged the whole file again (conway#755). Now the records are read once, as
   * coalesced record spans in file order that page in no window at all
   * (IfcApiProxyIfc.visitLineDataInFileOrder), and a read is a binary
   * search.
   *
   * Lazy, not part of the index build: a load that never reads properties
   * (geometry only, a CLI tree dump) never pays for it. Concurrent first
   * reads share one build; a build that throws is forgotten, so the next
   * read retries it.
   *
   * @param propNames The relationship kind.
   * @return {Promise<RelatedIndex>} The index.
   */
  private relatedIndex(propNames: pName): Promise<RelatedIndex> {
    let index = this.relatedIndexes_.get(propNames.name)
    if (index === undefined) {
      index = this.buildRelatedIndex(propNames)
      this.relatedIndexes_.set(propNames.name, index)
      index.catch(() => this.relatedIndexes_.delete(propNames.name))
    }
    return index
  }

  /**
   * One pass over the kind's relationship records: a pair per
   * (related, relating), sorted by related ID.
   *
   * An element's relating IDs come out in the order the old per-read scan
   * produced them: relationships in type-index order, then each
   * relationship's own relating order, and once per relationship even if
   * it lists the element twice. The file-order pass does not visit in
   * type-index order, hence the ordinal.
   *
   * @param propNames The relationship kind.
   * @return {Promise<RelatedIndex>} The index.
   */
  private async buildRelatedIndex(propNames: pName): Promise<RelatedIndex> {
    const lines = await this.api.getLineIDsWithType(propNames.name)
    const ids: number[] = []
    const ordinal = new Map<number, number>()
    for (let i = 0; i < lines.size(); i++) {
      const id = lines.get(i)
      ids.push(id)
      ordinal.set(id, i)
    }
    const related: number[] = []
    const relating: number[] = []
    const relOrdinal: number[] = []
    const relatingOfRel: number[] = []
    const seenInRel = new Set<number>()
    await this.api.visitLineDataInFileOrder(ids, (id, rel) => {
      if (rel === undefined) {
        return
      }
      relatingOfRel.length = 0
      this.getRelated(rel, propNames, relatingOfRel)
      const relatedItems = rel[propNames.related]
      const handles = Array.isArray(relatedItems) ? relatedItems : [relatedItems]
      const order = ordinal.get(id)!
      seenInRel.clear()
      for (const handle of handles) {
        const relatedID = handle.value
        if (seenInRel.has(relatedID)) {
          continue
        }
        seenInRel.add(relatedID)
        for (const relatingID of relatingOfRel) {
          related.push(relatedID)
          relating.push(relatingID)
          relOrdinal.push(order)
        }
      }
    })
    // Stable sort, so equal (related, relationship) keys keep the
    // relationship's own relating order.
    const permutation = Array.from(related, (_, i) => i)
    permutation.sort((a, b) => (related[a] - related[b]) || (relOrdinal[a] - relOrdinal[b]))
    const index: RelatedIndex = {
      related: new Uint32Array(permutation.length),
      relating: new Uint32Array(permutation.length),
    }
    for (let i = 0; i < permutation.length; i++) {
      index.related[i] = related[permutation[i]]
      index.relating[i] = relating[permutation[i]]
    }
    return index
  }

  /**
   * The relating IDs `index` holds for `elementID`, in order.
   *
   * @param index From relatedIndex.
   * @param elementID The related element.
   * @return {number[]} Its relating IDs (empty if none).
   */
  private static relatingIDsOf(index: RelatedIndex, elementID: number): number[] {
    const related = index.related
    let lo = 0
    let hi = related.length
    while (lo < hi) {
      const mid = (lo + hi) >>> 1
      if (related[mid] < elementID) {
        lo = mid + 1
      } else {
        hi = mid
      }
    }
    const IDs: number[] = []
    for (let i = lo; i < related.length && related[i] === elementID; i++) {
      IDs.push(index.relating[i])
    }
    return IDs
  }

  private cleanupTypes() {
    this.types = {}
  }

  private async getAllTypesOfModel() {
    const result: { [key: number]: number } = {}
    const elements = Object.keys(IfcElements).map((e) => parseInt(e))
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i]
      const lines = await this.api.getLineIDsWithType(element)
      const size = lines.size()
      // @ts-ignore
      for (let i = 0; i < size; i++) {
        result[lines.get(i)] = element
      }
    }
    this.types = result
  }
}
