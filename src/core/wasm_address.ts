/**
 * Normalize a raw wasm32 i32 pointer for use as a JavaScript array offset.
 *
 * Keep this dependency-free: parsing and the web-ifc compatibility layer both
 * need it, and importing wasm_heap there also pulls in Logger and the native
 * statistics module.
 *
 * @param pointer Raw pointer returned across the wasm boundary.
 * @return {number} The pointer interpreted as an unsigned wasm32 address.
 */
export function wasmAddress( pointer: number ): number {
  return pointer >>> 0
}
