// Covers the three ways arrayToWasmHeap used to go wrong quietly. All of them
// are cheap to exercise against a fake module, and none of them needed the
// geometry wasm - which is the point, since the real one only misbehaves under
// full-corpus memory pressure (bldrs-ai/conway#485).
import { describe, expect, test } from '@jest/globals'

import {
  arraysToWasmHeap, arrayToWasmHeap, freeAll, releaseQuietly,
  WasmHeapArrayConstructor, wasmHeapByteLength, WasmHeapModule, wasmHeapView,
  withRelease,
} from './wasm_heap'


const HEAP_BYTES = 1024

// #485's captured state in miniature: a heap that has grown, a module view
// still describing the size before it, and an address that is valid in the
// first and past the end of the second.
const STALE_HEAP_BYTES = 256
const GROWN_HEAP_BYTES = 1024
const GROWN_ADDRESS = 512

// Named rather than inlined, and non-zero, since what every assertion here
// actually checks is that the right bytes landed somewhere that starts out
// zero-filled.
const PAYLOAD = Float64Array.from( [ 1, 2, 3 ] )
const TAIL = Float64Array.from( [ 7, 8 ] )

/**
 * A stand-in for the emscripten module, with a heap we control.
 *
 * @param heapBytes Size of the fake heap.
 * @param malloc What _malloc should hand back.
 * @return {WasmHeapModule} The fake module.
 */
function fakeModule(
    heapBytes: number, malloc: ( bytes: number ) => number ): WasmHeapModule {

  const heap = new Uint8Array( new ArrayBuffer( heapBytes ) )

  return { _malloc: malloc, _free: () => { /* recorded by callers that care */ }, HEAPU8: heap }
}


// Distinctive enough that a test can assert an error is NOT one of these. The
// point of the assertions using them is that neither ever reaches a caller.
const SCRATCH_PUSH_FAILURE = 'embind push_back could not allocate'
const SCRATCH_DELETE_FAILURE = 'embind delete re-entered a dead runtime'

/**
 * Which halves of the embind scratch round trip should fail.
 *
 * Both are reachable, and for different reasons - see refreshHeapViews. This
 * is how the tests put the module into each of them.
 */
interface ScratchFaults {
  /** push_back throws: embind marshalling allocates, and the heap is short. */
  push?: boolean
  /** delete() throws: teardown re-enters a runtime that may have failed. */
  delete?: boolean
}

/** What growingFakeModule hands back, so a test can look at both buffers. */
interface GrowingFake {
  wasmModule: WasmHeapModule
  /** The buffer the module's views were bound to before the growth. */
  staleBuffer: ArrayBuffer
  /** The buffer the heap actually lives in after the growth. */
  grownBuffer: ArrayBuffer
  /** How many times a refresh route was taken. */
  refreshes: () => number
  /** Whether every scratch object the refresh took was given back. */
  balanced: () => boolean
}


/**
 * A module in exactly the state #485 was captured in.
 *
 * The heap has grown - a pthread did it, so this thread's glue never ran - and
 * growth on a NON-extensible SharedArrayBuffer produces a different buffer
 * object rather than lengthening the one in hand. So `_malloc` hands back an
 * address that is perfectly valid in the real heap and past the end of the
 * view the module is still caching, and stays that way until something makes
 * emscripten rebuild its views.
 *
 * `HEAPU8` is a getter for the same reason it is re-read rather than cached in
 * the code under test: the refresh REPLACES the property, and a fake that
 * handed out one fixed view could not tell a helper that re-reads from one
 * that does not.
 *
 * @param staleBytes Size of the heap the module's views still describe.
 * @param grownBytes Size of the heap that actually exists.
 * @param address What _malloc returns, an address in the grown region.
 * @param refresh How the fake models emscripten's refresh route. 'embind'
 * mimics the std::string round trip that is the only route conway's builds
 * have; 'none' models a module with no route at all.
 * @param scratchFaults Which halves of the embind round trip should throw.
 * Only meaningful for the 'embind' route.
 * @return {GrowingFake} The fake and the two buffers to assert against.
 */
