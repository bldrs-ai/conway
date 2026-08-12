import yargs from 'yargs/yargs'
import fs from 'fs'
import fsPromises from 'fs/promises'
import childProcess, { ExecException } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import crypto from 'crypto'
import os from 'os'
import pLimit from 'p-limit'


const errorCSVHeader = 'message,count,expressids,file'
const exec = promisify( childProcess.exec )

 
/**
 * Safe execute a process command with cancellation support.
 *
 * @param command The command to run.
 * @param timeoutMs Number of milliseconds to wait before timing out.
 * @return {Promise<RunErrorResults | { type: 'Success', stdout: string, stderr: string }>}
 */
async function safeExecWithCancellation(
    command: string,
    timeoutMs: number,
): Promise<
  | RunErrorResults
  | { type: 'Success'; stdout: string; stderr: string }
> {
  return new Promise((resolve) => {
    // Start the child process using childProcess.exec
    const child = childProcess.exec(
        command,
        { maxBuffer: STD_OUT_ERR_MAX_BUFFER },
        (err, stdout, stderr) => {
        // If the process finishes before the timeout, clear the timer...
          clearTimeout(timeoutHandle)
          if (err) {
            const errResult = err as ExecException
            resolve({
              type: 'Failed',
              name: errResult.name,
              message: errResult.message,
              code: errResult.code,
              cmd: errResult.cmd,
              signal: errResult.signal,
              killed: errResult.killed,
            })
          } else {
            resolve({
              type: 'Success',
              stdout,
              stderr,
            })
          }
        },
    )

    // Set up the timeout promise.
    const timeoutHandle = setTimeout(() => {
      // Timeout occurred: SIGKILL (not the default SIGTERM) so a child stuck
      // in a wasm compute loop is force-killed. A model exceeding the timeout
      // is not expected once batch concurrency is bounded — this is a safety
      // net. The explicit process.exit at the end of the run guarantees the
      // batch still terminates promptly even if a killed child leaves a
      // grandchild behind holding an open pipe.
      try {
        child.kill('SIGKILL')
      } catch {
        // Already gone.
      }
      resolve({
        type: 'Failed',
        name: 'TimeoutError',
        message: 'Execution timed out',
        cmd: command,
        killed: true,
      })
    }, timeoutMs)

    // When the child exits naturally, clear the timeout.
    child.on('exit', () => {
      clearTimeout(timeoutHandle)
    })
  })
}
 

const SKIP_PARAMS = 2

// eslint-disable-next-line no-magic-numbers
const STD_OUT_ERR_MAX_BUFFER = 64 * 1024 * 1024

interface RunSuccessResults {

  type: 'Run'

  errorLines?: string[]

  outputFile: string

  hash?: string

  /**
   * True when the model loaded but its digest carries no geometry rows at all.
   *
   * This is a distinct outcome from both success and failure: the child exits
   * 0, writes no failed.csv row, and may emit no errors, so nothing else in
   * the harness can see it. See bldrs-ai/conway#477 and #478.
   */
  producedNoGeometry?: boolean

}

interface RunErrorResults extends ExecException {

  type: 'Failed'
}

type RunResults = RunSuccessResults | RunErrorResults

/**
 * Encapsulates a string in a CSV safe way.
 *
 * @param from
 * @return {string}
 */
function csvSafeString( from: string ): string {

  if ( from.includes( '\n' ) ||
    from.includes( '\r') ||
    from.includes( '"') ||
    from.includes( ',' ) ) {

    return `"${from.replaceAll( '"', '""' )}"`
  }

  return from
}

/**
 * Read back the first field of a line written with csvSafeString.
 *
 * Naive `line.split(',')[0]` is wrong for exactly the inputs csvSafeString
 * exists for: a model filename containing a comma comes back quoted, and
 * splitting on ',' truncates it mid-name. The zero-geometry collision check
 * keys on this field, so a truncated name silently changes which stems it
 * thinks collide.
 *
 * @param line A CSV line whose first field was written by csvSafeString.
 * @return {string} The unescaped first field.
 */
function csvFirstField( line: string ): string {

  const trimmed = line.replace( /[\r\n]+$/, '' )

  if ( !trimmed.startsWith( '"' ) ) {

    return trimmed.split( ',' )[ 0 ]
  }

  let result = ''

  for ( let cursor = 1; cursor < trimmed.length; ++cursor ) {

    if ( trimmed[ cursor ] !== '"' ) {

      result += trimmed[ cursor ]
      continue
    }

    // A doubled quote is a literal one; a lone quote closes the field.
    if ( trimmed[ cursor + 1 ] === '"' ) {

      result += '"'
      ++cursor
      continue
    }

    break
  }

  return result
}

