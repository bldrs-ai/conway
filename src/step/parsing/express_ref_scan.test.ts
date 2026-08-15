/* eslint-disable no-magic-numbers */
import { describe, expect, test } from '@jest/globals'

import { scanExpressRefs } from './express_ref_scan'


/**
 * @param text STEP text to scan.
 * @return {number[]} Referenced express IDs.
 */
function scan( text: string ): number[] {
  return scanExpressRefs( new TextEncoder().encode( text ) )
}


describe( 'scanExpressRefs', () => {

  test( 'collects distinct #ids in first-seen order', () => {
    expect( scan( '#10=IFCWALL(#20,#20,#30);' ) ).toEqual( [10, 20, 30] )
  } )

  test( 'ignores hashes inside STEP strings and doubled quotes', () => {
    expect( scan( "#1=IFCLABEL('door #99 is fine');#2=IFCNAME('it''s #8');" ) )
        .toEqual( [1, 2] )
  } )

  test( 'ignores hashes inside binary blobs', () => {
    expect( scan( '#1=IFCBLOB("#99DEAD");' ) ).toEqual( [1] )
  } )

  test( 'ignores hashes inside comments', () => {
    expect( scan( '#1=IFCWALL(/* see #99 */#2);' ) ).toEqual( [1, 2] )
  } )

  test( 'skips #0', () => {
    expect( scan( '#1=IFCWALL(#0,#2);' ) ).toEqual( [1, 2] )
  } )
} )