function growingFakeModule(
    staleBytes: number,
    grownBytes: number,
    address: number,
    refresh: 'embind' | 'exported' | 'none' = 'embind',
    scratchFaults: ScratchFaults = {} ): GrowingFake {

  const staleBuffer = new ArrayBuffer( staleBytes )
  const grownBuffer = new ArrayBuffer( grownBytes )

  let viewsAreCurrent = false
  let refreshes = 0
  let outstanding = 0

  /** Model emscripten's updateMemoryViews: rebind everything to the real heap. */
  function rebind(): void {
    ++refreshes
    viewsAreCurrent = true
  }

  const wasmModule: WasmHeapModule = {
    _malloc: () => address,
    _free: () => { /* recorded by callers that care */ },

    get HEAPU8(): Uint8Array {
      return new Uint8Array( viewsAreCurrent ? grownBuffer : staleBuffer )
    },
  }

  if ( refresh === 'exported' ) {

    wasmModule.updateMemoryViews = rebind
  } else if ( refresh === 'embind' ) {

    // The refresh conway's builds actually have: emscripten's own glue calls
    // growMemViews() before touching the heap to marshal a std::string, so a
    // push_back is what rebuilds the module's views for us.
    wasmModule.stringVector = class {
      /** @param value Ignored; the marshalling is the point, not the string. */
      public push_back( value: string ): void {
        void value

        // Before the rebind, because a marshalling failure is a refresh that
        // did NOT happen - which is the state the caller then has to report.
        if ( scratchFaults.push === true ) {
          throw new Error( SCRATCH_PUSH_FAILURE )
        }

        rebind()
      }

      /** Returns the scratch vector to wasm. */
      public delete(): void {
        // Counted out first even when the fault is armed: what `balanced`
        // pins is that the delete was ATTEMPTED for every vector taken, and a
        // delete that throws has still been attempted.
        --outstanding

        if ( scratchFaults.delete === true ) {
          throw new Error( SCRATCH_DELETE_FAILURE )
        }
      }

      /** Counts itself out so the test can prove it was given back. */
      public constructor() {
        ++outstanding
      }
    }
  }

  return {
    wasmModule,
    staleBuffer,
    grownBuffer,
    refreshes: () => refreshes,
    balanced: () => outstanding === 0,
  }
}