/**
 * Encapsulates a string in a CSV safe way, taking
 * file paths (assumed by directory characters / and \,
 * ) and shortening them to file names without ".csv".
 *
 * @param from
 * @return {string}
 */
function csvSafeStringFileNames( from: string ): string {

  if ( from.includes( '\\' ) || from.includes( '/' ) ) {
    from = path.basename( from, '.csv' )
  }

  if ( from.includes( '\n' ) ||
    from.includes( '\r') ||
    from.includes( '"') ||
    from.includes( ',' ) ) {

    return `"${from.replaceAll( '"', '""' )}"`
  }

  return from
}


/**
 * Run the git diff
 *
 * @param ifcFolder    The folder we want to `cd` into before running git
 * @param outputFolder The folder containing outputs that we compare
 * @param target       The Git diff target (branch, commit, etc.)
 * @param diffOutputPath Where we store the CSV diff results (no extension)
 * @param isDryRun     If true, reverts changes via git checkout after diff
 */
async function runDiff(
    ifcFolder: string,
    outputFolder: string,
    target: string,
    diffOutputPath: string,
    isDryRun: boolean,
): Promise<void> {

  const diffOutputFolder = path.dirname(path.resolve(diffOutputPath))
  await fsPromises.mkdir(diffOutputFolder, { recursive: true })

  console.log(`ifcFolder: ${ifcFolder}`)

  // 1) Change `cwd` to `ifcFolder`, so we "cd ifcFolder" before running git
  const processResult = await exec(
      `git diff -r --numstat --minimal ${target} -- ${outputFolder}`,
      {
        maxBuffer: STD_OUT_ERR_MAX_BUFFER,
        cwd: ifcFolder, // <-- This causes the exec to run in ifcFolder
      },
  )

  const csvDiff = `Added,Removed,File\n${processResult.stdout
      .split('\n')
      .map((line) => line.split('\t').map(csvSafeStringFileNames).join(','))
      .join('\n')}`

  await fsPromises.writeFile(`${diffOutputPath}.csv`, csvDiff)

  if (isDryRun) {
    // 2) Also run the checkout in the same `cwd` context
    await exec(`git checkout -- "${outputFolder}"`, { cwd: ifcFolder })
  }
}

/**
 * Aggregate all per-file `*.perf.csv` rows in perfDir into a single CSV at
 * outputCsvPath, sorted by file name. Files are written by individual child
 * regression runs (one row + one header per file); we keep the header from
 * the first file we read and concatenate the data rows from the rest. The
 * input directory is removed afterwards.
 *
 * @param perfDir Directory the children wrote their per-file perf CSVs to.
 * @param outputCsvPath Aggregate perf CSV destination.
 */
async function aggregatePerfCsvs(
    perfDir: string,
    outputCsvPath: string,
): Promise<void> {

  const entries = await fsPromises.readdir( perfDir, { withFileTypes: true } )
  const perfFiles = entries
      .filter( ( d ) => d.isFile() && d.name.endsWith( '.perf.csv' ) )
      .map( ( d ) => path.join( perfDir, d.name ) )

  if ( perfFiles.length === 0 ) {
    console.warn( `No per-file perf CSVs found in ${perfDir}; skipping aggregate.` )
    return
  }

  type PerfRow = { file: string; line: string }
  const rows: PerfRow[] = []
  let header: string | undefined

  for ( const perfFile of perfFiles ) {

    const contents = await fsPromises.readFile( perfFile, 'utf8' )
    const lines = contents.split( /\r?\n/ ).filter( ( l ) => l.length > 0 )

    if ( lines.length < 2 ) {
      continue
    }

    if ( header === undefined ) {
      header = lines[ 0 ]
    }

    // Each per-file CSV has exactly one data row (lines[1]); the first column
    // is the file name which we use for stable sorting.
    const dataLine = lines[ 1 ]
    const firstComma = dataLine.indexOf( ',' )
    const fileKey = firstComma >= 0 ? dataLine.slice( 0, firstComma ) : dataLine
    rows.push( { file: fileKey, line: dataLine } )
  }

  rows.sort( ( a, b ) => a.file.localeCompare( b.file ) )

  // Defensive: if every child wrote a malformed CSV (lines.length < 2 for all),
  // header stays undefined and rows stays empty. Bail rather than write the
  // literal "undefined" as a CSV header.
  if ( rows.length === 0 || header === undefined ) {
    console.warn(
        `No usable perf rows in ${perfDir} (${perfFiles.length} file(s) checked); ` +
        `skipping aggregate write.`,
    )
    return
  }

  const body = rows.map( ( r ) => r.line ).join( '\n' )
  await fsPromises.writeFile( outputCsvPath, `${header}\n${body}\n` )

  console.log( `Wrote aggregate perf CSV: ${outputCsvPath} (${rows.length} rows)` )
}

