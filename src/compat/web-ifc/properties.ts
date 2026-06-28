/* eslint-disable */
import {
  IfcAPI,
} from './ifc_api'

import { IfcTypesMap } from './types-map'

export class Properties {

  private types: any

  constructor(private api: IfcAPI) {
  }

  getIfcType(type: number) {
    return IfcTypesMap[type]
  }

  async getItemProperties(modelID: number, id: number, recursive = false) {
    return await this.api.getPassthrough( modelID )?.properties.getItemProperties(id, recursive)
  }

  async getPropertySets(modelID: number, elementID: number, recursive = false) {
    return await this.api.getPassthrough( modelID )?.properties.getPropertySets( elementID, recursive )
  }

  async getTypeProperties(modelID: number, elementID: number, recursive = false) {
    return await this.api.getPassthrough( modelID )?.properties.getTypeProperties( elementID, recursive )
  }

  async getMaterialsProperties(modelID: number, elementID: number, recursive = false) {
    return await this.api.getPassthrough( modelID )?.properties.getMaterialsProperties( elementID, recursive )
  }

  async getSpatialStructure(modelID: number, includeProperties?: boolean) {

    return await this.api.getPassthrough( modelID )?.properties.getSpatialStructure( includeProperties )
  }

  async getAllItemsOfType(modelID: number, type: number, verbose: boolean) {
    
    return await this.api.getPassthrough( modelID )?.properties.getAllItemsOfType( type, verbose )
  }
}