describe( 'arrayToWasmHeap', () => {

  test( 'copies the array and returns the pointer', () => {

    const address = 64
    const wasmModule = fakeModule( HEAP_BYTES, () => address )
    const source = PAYLOAD

    expect( arrayToWasmHeap( wasmModule, source ) ).toBe( address )

    const written = new Float64Array(
      wasmModule.HEAPU8.buffer, address, source.length )

    expect( Array.from( written ) ).toEqual( Array.from( source ) )
  } )

  // The bug the IFC path had already fixed and the AP214 path had not: a
  // subarray shares its parent's buffer, so copying `array.buffer` wholesale
  // silently writes the parent's first bytes instead of the view's.
  test( 'copies a subarray\'s own window, not its parent buffer', () => {

    const address = 32
    const wasmModule = fakeModule( HEAP_BYTES, () => address )
    const parent = Float64Array.from( [ 0, 0, ...TAIL ] )
    const view = parent.subarray( 2 )

    arrayToWasmHeap( wasmModule, view )

    const written = new Float64Array(
      wasmModule.HEAPU8.buffer, address, view.length )

    expect( Array.from( written ) ).toEqual( Array.from( TAIL ) )
  } )

  // 0 is a valid byteOffset, so this used to construct a view happily and
  // write over whatever lives at address 0 rather than reporting exhaustion.
  test( 'reports a failed malloc instead of writing to address 0', () => {

    const wasmModule = fakeModule( HEAP_BYTES, () => 0 )

    expect( () => arrayToWasmHeap( wasmModule, PAYLOAD ) )
      .toThrow( /_malloc returned an unusable address/ )
  } )

  // A >2GB address is a SUCCESSFUL allocation that arrives signed, because
  // _malloc is a raw i32 export and every target builds with 4GB max. Treating
  // it as a failure would hard-fail every copy once the heap passes 2GB, which
  // is exactly the memory-pressure case #485 is about - so it is normalised,
  // not rejected. Simulated here by a heap sized past 2GB in address terms
  // only; nothing that big is allocated.
  test( 'an address above 2GB is normalised, not read as a failure', () => {

    const signedAddress = -2147483648
    const unsignedAddress = 2147483648
    const headroom = 4096

    const wasmModule: WasmHeapModule = {
      _malloc: () => signedAddress,
      _free: () => { /* unused here */ },
      HEAPU8: { length: 0, buffer: { byteLength: unsignedAddress + headroom } } as
        unknown as Uint8Array,
    }

    // Fails on the copy rather than on the guard, which is the proof it got
    // past the "unusable address" test with the address intact.
    expect( () => arrayToWasmHeap( wasmModule, PAYLOAD ) )
      .not.toThrow( /_malloc returned an unusable address/ )
  } )

  // #485's confirmed shape end to end: the heap grew on another thread, so
  // _malloc's address is real and the module's cached view ends before it.
  // Getting this wrong is not a crash but a WRONG ANSWER - the bytes have to
  // land in the heap that exists, not in the one the view remembers.
  test( 'copies into the grown heap when a pointer lands past the stale view',
      () => {

        const address = GROWN_ADDRESS

        const fake = growingFakeModule(
          STALE_HEAP_BYTES, GROWN_HEAP_BYTES, address )

        expect( arrayToWasmHeap( fake.wasmModule, PAYLOAD ) ).toBe( address )

        expect( fake.refreshes() ).toBe( 1 )

        const written = new Float64Array(
          fake.grownBuffer, address, PAYLOAD.length )

        expect( Array.from( written ) ).toEqual( Array.from( PAYLOAD ) )

        // Nothing may have been written to the buffer that is on its way out;
        // a write there is the silent-wrong-digest failure, not a loud one.
        expect( Array.from( new Uint8Array( fake.staleBuffer ) )
          .some( ( byte ) => byte !== 0 ) ).toBe( false )
      } )

  test( 'gives back the scratch object the refresh borrowed', () => {

    const fake = growingFakeModule(
      STALE_HEAP_BYTES, GROWN_HEAP_BYTES, GROWN_ADDRESS )

    arrayToWasmHeap( fake.wasmModule, PAYLOAD )

    expect( fake.balanced() ).toBe( true )
  } )

  // The refresh is not free, so it must not run on the ordinary path - which
  // is every copy but the handful that follow a growth.
  test( 'does not refresh when the pointer is already inside the view', () => {

    const insideAddress = 64

    const fake = growingFakeModule(
      GROWN_HEAP_BYTES, GROWN_HEAP_BYTES * 4, insideAddress )

    arrayToWasmHeap( fake.wasmModule, PAYLOAD )

    expect( fake.refreshes() ).toBe( 0 )
  } )

  // Same situation, but on a build that exports emscripten's own rebuilder.
  // Nothing conway ships does today; the point is that the preferred route is
  // taken without the embind detour when it is there.
  test( 'prefers an exported updateMemoryViews when the build has one', () => {

    const address = GROWN_ADDRESS
    const fake = growingFakeModule(
      STALE_HEAP_BYTES, GROWN_HEAP_BYTES, address, 'exported' )

    expect( arrayToWasmHeap( fake.wasmModule, PAYLOAD ) ).toBe( address )
    expect( fake.refreshes() ).toBe( 1 )
  } )

  // The genuinely-impossible case #498 added the diagnostic for. A refresh
  // that reconciles nothing means the address really is outside the heap, and
  // that has to keep reporting the state rather than being retried away.
  test( 'still reports the heap state when a refresh cannot reconcile it',
      () => {

        const past = GROWN_ADDRESS

        // Grown, but not far enough to contain the address either.
        const fake = growingFakeModule(
          STALE_HEAP_BYTES, STALE_HEAP_BYTES + PAYLOAD.byteLength, past )

        expect( () => arrayToWasmHeap( fake.wasmModule, PAYLOAD ) )
          .toThrow( /outside the heap/ )

        expect( fake.refreshes() ).toBe( 1 )

        try {
          arrayToWasmHeap( fake.wasmModule, PAYLOAD )
        } catch ( error ) {
          expect( ( error as Error ).message )
            .toContain( `ptr ${past} + ${PAYLOAD.byteLength} bytes` )
        }
      } )

  // The refresh is a repair ATTEMPT, and it runs under exactly the memory
  // pressure that makes embind's own marshalling allocation fail. If that
  // failure escapes, it reaches the caller INSTEAD of the heap diagnostic -
  // and #485 is the issue about how expensive it is to debug this path
  // without that diagnostic, so destroying it here would undo the fix.
  test( 'reports the heap state when the refresh itself cannot allocate', () => {

    const fake = growingFakeModule(
      STALE_HEAP_BYTES, GROWN_HEAP_BYTES, GROWN_ADDRESS, 'embind',
      { push: true } )

    let raised: unknown

    try {
      arrayToWasmHeap( fake.wasmModule, PAYLOAD )
    } catch ( error ) {
      raised = error
    }

    expect( ( raised as Error ).message ).toMatch( /outside the heap/ )
    expect( ( raised as Error ).message ).not.toContain( SCRATCH_PUSH_FAILURE )

    // The constructor is what registers the embind handle, so a vector whose
    // push threw is still owed a delete.
    expect( fake.balanced() ).toBe( true )
  } )

  // The mirror case, and the one where quieting actually changes the ANSWER
  // rather than the error text: by the time delete() runs the push has already
  // made emscripten rebuild the views, so the refresh succeeded and the copy
  // has somewhere correct to land. Failing it over the teardown of a scratch
  // object would break an operation that had just been repaired.
  test( 'completes the copy when only the refresh teardown fails', () => {

    const address = GROWN_ADDRESS

    const fake = growingFakeModule(
      STALE_HEAP_BYTES, GROWN_HEAP_BYTES, address, 'embind', { delete: true } )

    expect( arrayToWasmHeap( fake.wasmModule, PAYLOAD ) ).toBe( address )

    const written = new Float64Array( fake.grownBuffer, address, PAYLOAD.length )

    expect( Array.from( written ) ).toEqual( Array.from( PAYLOAD ) )
  } )

  // A module with no refresh route at all - which is what every fake here was
  // before this change, and what a non-emscripten module would be.
  test( 'reports the heap state when the module offers no refresh route', () => {

    const fake = growingFakeModule(
      STALE_HEAP_BYTES, GROWN_HEAP_BYTES, GROWN_ADDRESS, 'none' )

    expect( () => arrayToWasmHeap( fake.wasmModule, PAYLOAD ) )
      .toThrow( /outside the heap/ )

    expect( fake.refreshes() ).toBe( 0 )
  } )

  test( 'a zero-length copy is not mistaken for a failed malloc', () => {

    const wasmModule = fakeModule( HEAP_BYTES, () => 0 )

    expect( arrayToWasmHeap( wasmModule, new Float64Array( 0 ) ) ).toBe( 0 )
  } )

  // #485's signature. The bare RangeError says "Invalid typed array length: N"
  // and nothing else; this asserts the replacement carries the state needed to
  // tell a stale view from a genuine over-allocation.
  test( 'a pointer past the end of the heap view reports the heap state', () => {

    const past = HEAP_BYTES - 8
    const wasmModule = fakeModule( HEAP_BYTES, () => past )
    const source = PAYLOAD

    expect( () => arrayToWasmHeap( wasmModule, source ) )
      .toThrow( /outside the heap/ )

    try {
      arrayToWasmHeap( wasmModule, source )
    } catch ( error ) {
      const message = ( error as Error ).message

      expect( message ).toContain(
        `ptr ${past} + ${PAYLOAD.byteLength} bytes` )
      expect( message ).toContain( `byteLength ${HEAP_BYTES}` )
      // 'ArrayBuffer' alone would also match 'SharedArrayBuffer', so this
      // matches with the surrounding text that pins which field it is, and
      // asserts the shared spelling is absent - telling the two apart being
      // the one thing this field exists to do.
      expect( message ).toContain( 'buffer ArrayBuffer byteLength' )
      expect( message ).not.toContain( 'SharedArrayBuffer' )

      // Resizable, not growable, is the flag a plain ArrayBuffer carries.
      expect( message ).toContain( 'extensible false' )
    }
  } )

  // Here the allocation SUCCEEDED and only the view was refused, so this owns
  // a pointer no caller can reach - and it is #485's own branch, under a
  // per-record catch, so leaking would mean leaking once per record while
  // reporting that the heap is in trouble.
  test( 'frees the allocation it is refusing to view', () => {

    const past = HEAP_BYTES - 8
    const freed: number[] = []

    const wasmModule: WasmHeapModule = {
      ...fakeModule( HEAP_BYTES, () => past ),
      _free: ( pointer: number ) => {
        freed.push( pointer )
      },
    }

    expect( () => arrayToWasmHeap( wasmModule, PAYLOAD ) )
      .toThrow( /outside the heap/ )

    expect( freed ).toEqual( [ past ] )
  } )
} )


