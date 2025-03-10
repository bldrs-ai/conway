import {
  BlendMode,
  ConwayGeometryWasm,
  MaterialObject,
  toAlphaMode,
} from '../../dependencies/conway-geom'


export type ColorRGBA = [number, number, number, number]

const ROUGNESS_CONVERSION_FACTOR = 2.0

/**
 * Convert a specular exponent (e.g. phong or blinn) to roughness
 *
 * Uses the conversion from - http://simonstechblog.blogspot.com/2011/12/microfacet-brdf.html
 *
 * @param shininess The shinyness exponent/𝛼 to convert to roughness
 * @return {number} The resultant roughness.
 */
export function exponentToRoughness(shininess: number): number {
  return Math.sqrt(ROUGNESS_CONVERSION_FACTOR /
    (shininess + ROUGNESS_CONVERSION_FACTOR))
}

/**
 * Convert a roughness to specular exponent
 *
 * Uses the conversion from - http://simonstechblog.blogspot.com/2011/12/microfacet-brdf.html
 *
 * @param shininess The shinyness exponent/𝛼 to convert to roughness
 * @return {number} The resultant roughness.
 */
export function roughnessToExponent(roughness: number): number {
  return ( ROUGNESS_CONVERSION_FACTOR /
    ( Math.pow( roughness, ROUGNESS_CONVERSION_FACTOR ) ) ) -
    ROUGNESS_CONVERSION_FACTOR
}

/**
 * A canonical material represents the internal material type we pass
 * around and support wiring up to gltf like properties.
 */
export interface CanonicalMaterial {

  /**
   * The name of this material, which may be procedurally generated.
   */
  readonly name: string

  /**
   * The base color of this material (in PBR terms)
   */
  readonly baseColor: ColorRGBA

  /**
   * Legacy color to match web-ifc display
   */
  readonly legacyColor: ColorRGBA

  /**
   * How metallic is this surface? 0 for dialletric, 1 for metal.
   */
  readonly metalness?: number

  /**
   * How rough is this surface vs how shiny (1 for maximum rougness, 0 for full specular)
   */
  readonly roughness?: number

  /**
   * The index of refraction of this surface.
   */
  readonly ior?: number

  /**
   * The specular color of this surface (F0, overrides the F0 that would
   * be produced by baseColor, metalness and index of refraction).
   */
  readonly specular?: ColorRGBA

  /**
   * Is this material double sided or is it back face culled?
   */
  readonly doubleSided: boolean

  /**
   * The blend mode for this surface (should probably be opaque).
   */
  readonly blend: BlendMode

  /* In future we may add support for more types here, but realistically
     we want to keep this implementable in gltf */
}

/**
 * A materila name cleaned for OBJ syntax
 *
 * @param from The material to get a clean name for
 * @return {string} The cleaned name
 */
export function getMTLCleanName( from: CanonicalMaterial ): string {
  return from.name.replaceAll( '#', '_' )
}

/**
 * Dump a material to MTL format.
 *
 * @param from The material to dump.
 * @return {string} The MTL formatted string.
 */
export function dumpMTL( from: CanonicalMaterial ): string {

  let result = `newmtl ${getMTLCleanName( from )}\n`

  const AMBIENT = 0.05

  // eslint-disable-next-line max-len
  result += `Ka ${from.baseColor[0] * AMBIENT} ${from.baseColor[1] * AMBIENT} ${from.baseColor[2] * AMBIENT}\n`

  if ( from.metalness === void 0 ) {
    result += `Kd ${from.baseColor[0]} ${from.baseColor[1]} ${from.baseColor[2]}\n`
  } else {

    const albedoFactor = 1.0 - from.metalness

    // eslint-disable-next-line max-len
    result += `Kd ${from.baseColor[0] * albedoFactor} ${from.baseColor[1] * albedoFactor} ${from.baseColor[2] * albedoFactor}\n`
  }

  result += `d ${from.baseColor[3]}\n`

  if ( from.roughness !== void 0 ) {

    result += `Ns ${roughnessToExponent(from.roughness)}\n`
  }

  if ( from.ior !== void 0 ) {

    result += `Ni ${from.ior}\n`
  }

  if ( from.specular !== void 0 ) {

    result += `Ks ${from.specular[0]} ${from.specular[1]} ${from.specular[2]}\n`

  } else if ( from.metalness !== void 0 ) {

    // This is a physically based interpretation mapped to MTL

    const DEFAULT_IOR = 1.5 // Common diffuse objects like brick, vegetables, bone
    const ior = from.ior ?? DEFAULT_IOR

    const f0Root = Math.abs( ( 1.0 - ior ) / ( 1.0 + ior ) )
    const f0     = f0Root * f0Root

    const antiMetal = ( 1.0 - from.metalness ) * f0
    const specularR = antiMetal + ( from.baseColor[ 0 ] * from.metalness )
    const specularG = antiMetal + ( from.baseColor[ 1 ] * from.metalness )
    const specularB = antiMetal + ( from.baseColor[ 2 ] * from.metalness )

    result += `Ks ${specularR} ${specularG} ${specularB}\n`
  }

  if ( from.roughness !== void 0 || from.specular !== void 0 || from.metalness !== void 0 ) {

    result += `illum 2\n`
  } else {

    result += `illum 1\n`
  }

  return result
}

/* eslint-disable no-magic-numbers */
export const defaultCanonicalMaterial: CanonicalMaterial = {

  name: 'Default Conway Material',
  blend: BlendMode.OPAQUE,
  baseColor: [0.7, 0.7, 0.9, 1],
  doubleSided: true,
  legacyColor: [0.7, 0.7, 0.9, 1],
  metalness: 0,
  roughness: 1,
  ior: 1.5,
}

/* eslint-enable no-magic-numbers */

/**
 * Convert a canonical material to a native material
 *
 * @param wasm The wasm object to use for conversion.
 * @param from The material to convert.
 * @return {MaterialObject} The native material object.
 */
export function toNativeMaterial(
    wasm: ConwayGeometryWasm,
    from: CanonicalMaterial): MaterialObject {
  const native: MaterialObject = {

    alphaCutoff: 0,
    alphaMode: toAlphaMode(wasm, from.blend),
    base: {
      x: from.baseColor[0],
      y: from.baseColor[1],
      z: from.baseColor[2],
      w: from.baseColor[3],
    },
    doubleSided: from.doubleSided,
    /* eslint-disable no-magic-numbers */
    ior: from.ior ?? 1.5,
    metallic: from.metalness ?? 1.0,
    roughness: from.roughness ?? 1.0,
    specular: from.specular !== void 0 ? {
      x: from.specular[0],
      y: from.specular[1],
      z: from.specular[2],
      w: from.specular[3],
    } : {
      x: 0,
      y: 0,
      z: 0,
      w: 1,
    },
  }
  /* eslint-enable no-magic-numbers */
  return native
}