let totalTime = 0 // To keep track of the running total time

/**
 * Run a regression test digest for a file.
 *
 * @param filePath
 * @param outputPath
 * @param maxTimeout
 * @param perfPath Optional path the child should write a one-row perf CSV to.
 */
async function runForFile(filePath: string,
    outputPath: string, maxTimeout:number, perfPath?: string): Promise<RunResults> {
  const MAX_TIMEOUT_MS = maxTimeout
  const startTime = Date.now() // Start time

  const perfFlag = perfPath ? ` --perf "${perfPath}"` : ''

  // STEP (AP214) models are digested by the AP214 pipeline, IFC models by
  // the IFC pipeline; both children emit the same digest/error/perf formats.
  const childScript = isStepFile(filePath) ?
    './compiled/src/AP214E3_2010/ap214_regression_main.js' :
    './compiled/src/ifc/ifc_regression_main.js'

  const safeExecCommand = `node --experimental-specifier-resolution=node ${childScript} -d${perfFlag} "${filePath}" "${outputPath}"`

  console.log(`Current File: ${filePath}`)

  // Remove any stale digest before the child runs. Without this, a child that
  // dies without writing one leaves the committed baseline CSV in place, the
  // batch hashes THAT, and the model reports an unchanged hash with no failure
  // and no zero-geometry row - green, while extraction is completely broken.
  // That is precisely the case this gate exists to catch.
  const staleDigest = `${outputPath}.csv`

  if (fs.existsSync(staleDigest)) {
    await fsPromises.rm(staleDigest, { force: true })
  }

  // Use safeExecWithCancellation, will kill the process if it takes longer than MAX_TIMEOUT_MS.
  const process = await safeExecWithCancellation(safeExecCommand, MAX_TIMEOUT_MS)

  totalTime += Date.now() - startTime
  console.log(`totalTime: ${totalTime}`)

  if (process.type === 'Failed') {
    if (process.message && process.message === 'Execution timed out') {
      console.log('Timed out.')
    }
    return process
  }

  const stdErr = process.stderr.replaceAll('\r', '')
  let errorLines = stdErr.split('\n').filter((line) => line.length > 0)
  errorLines = errorLines.map((line) => `${line}\n`)

  const indexOfHeader = errorLines.findIndex((line) => line.startsWith(errorCSVHeader))
  if (indexOfHeader >= 0) {
    errorLines.splice(0, indexOfHeader + 1)
  } else {
    errorLines.length = 0
  }

  const outputFile = path.basename(outputPath)

  let fileHash: string | undefined
  // Absent digest counts as zero geometry: the stale file was removed before
  // the child ran, so nothing here can be left over from the committed
  // baseline. A child that dies without writing one is exactly the case this
  // gate exists to catch, and hashing the old file would report it as green.
  let producedNoGeometry = true
  const outputCSV = `${outputPath}.csv`
  if (fs.existsSync(outputCSV)) {
    const digest = await fsPromises.readFile(outputCSV)

    fileHash = crypto
        .createHash('sha1')
        .update(digest)
        .digest('hex')

    // A digest with nothing after its header means the model loaded and
    // produced no geometry at all. The child still exits 0, so this is
    // invisible to every other signal the harness has — see #477 / #478.
    //
    // Known limitation: a digest row is any hashed entity, and that includes
    // non-renderable ones (IFCSURFACESTYLE, IFCPOLYLINE, IFCCENTERLINEPROFILEDEF
    // …), so "has rows" is weaker than "has renderable geometry". A model that
    // emits only styles and profiles reads as fine here. That is a deliberate
    // floor, not an oversight: this catches the total-blank case with zero
    // false positives, which is what an unconditional CI gate needs. Tightening
    // it to a mesh/vertex count means teaching the digest which types are
    // renderable and re-blessing every baseline; tracked on #478.
    producedNoGeometry =
      digest.toString('utf8').split('\n').filter((line) => line.trim().length > 0).length <= 1
  }

  return {
    type: 'Run',
    errorLines: errorLines.length > 0 ? errorLines : undefined,
    outputFile,
    hash: fileHash,
    producedNoGeometry,
  }
}


