import SimpleMemoization from './simple_memoization'

// eslint-disable-next-line no-shadow
export enum CsgOperationType {

  /* eslint-disable no-unused-vars, no-magic-numbers */
  UNION = 0,
  INTERSECTION = 1,
  DIFFERENCE = 2,
  NEGATION = 3
  /* eslint-enable no-unused-vars, no-magic-numbers */
}

// Here, we represent CSG operations as data.

/**
 * Base for CSG operations
 */
export interface CsgOperationBase {

  readonly type: CsgOperationType

  readonly operand1ID: number

  readonly operand2ID?: number
}

/**
 * CSG union operation
 */
export interface CsgUnion extends CsgOperationBase {

  readonly type: CsgOperationType.UNION

  readonly operand1ID: number

  readonly operand2ID: number

}

/**
 * CSG intersection operation
 */
export interface CsgIntersection extends CsgOperationBase {

  readonly type: CsgOperationType.INTERSECTION

  readonly operand1ID: number

  readonly operand2ID: number
}

/**
 * CSG difference operation
 */
export interface CsgDifference extends CsgOperationBase {

  readonly type: CsgOperationType.DIFFERENCE

  readonly operand1ID: number

  readonly operand2ID: number
}

/**
 * CSG negation opeeration
 */
export interface CsgNegation extends CsgOperationBase {

  readonly type: CsgOperationType.NEGATION

  readonly operand1ID: number

  readonly operand2ID: undefined
}

/** Valid CSG operations */
export type CsgOperations = CsgUnion | CsgDifference | CsgIntersection | CsgNegation

/**
 * CSG Memoization
 */
export class CsgMemoization extends SimpleMemoization< CsgOperations > {

  /**
   * Updates simple memoization
   */
  // eslint-disable-next-line no-useless-constructor
  constructor() {
    super()
  }
}