describe( 'wasmHeapView', () => {

  test( 'views the live heap at the pointer', () => {

    const address = 64
    const count = 3
    const wasmModule = fakeModule( HEAP_BYTES, () => address )

    const view = wasmHeapView( wasmModule, Float64Array, address, count )

    view.set( PAYLOAD )

    expect( Array.from(
      new Float64Array( wasmModule.HEAPU8.buffer, address, count ) ) )
      .toEqual( Array.from( PAYLOAD ) )
  } )

  // The reason views are CONSTRUCTED here rather than subarray'd off the
  // module's view: subarray clamps an out-of-range window down to whatever
  // fits and returns it, so a caller writing through it lands somewhere other
  // than its allocation and no one hears about it. This asserts the difference
  // rather than the mechanism - the clamped subarray is shown to be wrong, and
  // the helper is shown not to produce it.
  test( 'refuses a window subarray would have silently shortened', () => {

    const count = 4
    const address = STALE_HEAP_BYTES - count

    const fake = growingFakeModule(
      STALE_HEAP_BYTES, STALE_HEAP_BYTES, address, 'none' )

    expect( fake.wasmModule.HEAPU8
      .subarray( address, address + count * Float64Array.BYTES_PER_ELEMENT )
      .length ).toBeLessThan( count * Float64Array.BYTES_PER_ELEMENT )

    expect( () => wasmHeapView( fake.wasmModule, Float64Array, address, count ) )
      .toThrow( /outside the heap/ )
  } )

  test( 'refreshes a stale view before building over it', () => {

    const address = GROWN_ADDRESS
    const count = 3
    const fake = growingFakeModule(
      STALE_HEAP_BYTES, GROWN_HEAP_BYTES, address )

    const view = wasmHeapView( fake.wasmModule, Float64Array, address, count )

    expect( view.buffer ).toBe( fake.grownBuffer )
    expect( view.byteOffset ).toBe( address )
    expect( view.length ).toBe( count )
  } )

  // A >2GB heap is reachable - every target builds with 4GB of maximum memory
  // - and a pointer from a raw i32 export arrives negative up there. What
  // matters is not that `>>> 0` works, it is that the view this helper hands
  // back is positioned at the UNSIGNED address; a signed one would put it
  // before the start of the heap. Asserted through a recording element type,
  // because a real 2GB buffer cannot be allocated in a unit test.
  test( 'positions the view at the unsigned address for a >2GB pointer', () => {

    const signedAddress = -2147483648
    const unsignedAddress = 2147483648
    const headroom = 4096
    const count = 2

    /** Stands in for a typed array, recording how it was constructed. */
    class RecordingArray {
      public static readonly BYTES_PER_ELEMENT = 8

      /**
       * @param buffer The buffer the helper chose.
       * @param byteOffset The address the helper passed.
       * @param length The element count the helper passed.
       */
      public constructor(
        public readonly buffer: ArrayBufferLike,
        public readonly byteOffset: number,
        public readonly length: number ) {
      }
    }

    const wasmModule: WasmHeapModule = {
      _malloc: () => signedAddress,
      _free: () => { /* unused here */ },
      HEAPU8: { length: 0, buffer: { byteLength: unsignedAddress + headroom } } as
        unknown as Uint8Array,
    }

    const view = wasmHeapView(
      wasmModule,
      RecordingArray as WasmHeapArrayConstructor< RecordingArray >,
      signedAddress,
      count )

    expect( view.byteOffset ).toBe( unsignedAddress )
    expect( view.length ).toBe( count )
  } )

  // Left signed, the bounds test passes for free: a negative address plus a
  // length is never greater than a byteLength. So this is the case where
  // normalising is what makes the check able to reject anything at all.
  test( 'a >2GB pointer past the end of the heap is still caught', () => {

    const signedAddress = -2147483648
    const wasmModule: WasmHeapModule = {
      _malloc: () => signedAddress,
      _free: () => { /* unused here */ },
      HEAPU8: new Uint8Array( new ArrayBuffer( HEAP_BYTES ) ),
    }

    expect( () => wasmHeapView( wasmModule, Float64Array, signedAddress, 1 ) )
      .toThrow( /outside the heap/ )
  } )
} )