// Model files the regression harness understands: IFC plus STEP AP214.
const SUPPORTED_MODEL_EXTENSIONS = ['.ifc', '.stp', '.step']

/**
 * Whether this is a STEP (AP214) model file by extension.
 *
 * @param filePath
 * @return {boolean}
 */
function isStepFile( filePath: string ): boolean {

  const extension = path.extname( filePath ).toLowerCase()

  return extension === '.stp' || extension === '.step'
}

/**
 * Whether this file is a supported model type (IFC or STEP), by extension.
 *
 * @param filePath
 * @return {boolean}
 */
function isSupportedModelFile( filePath: string ): boolean {

  return SUPPORTED_MODEL_EXTENSIONS.includes( path.extname( filePath ).toLowerCase() )
}

/**
 * Recursively collect all IFC file paths (instead of processing them immediately).
 *
 * @param parentPath
 * @param excludeRegex
 */
async function collectIFCFiles(
    parentPath: string,
    excludeRegex?: RegExp,
): Promise<string[]> {
  const ifcFiles: string[] = []

  /**
   * Recursively walk ifc files
   *
   * @param currentPath
   */
   
  /**
   *
   * @param currentPath
   */
  async function recursiveWalk(currentPath: string) {
    const items = await fsPromises.readdir(currentPath, { withFileTypes: true })
    items.sort((a, b) => (a.name > b.name ? 1 : -1))

    for (const item of items) {
      const resolved = path.join(currentPath, item.name)

      if (excludeRegex && excludeRegex.test(resolved)) {
        continue
      }

      if (item.isDirectory()) {
        await recursiveWalk(resolved)
      } else if (isSupportedModelFile(resolved)) {
        ifcFiles.push(resolved)
      }
    }
  }

  await recursiveWalk(parentPath)
  return ifcFiles
}

/**
 * @return {number} percentage of memory used on machine
 */
function getSystemMemoryUsagePercent(): number {
  const total = os.totalmem()  // total system memory in bytes
  const free = os.freemem()    // free system memory in bytes
  const used = total - free
  /* eslint-disable no-magic-numbers */
  console.log(`total: ${total / 1000 / 1000 / 1000} GB - ` +
    `used: ${used / 1000 / 1000 / 1000} GB - ` +
    `free: ${free / 1000 / 1000 / 1000} GB`)
  return (used / total) * 100
  /* eslint-enable no-magic-numbers */
}

/**
 * Parallel processing, using p-limit to limit concurrency to number of CPU cores.
 *
 * @param ifcFiles
 * @param outputPath
 * @param errorLines
 * @param fileLines
 * @param failedLines
 * @param zeroGeometryLines
 * @param memUtilization
 * @param maxTimeout
 * @param concurrency Max children processed at once (>= 1).
 * @param perfDir If set, the child writes its perf CSV here as <basename>.perf.csv.
 */
