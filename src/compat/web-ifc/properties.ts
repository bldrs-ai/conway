/* eslint-disable */
import {
  IfcAPI,
} from './ifc_api'

import { IncludeProperties, PropertyReadOptions, SpatialStructureOptions } from './properties_passthrough'
import { IfcTypesMap } from './types-map'

export class Properties {

  private types: any

  constructor(private api: IfcAPI) {
  }

  getIfcType(type: number) {
    return IfcTypesMap[type]
  }

  // `options` (conway extension): see PropertyReadOptions. By default a
  // recursive read leaves geometry representations as handles.
  async getItemProperties(modelID: number, id: number, recursive = false, options?: PropertyReadOptions) {
    return await this.api.getPassthrough( modelID )?.properties.getItemProperties(id, recursive, options)
  }

  async getPropertySets(modelID: number, elementID: number, recursive = false, options?: PropertyReadOptions) {
    return await this.api.getPassthrough( modelID )?.properties.getPropertySets( elementID, recursive, options )
  }

  async getTypeProperties(modelID: number, elementID: number, recursive = false, options?: PropertyReadOptions) {
    return await this.api.getPassthrough( modelID )?.properties.getTypeProperties( elementID, recursive, options )
  }

  async getMaterialsProperties(modelID: number, elementID: number, recursive = false, options?: PropertyReadOptions) {
    return await this.api.getPassthrough( modelID )?.properties.getMaterialsProperties( elementID, recursive, options )
  }

  async getSpatialStructure(
      modelID: number,
      includeProperties?: IncludeProperties,
      options?: SpatialStructureOptions ) {

    return await this.api.getPassthrough( modelID )?.properties
        .getSpatialStructure( includeProperties, options )
  }

  async getAllItemsOfType(modelID: number, type: number, verbose: boolean) {
    
    return await this.api.getPassthrough( modelID )?.properties.getAllItemsOfType( type, verbose )
  }
}