describe( 'wasmHeapByteLength', () => {

  // HEAPU8.length is what this used to read, and it is a growth step short
  // whenever the module's views are behind - so a high-water figure taken from
  // it under-reports exactly when the number is interesting.
  test( 'reports the heap that exists, not the view that is cached', () => {

    const grownBytes = GROWN_HEAP_BYTES
    const fake = growingFakeModule(
      STALE_HEAP_BYTES, grownBytes, GROWN_ADDRESS )

    // Nothing has touched the heap yet, so the module's view is still the
    // pre-growth one - which is exactly the state this must not report from.
    expect( fake.wasmModule.HEAPU8.length ).toBe( STALE_HEAP_BYTES )

    expect( wasmHeapByteLength( fake.wasmModule ) ).toBe( grownBytes )
    expect( fake.refreshes() ).toBe( 1 )
  } )

  // No route to refresh through means the cached view is all there is. Better
  // a lagging number than a thrown one from a line that only exists to log.
  test( 'falls back to the cached view when there is no refresh route', () => {

    const fake = growingFakeModule(
      STALE_HEAP_BYTES, GROWN_HEAP_BYTES, GROWN_ADDRESS, 'none' )

    expect( wasmHeapByteLength( fake.wasmModule ) ).toBe( STALE_HEAP_BYTES )
  } )

  // Same reasoning as the no-route case above, but for a route that is present
  // and fails. This one's only consumer is the AP214 CLI's high-water log
  // line, so letting an embind failure out would abort an otherwise complete
  // extraction from a log statement.
  test( 'falls back to the cached view when the refresh route throws', () => {

    const fake = growingFakeModule(
      STALE_HEAP_BYTES, GROWN_HEAP_BYTES, GROWN_ADDRESS, 'embind',
      { push: true } )

    expect( wasmHeapByteLength( fake.wasmModule ) ).toBe( STALE_HEAP_BYTES )
  } )

  test( 'reads wasmMemory live when the build exposes it', () => {

    const grownBytes = 4096

    const wasmModule: WasmHeapModule = {
      _malloc: () => 0,
      _free: () => { /* unused here */ },
      HEAPU8: new Uint8Array( new ArrayBuffer( HEAP_BYTES ) ),
      wasmMemory: { buffer: new ArrayBuffer( grownBytes ) },
    }

    expect( wasmHeapByteLength( wasmModule ) ).toBe( grownBytes )
  } )
} )


