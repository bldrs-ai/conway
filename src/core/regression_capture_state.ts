 
export enum MemoizationCapture {

   
  OPTIMAL  = 0, // Only capture optimal states
   
  FULL     = 1, // Capture temporaries, booleans etc
}

/**
 * Static class of the regression capture states.
 */
export abstract class RegressionCaptureState {

  public static memoization: MemoizationCapture = MemoizationCapture.OPTIMAL

}