async function processIFCFilesInParallel(
    ifcFiles: string[],
    outputPath: string,
    errorLines: string[],
    fileLines: string[],
    failedLines: string[],
    zeroGeometryLines: string[],
    memUtilization: number,
    maxTimeout:number,
    concurrency: number,
    perfDir?: string,
): Promise<void> {
  const concurrencyLimit = Math.max(1, concurrency)
  console.log(`Concurrency: ${concurrencyLimit} children - Max Timeout: ${maxTimeout} ms`)

  const limit = pLimit(concurrencyLimit)
  const taskTimeout = 2000
  let activeTasks = 0

  // Create an array of task promises using map (without awaiting immediately)
  const tasks = ifcFiles.map((ifcPath) =>
    limit(async () => {
      // Wait if system memory usage is above 95%
      while (getSystemMemoryUsagePercent() > memUtilization) {
        console.log(`Memory usage > ${memUtilization}%, waiting 2s...`)
        await new Promise((resolve) => setTimeout(resolve, taskTimeout))
      }

      activeTasks++
      console.log(
          `Starting task for "${path.basename(ifcPath)}". Active tasks: ${activeTasks}`,
      )
      const perfChildPath = perfDir ?
        path.join(perfDir, `${path.parse(ifcPath).name}.perf.csv`) :
        undefined
      const fileResults = await runForFile(
          ifcPath,
          path.join(outputPath, path.parse(ifcPath).name),
          maxTimeout,
          perfChildPath,
      )

      activeTasks--
      console.log(
          `Completed task for "${path.basename(ifcPath)}". Active tasks: ${activeTasks}`,
      )
      return { ifcPath, fileResults }
    }),
  )

  // Wait for all tasks to complete in parallel
  const results: { ifcPath: string; fileResults: RunResults }[] = await Promise.all(tasks)

  // Aggregate results
  for (const { ifcPath, fileResults } of results) {
    if (fileResults.type === 'Run') {
      if (fileResults.errorLines) {
        errorLines.push(...fileResults.errorLines)
      }
      fileLines.push(
          `${csvSafeString(path.basename(ifcPath))},` +
          `${csvSafeString(fileResults.hash ?? '')},` +
          `${fileResults.errorLines?.length ?? 0}\n`,
      )

      if (fileResults.producedNoGeometry) {
        zeroGeometryLines.push(`${csvSafeString(path.basename(ifcPath))}\n`)
      }
    } else {
      // it's 'Failed'
      failedLines.push(
          `${csvSafeString(path.basename(ifcPath))},` +
          `${csvSafeString(fileResults.code?.toString() ?? '')},` +
          `${csvSafeString(fileResults.signal ?? '')}\n`,
      )
    }
  }
}


// The original recursive approach (unchanged, except it won't be used if -parallel is set)
/**
 *
 * @param parentPath
 * @param excludeRegex
 * @param outputPath
 * @param errorLines
 * @param fileLines
 * @param failedLines
 * @param zeroGeometryLines
 * @param maxTimeout
 * @param perfDir If set, the child writes its perf CSV here as <basename>.perf.csv.
 */