describe( 'arraysToWasmHeap', () => {

  test( 'returns pointers in the order the arrays were given', () => {

    const first = 16
    const stride = 64
    let next = first

    const wasmModule = fakeModule( HEAP_BYTES, () => {
      const address = next

      next += stride

      return address
    } )

    expect( arraysToWasmHeap( wasmModule, [ PAYLOAD, TAIL ] ) )
      .toEqual( [ first, first + stride ] )
  } )

  // The point of the batch form: a caller holding several allocations frees
  // them together at the end, so a throw part-way through would strand the
  // ones already taken and the retry upstream would do it again.
  test( 'frees what it already took when a later allocation fails', () => {

    const first = 16
    const freed: number[] = []
    let call = 0

    const wasmModule: WasmHeapModule = {
      ...fakeModule( HEAP_BYTES, () => ( call++ === 0 ? first : 0 ) ),
      _free: ( pointer: number ) => {
        freed.push( pointer )
      },
    }

    expect( () => arraysToWasmHeap( wasmModule, [ PAYLOAD, TAIL ] ) )
      .toThrow( /_malloc returned an unusable address/ )

    expect( freed ).toEqual( [ first ] )
  } )
} )


describe( 'releaseQuietly', () => {

  test( 'runs the release', () => {

    let ran = false

    releaseQuietly( () => {
      ran = true
    } )

    expect( ran ).toBe( true )
  } )

  // The point: these run from finally blocks that may be unwinding because the
  // wasm runtime just failed, and every release re-enters that same runtime.
  // A throw here would replace the in-flight error, and the per-record catch
  // upstream would log a generic teardown failure instead of the heap
  // diagnostic this module exists to produce.
  test( 'does not let a failed release replace the error being unwound', () => {

    const original = new Error( 'the diagnostic worth keeping' )

    expect( () => {
      try {
        throw original
      } finally {
        releaseQuietly( () => {
          throw new Error( 'teardown blew up too' )
        } )
      }
    } ).toThrow( original )
  } )
} )


