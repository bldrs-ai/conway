 

import StepEntityBase from '../step/step_entity_base'
import {
  curve,
  dimensional_exponents,
  direction,
  si_unit_name,
  surface,
  expression,
  kinematic_link,
  kinematic_link_representation,
  derived_unit,
  named_unit,
  object_role,
} from './AP214E3_2010_gen'
import EntityTypesIfc from './AP214E3_2010_gen/entity_types_ap214.gen'


/**
 * Make an array from an array.
 *
 * @param lis
 * @param low1
 * @param u1
 * @param low2
 * @param u2
 * @template T The inner type of the array
 * @return {Array<Array<T>>} The sectioned array.
 */
export function make_array_of_array< T >(
    lis: Array<Array<T>>,
    low1: number,
    u1: number,
    low2: number,
    u2: number) : Array<Array<T>> {

  const result = [] as Array< Array< T > >

  for ( let u = low1; u < u1; ++u ) {

    const toAdd = [] as Array< T >

    for ( let v = low2; v < u2; ++v ) {

      toAdd.push( lis[ v ][ u ] )
    }

    result.push( toAdd )
  }

  return result
}

/**
 * Slice a list into a new array.
 *
 * @param list The initial list
 * @param lower The lower bound (inclusive)
 * @param upper The upper bound (exclusive)
 * @template T The inner type of the array
 * @return The sliced array.
 */
export function list_to_array< T >(list: T[], lower: number, upper: number): T[] {
  return list.slice(lower, upper)
}

 
/**
 *
 *
 * @param name The unit name
 * @return The matching exponents
 */
export function dimensions_for_si_unit(name: si_unit_name): dimensional_exponents {
  throw new Error('Function not implemented.')
}

/**
 *
 * @param orientation
 * @param items
 * @template T The inner type of the array
 * @return The conditionally reversed array
 */
export function conditional_reverse< T >(orientation: boolean, items: T[]): T[] {
  return orientation ? items : [...items].reverse()
}

/**
 *
 * @param arg0
 */
export function get_basis_surface(arg0: curve): surface[] {
  throw new Error('Function not implemented.')
}

/**
 * Choose between two values based on the value of a boolean. (ife)
 *
 * @param orientation
 * @param fromTrue
 * @param fromFalse
 * @template T The inner type of the array
 * @return The chosen value
 */
export function boolean_choose< T >(orientation: boolean, fromTrue: T, fromFalse: T): T {
  return orientation ? fromTrue : fromFalse
}

/**
 *
 * @param ref_direction
 */
export function build_2axes(ref_direction: direction | null): direction[] {
  throw new Error('Function not implemented.')
}

/**
 *
 * @param axis
 * @param ref_direction
 */
export function build_axes(axis: direction | null, ref_direction: direction | null): direction[] {
  throw new Error('Function not implemented.')
}

/**
 *
 * @param arg0
 */
export function is_sql_mappable(arg0: expression): boolean {
  throw new Error('Function not implemented.')
}

/**
 *
 * @param arg0
 */
export function is_int_expr(arg0: expression): boolean {
  throw new Error('Function not implemented.')
}

/**
 *
 * @param base
 */
export function representation_of_link(base: kinematic_link): kinematic_link_representation {
  throw new Error('Function not implemented.')
}

/**
 *
 * @param arg0
 */
export function get_name_value(arg0: StepEntityBase< EntityTypesIfc >): string {
  throw new Error('Function not implemented.')
}

/**
 * Get the express ID of a particular entity
 *
 * @param arg0 The element to extract the express ID from
 * @return The express id or "inline" for inline elements
 */
export function get_id_value(arg0: StepEntityBase< EntityTypesIfc >): string {
  return arg0.expressID?.toString() ?? 'inline'
}

/**
 *
 * @param arg0
 */
export function get_description_value(arg0: StepEntityBase< EntityTypesIfc >): string {
  throw new Error('Function not implemented.')
}

/**
 *
 * @param arg0
 */
export function get_multi_language(arg0: StepEntityBase< EntityTypesIfc >): string {
  throw new Error('Function not implemented.')
}

/**
 *
 * @param unit
 */
export function derive_dimensional_exponents( unit: derived_unit | named_unit ):
  dimensional_exponents {
  throw new Error('Function not implemented.')
}

/**
 * Get the dimension of an entity.
 *
 * @param arg0 The object to get the dimension of
 * @throws {Error} Not implemented.
 */
export function dimension_of(arg0: StepEntityBase< EntityTypesIfc >): number {
  throw new Error('Function not implemented.')
}

/**
 * Get the role from an entity.
 *
 * @param arg0 The object to get the role from
 * @throws {Error} Not implemented.
 */
export function get_role(arg0: StepEntityBase< EntityTypesIfc >): object_role {
  throw new Error('Function not implemented.')
}
