/* eslint-disable */
import {
  IfcAPI,
} from './ifc_api'

import { IncludeProperties, SpatialStructureOptions } from './properties_passthrough'
import { IfcTypesMap } from './types-map'
import { IFC4X3_WEBIFC_TYPE_NAMES } from '../../ifc/ifc4x3_supertype_aliases'

export class Properties {

  private types: any

  constructor(private api: IfcAPI) {
  }

  getIfcType(type: number) {
    // Synthetic IFC4X3 sentinel codes (issue #280) first — IfcTypesMap,
    // web-ifc's own table, has no entry for them at all (see
    // ifc4x3_supertype_aliases.ts's IFC4X3_WEBIFC_TYPE_NAMES doc comment).
    return IFC4X3_WEBIFC_TYPE_NAMES[type] ?? IfcTypesMap[type]
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