describe( 'withRelease', () => {

  test( 'releases after the body and returns its value', () => {

    const order: string[] = []

    const result = withRelease(
      () => {
        order.push( 'body' )

        return 'value'
      },
      () => {
        order.push( 'release' )
      } )

    expect( result ).toBe( 'value' )
    expect( order ).toEqual( [ 'body', 'release' ] )
  } )

  // The asymmetry this exists for. On the success path a teardown failure is a
  // real fault with nothing competing to report it, and swallowing it would let
  // a record be reported COMPLETE with its resources never reclaimed.
  test( 'propagates a release failure when the body succeeded', () => {

    expect( () => withRelease( () => 'fine', () => {
      throw new Error( 'release failed' )
    } ) ).toThrow( /release failed/ )
  } )

  test( 'keeps the body\'s error when the release fails too', () => {

    const original = new Error( 'the diagnostic worth keeping' )

    expect( () => withRelease(
      () => {
        throw original
      },
      () => {
        throw new Error( 'teardown blew up too' )
      } ) ).toThrow( original )
  } )

  test( 'still releases when the body throws', () => {

    let released = false

    expect( () => withRelease(
      () => {
        throw new Error( 'body failed' )
      },
      () => {
        released = true
      } ) ).toThrow( /body failed/ )

    expect( released ).toBe( true )
  } )
} )


describe( 'freeAll', () => {

  // Batched into one statement, the first failure abandons every pointer after
  // it - which is the whole reason this is not just four _free calls.
  test( 'frees every pointer even when one throws, and reports the first', () => {

    const freed: number[] = []
    const bad = 2

    const wasmModule: WasmHeapModule = {
      ...fakeModule( HEAP_BYTES, () => 0 ),
      _free: ( pointer: number ) => {
        if ( pointer === bad ) {
          throw new Error( 'free failed' )
        }

        freed.push( pointer )
      },
    }

    expect( () => freeAll( wasmModule, [ 1, bad, 3 ] ) ).toThrow( /free failed/ )

    expect( freed ).toEqual( [ 1, 3 ] )
  } )
} )
