/* eslint-disable */
import {shape_definition_representation } from '../../AP214E3_2010/AP214E3_2010_gen/shape_definition_representation.gen';
import {product} from '../../AP214E3_2010/AP214E3_2010_gen/product.gen'
import {
  IfcAPI,
} from './ifc_api'
import { IfcApiProxyAP214 } from './ifc_api_proxy_ap214';


interface Node {
    expressID: number
    type: string
    children: Node[]
}

export class AP214Properties {

  private types: any

  constructor(private api: IfcApiProxyAP214) {
  }

  getIfcType(type: number) {
    return ''
  }

  async getItemProperties(id: number, recursive = false) {
    return this.api.getLine(id, recursive)
  }

  async getPropertySets(elementID: number, recursive = false) {
    return []
  }

  async getTypeProperties(elementID: number, recursive = false) {
    return []
  }

  async getMaterialsProperties(elementID: number, recursive = false) {
    return []
  }

  async getSpatialStructure(includeProperties?: boolean) {

    const model = this.api.StepModel
    const products = Array.from( model.types(product) )
    const productObj = products[0]
    const productNode = AP214Properties.newAP214Product(productObj.expressID!)
    
    const shapeDefinitions = model.types(shape_definition_representation)

    for ( const shapeDefinition of shapeDefinitions ) {

      const nodeExpressID = shapeDefinition.expressID

      if ( nodeExpressID !== void 0 ) {

        productNode.children.push({
          expressID: nodeExpressID,
          type: 'shape_definition',
          children: [],
        })
      }
    }

    return productNode
  }

  async getAllItemsOfType(type: number, verbose: boolean) {

    return []
  }

  private static newAP214Product(id: number): Node {
    return {
      expressID: id,
      type: 'product',
      children: [],
    }
  }
}
