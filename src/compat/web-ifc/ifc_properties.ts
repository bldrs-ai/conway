/* eslint-disable */
import {
  IFCPROJECT, IFCRELAGGREGATES, IFCRELASSOCIATESMATERIAL,
  IFCRELCONTAINEDINSPATIALSTRUCTURE,
  IFCRELDEFINESBYPROPERTIES, IFCRELDEFINESBYTYPE,
} from './ifc_api'
import { IfcApiProxyIfc } from './ifc_api_proxy_ifc';
import { Node, PropertiesPassthrough } from './properties_passthrough';

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

export class IfcProperties implements PropertiesPassthrough {

  private types: any

  constructor(private api: IfcApiProxyIfc) {
  }

  getIfcType(type: number) {
    return IfcTypesMap[type]
  }

  async getItemProperties(id: number, recursive = false) {
    return this.api.getLine(id, recursive)
  }

  async getPropertySets(elementID: number, recursive = false) {
    return await this.getProperty(elementID, recursive, PropsNames.psets)
  }

  async getTypeProperties(elementID: number, recursive = false) {
    return await this.getProperty(elementID, recursive, PropsNames.type)
  }

  async getMaterialsProperties(elementID: number, recursive = false) {
    return await this.getProperty(elementID, recursive, PropsNames.materials)
  }

  async getSpatialStructure(includeProperties?: boolean): Promise< Node > {
    await this.getAllTypesOfModel()
    const chunks = await this.getSpatialTreeChunks()
    const allLines = await this.api.getLineIDsWithType(IFCPROJECT)
    const projectID = allLines.get(0)
    const project = IfcProperties.newIfcProject(projectID)
    await this.getSpatialNode(project, chunks, includeProperties)
    this.cleanupTypes()
    return project
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
      result.push(await this.api.getLine(items[i]))
    }
    return result
  }

  private async getProperty(elementID: number, recursive = false, propName: pName) {
    const propSetIds = await this.getAllRelatedItemsOfType(elementID, propName)
    const result: any[] = []
    for (let i = 0; i < propSetIds.length; i++) {
      result.push(await this.api.getLine(propSetIds[i], recursive))
    }
    return result
  }

  private async getChunks(chunks: any, propNames: pName) {
    const relation = await this.api.getLineIDsWithType(propNames.name)
    for (let i = 0; i < relation.size(); i++) {
      const rel = await this.api.getLine(relation.get(i), false)
      this.saveChunk(chunks, propNames, rel)
    }
  }

  private static isRelated(id: number, rel: any, propNames: pName) {
    const relatedItems = rel[propNames.related]
    if (Array.isArray(relatedItems)) {
      const values = relatedItems.map((item) => item.value)
      return values.includes(id)
    }
    return relatedItems.value === id
  }

  private static newIfcProject(id: number): Node {
    return {
      expressID: id,
      type: 'IFCPROJECT',
      children: [],
    }
  }

  private async getSpatialNode(node: Node, treeChunks: any, includeProperties?: boolean) {
    await this.getChildren(node, treeChunks, PropsNames.aggregates, includeProperties)
    await this.getChildren(node, treeChunks, PropsNames.spatial, includeProperties)
  }

  private async getChildren(node: Node, treeChunks: any, propNames: pName, includeProperties?: boolean) {
    const children = treeChunks[node.expressID]
    if (children == undefined) {
      return
    }
    const prop = propNames.key as keyof Node
    const nodes: any[] = []
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      let node = this.newNode(child)
      if (includeProperties) {
        const properties = await this.getItemProperties(node.expressID) as any
        node = {...properties, ...node}
      }
      await this.getSpatialNode(node, treeChunks, includeProperties)
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

  private async getAllRelatedItemsOfType(id: number, propNames: pName) {
    const lines = await this.api.getLineIDsWithType(propNames.name)
    const IDs: number[] = []
    for (let i = 0; i < lines.size(); i++) {
      const rel = await this.api.getLine(lines.get(i))
      const isRelated = IfcProperties.isRelated(id, rel, propNames)
      if (isRelated) {
        this.getRelated(rel, propNames, IDs)
      }
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