async function recursiveWalk(
    parentPath: string,
    excludeRegex: RegExp | undefined,
    outputPath: string,
    errorLines: string[],
    fileLines: string[],
    failedLines: string[],
    zeroGeometryLines: string[],
    maxTimeout: number,
    perfDir?: string,
) {
  const items = await fsPromises.readdir(parentPath, { withFileTypes: true })
  items.sort((a, b) => (a.name > b.name ? 1 : -1))

  for (const item of items) {
    const resolved = path.join(parentPath, item.name)

    if (excludeRegex && excludeRegex.test(resolved)) {
      continue
    }

    if (item.isDirectory()) {
      await recursiveWalk(resolved, excludeRegex, outputPath,
          errorLines, fileLines, failedLines, zeroGeometryLines, maxTimeout, perfDir)
    } else if (isSupportedModelFile(resolved)) {
      const perfChildPath = perfDir ?
        path.join(perfDir, `${path.parse(resolved).name}.perf.csv`) :
        undefined
      const fileResults = await runForFile(
          resolved,
          path.join(outputPath, path.parse(resolved).name),
          maxTimeout,
          perfChildPath,
      )

      if (fileResults.type === 'Run') {
        if (fileResults.errorLines !== void 0) {
          errorLines.push(...fileResults.errorLines)
        }

        fileLines.push(
            `${csvSafeString(path.basename(resolved))},${csvSafeString(
                fileResults.hash ?? '',
            )},${fileResults.errorLines?.length ?? 0}\n`,
        )

        if (fileResults.producedNoGeometry) {
          zeroGeometryLines.push(`${csvSafeString(path.basename(resolved))}\n`)
        }
      } else {
        failedLines.push(
            `${csvSafeString(path.basename(resolved))},${csvSafeString(
                fileResults.code?.toString() ?? '',
            )},${csvSafeString(fileResults.signal ?? '')}\n`,
        )
      }
    }
  }
}

 
const args = yargs(process.argv.slice(SKIP_PARAMS))
    .command(
        '$0 <model_folder> <output_folder>',
        'Regression test',
        (yargs2) => {
          yargs2.option('target', {
            describe: 'Git diff target',
            type: 'string',
            alias: 't',
            default: '',
          })
          yargs2.option('dryrun', {
            describe: 'Roll back the changes to the output folder using git',
            type: 'boolean',
            alias: 'd',
            default: false,
          })
          yargs2.option('changes', {
            describe:
             
          'Custom output location for the diff output (filepath, should include file name but not extension, the folder will be created if it doesn\'t exist)',
            type: 'string',
            alias: 'c',
            default: '',
          })
          yargs2.option('exclude', {
            describe: 'A file-path exclusion regex filter (javascript syntax)',
            type: 'string',
            alias: 'e',
            default: '',
          })

          yargs2.option('parallel', {
            describe: 'Process IFC files in parallel (limited by CPU cores)',
            type: 'boolean',
            alias: 'p',
            default: false,
          })
          // only relevant if parallel is enabled
          yargs2.option('mem-utilization', {

            describe: 'Memory utilization threshold percentage for parallel processing (1-100, default: 95)',
            type: 'number',
            alias: 'm',
            default: 95,
          })
          // only relevant if parallel is enabled
          yargs2.option('concurrency', {
            describe:
              'Max IFC files processed at once in parallel mode. Each child ' +
              'is itself multi-threaded, so os.cpus() children heavily ' +
              'oversubscribe the cores: the largest models\' wall-clock then ' +
              'balloons (spurious timeouts) and per-model perf numbers become ' +
              'noise. Lower this for steady timings. Default: CPU core count.',
            type: 'number',
            alias: 'j',
            default: 0,
          })
          // Validate mem-utilization only if parallel mode is active
          yargs2.check((argv) => {
            if (argv.parallel) {
              const memUtil = argv['mem-utilization']
              // eslint-disable-next-line no-magic-numbers
              if (typeof memUtil !== 'number' || memUtil < 1 || memUtil > 100) {
                throw new Error('mem-utilization must be a number between 1 and 100')
              }
            }
            return true
          })

          yargs2.option('timeout', {

            describe: 'IFC per-file loading timeout in ms (default: 150000)',
            type: 'number',
            alias: 'timeout',
            default: 150000,
          })

          yargs2.option('perf', {

            describe:
              'Output path for aggregate perf CSV. Each child writes a one-row ' +
              '<basename>.perf.csv to a temp dir; on completion they are merged ' +
              'into this file, sorted by file name. Disabled when unset.',
            type: 'string',
            default: '',
          })

          yargs2.positional('model_folder', {
            describe: 'Folder containing IFC files, recursively walked',
            type: 'string',
          })
          yargs2.positional('output_folder', {
            describe:
          'Folder for manifests/output artifacts (diff CSV goes here unless overridden)',
            type: 'string',
          })
        },
        async (argv) => {
          // ---- New: record overall start time
          const overallStart = Date.now()
          const ifcFolder = argv['model_folder'] as string
          const outputPath = argv['output_folder'] as string
          let changes = (argv['changes'] as string) ?? ''
          const target = (argv['target'] as string) ?? ''
          const dryRun = (argv['dryrun'] as boolean) ?? false
          const excludeFilter = (argv['exclude'] as string) ?? ''
          const doParallel = (argv['parallel'] as boolean) ?? false // <--- read the parallel flag
          const memUtilization = (argv['mem-utilization'] as number)
          const maxTimeout = (argv['timeout'] as number)
          // 0 (the default) means "auto": one child per core.
          const concurrencyArg = (argv['concurrency'] as number)
          const concurrency =
            concurrencyArg && concurrencyArg > 0 ? Math.floor(concurrencyArg) : os.cpus().length
          const perfOutputPath = ((argv['perf'] as string) ?? '').trim()

          if (changes.length === 0) {
            changes = path.join(outputPath, 'changes')
          }

          await fsPromises.mkdir(outputPath, { recursive: true })

          // When perf is requested, children write their one-row CSVs into a
          // throwaway temp dir; we aggregate and clean up afterwards. Keeping
          // them out of outputPath avoids the runDiff step picking up
          // machine-specific timings as "changes" against the test-models
          // checked-in baselines.
          let perfTmpDir: string | undefined
          if (perfOutputPath.length > 0) {
            perfTmpDir = await fsPromises.mkdtemp(
                path.join(os.tmpdir(), 'conway-perf-'),
            )
          }

          const mainPath = path.join(outputPath, 'main.csv')
          const errorPath = path.join(outputPath, 'errors.csv')
          const failedPath = path.join(outputPath, 'failed.csv')
          const zeroGeometryPath = path.join(outputPath, 'zero_geometry.csv')

          const errorLines: string[] = []
          const fileLines: string[] = []
          const failedLines: string[] = []
          const zeroGeometryLines: string[] = []

          const excludeRegex: RegExp | undefined =
        excludeFilter.length > 0 ? new RegExp(excludeFilter) : undefined

          if (doParallel) {
            console.log('Processing in parallel mode...')
            // 1) Collect all IFC files first
            const allIFCFiles = await collectIFCFiles(ifcFolder, excludeRegex)
            // 2) Process them in parallel
            await processIFCFilesInParallel(
                allIFCFiles,
                outputPath,
                errorLines,
                fileLines,
                failedLines,
                zeroGeometryLines,
                memUtilization,
                maxTimeout,
                concurrency,
                perfTmpDir,
            )
          } else {
            console.log('Processing in serial mode...')

            await recursiveWalk(ifcFolder, excludeRegex, outputPath,
                errorLines, fileLines, failedLines, zeroGeometryLines, maxTimeout, perfTmpDir)
          }

          // Write out results
          await fsPromises.writeFile(mainPath, `file,hash,errors\n${  fileLines.join('')}`)
          await fsPromises.writeFile(errorPath, `${errorCSVHeader}\n${  errorLines.join('')}`)
          await fsPromises.writeFile(failedPath, `file,code,signal\n${  failedLines.join('')}`)

          // Models that loaded and produced no geometry. Written as its own
          // artifact rather than folded into failed.csv, because the two need
          // different gates: failed.csv is empty and stays empty, while a
          // handful of zero-geometry models are known and tracked (#477), so
          // CI compares this against an explicit allowlist instead.
          // Models whose digest stem collides cannot be judged: two models
          // sharing a basename write the SAME digest file, so in --parallel one
          // can be read between another's truncate and its first row. That
          // collision is a pre-existing harness bug (it also means the blessed
          // digest is whichever model ran last) - `ifc/index.ifc` and
          // `ifc/bldrs/index.ifc` are a live example, both in the smoke subset.
          // Suppress rather than guess, so it cannot red an unrelated PR, and
          // say so loudly.
          const stemCounts = new Map<string, number>()

          for (const line of fileLines) {
            const stem = path.parse(csvFirstField(line)).name

            stemCounts.set(stem, (stemCounts.get(stem) ?? 0) + 1)
          }

          const collidingStems =
            new Set([...stemCounts].filter(([, count]) => count > 1).map(([stem]) => stem))

          if (collidingStems.size > 0) {
            console.warn(
                `WARNING: ${collidingStems.size} digest stem(s) are written by more ` +
                `than one model, so their digests overwrite each other and their ` +
                `zero-geometry status cannot be determined: ${[...collidingStems].join(', ')}`)
          }

          const reportableZeroGeometry = zeroGeometryLines.filter(
              (line) => !collidingStems.has(path.parse(csvFirstField(line)).name))

          await fsPromises.writeFile(
              zeroGeometryPath, `file\n${  reportableZeroGeometry.join('')}`)

          if (reportableZeroGeometry.length > 0) {
            console.log(
                `\n${reportableZeroGeometry.length} model(s) loaded but produced NO geometry:`)
            for (const line of reportableZeroGeometry) {
              console.log(`  ${line.trim()}`)
            }
            console.log('')
          }

          // Aggregate per-child perf rows (if requested) before runDiff so the
          // run completes deterministically even when the git diff step is
          // skipped or fails.
          if (perfTmpDir) {
            try {
              await aggregatePerfCsvs(perfTmpDir, perfOutputPath)
            } catch (e) {
              console.error('Failed to aggregate perf CSVs:', e)
            } finally {
              await fsPromises.rm(perfTmpDir, { recursive: true, force: true })
            }
          }

          // If user wants a git diff
          await runDiff(ifcFolder, outputPath, target, changes, dryRun)

          // ---- New: log total runtime
          const divisor = 1000
          const fixedPoint = 2
          const overallEnd = Date.now()
          const totalSec = ((overallEnd - overallStart) / divisor).toFixed(fixedPoint)
          console.log(`\nAll tasks completed. Total runtime: ${totalSec} seconds.`)

          // All work is done and every CSV is written. Exit explicitly rather
          // than waiting for the event loop to drain: a child that had to be
          // force-killed (or any lingering wasm worker handle) can otherwise
          // keep this process alive long after the run, hanging the CI step
          // for the rest of the job timeout. console.log to a pipe is
          // synchronous on Linux, so the line above is already flushed.
          process.exit(0)
        },
    )
    .help().argv
