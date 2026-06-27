export interface Node {
  expressID: number
  type: string
  children: Node[]
}

export interface PropertiesPassthrough {

  getIfcType(type: number): string | undefined

  getItemProperties(id: number, recursive?: boolean ): Promise< any >

  getPropertySets(elementID: number, recursive?: boolean ): Promise< any[] >

  getTypeProperties(elementID: number, recursive?: boolean ): Promise< any[] >

  getMaterialsProperties(elementID: number, recursive?: boolean): Promise< any[] >

  getSpatialStructure(includeProperties?: boolean): Promise< Node >

  getAllItemsOfType(type: number, verbose: boolean): Promise< any[] >
}

