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
 * @param command The command to run.
 * @param timeoutMs Number of milliseconds to wait before timing out.
 * @returns
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
      // Timeout occurred: kill the child process.
      child.kill()
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

 
const STD_OUT_ERR_MAX_BUFFER = 64 * 1024 * 1024

interface RunSuccessResults {

  type: 'Run'

  errorLines?: string[]

  outputFile: string

  hash?: string

}

interface RunErrorResults extends ExecException {

  type: 'Failed'
}

type RunResults = RunSuccessResults | RunErrorResults

/**
 * Encapsulates a string in a CSV safe way.
 * @param from
 * @returns
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
 * Encapsulates a string in a CSV safe way, taking
 * file paths (assumed by directory characters / and \,
 * ) and shortening them to file names without ".csv".
 * @param from
 * @returns
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

let totalTime = 0 // To keep track of the running total time

/**
 * Run a regression test digest for a file.
 * @param filePath
 * @param outputPath
 * @param maxTimeout
 */
async function runForFile(filePath: string,
    outputPath: string, maxTimeout:number): Promise<RunResults> {
  const MAX_TIMEOUT_MS = maxTimeout
  const startTime = Date.now() // Start time

   
  const safeExecCommand = `node --experimental-specifier-resolution=node ./compiled/src/ifc/ifc_regression_main.js -d "${filePath}" "${outputPath}"`

  console.log(`Current File: ${filePath}`)

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
  const outputCSV = `${outputPath}.csv`
  if (fs.existsSync(outputCSV)) {
    fileHash = crypto
        .createHash('sha1')
        .update(await fsPromises.readFile(outputCSV))
        .digest('hex')
  }

  return {
    type: 'Run',
    errorLines: errorLines.length > 0 ? errorLines : undefined,
    outputFile,
    hash: fileHash,
  }
}

/**
 * Recursively collect all IFC file paths (instead of processing them immediately).
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
      } else if (path.extname(resolved).toLowerCase() === '.ifc') {
        ifcFiles.push(resolved)
      }
    }
  }

  await recursiveWalk(parentPath)
  return ifcFiles
}

/**
 * @returns percentage of memory used on machine
 */
function getSystemMemoryUsagePercent(): number {
  const total = os.totalmem()  // total system memory in bytes
  const free = os.freemem()    // free system memory in bytes
  const used = total - free
   
  console.log(`total: ${total / 1000 / 1000 / 1000} GB - ` +
    `used: ${used / 1000 / 1000 / 1000} GB - ` +
    `free: ${free / 1000 / 1000 / 1000} GB`)
  return (used / total) * 100
   
}

/**
 * Parallel processing, using p-limit to limit concurrency to number of CPU cores.
 * @param ifcFiles
 * @param outputPath
 * @param errorLines
 * @param fileLines
 * @param failedLines
 * @param memUtilization
 * @param maxTimeout
 */
async function processIFCFilesInParallel(
    ifcFiles: string[],
    outputPath: string,
    errorLines: string[],
    fileLines: string[],
    failedLines: string[],
    memUtilization: number,
    maxTimeout:number,
): Promise<void> {
  const concurrencyLimit = os.cpus().length
  console.log(`Concurrency: ${concurrencyLimit} threads - Max Timeout: ${maxTimeout} ms`)

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
      const fileResults = await runForFile(
          ifcPath,
          path.join(outputPath, path.basename(ifcPath, '.ifc')),
          maxTimeout,
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
 * @param maxTimeout
 */
async function recursiveWalk(
    parentPath: string,
    excludeRegex: RegExp | undefined,
    outputPath: string,
    errorLines: string[],
    fileLines: string[],
    failedLines: string[],
    maxTimeout: number,
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
          errorLines, fileLines, failedLines, maxTimeout)
    } else if (path.extname(resolved).toLowerCase() === '.ifc') {
      const fileResults = await runForFile(
          resolved,
          path.join(outputPath, path.basename(resolved, '.ifc')),
          maxTimeout,
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
          // Validate mem-utilization only if parallel mode is active
          yargs2.check((argv) => {
            if (argv.parallel) {
              const memUtil = argv['mem-utilization']
               
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

          if (changes.length === 0) {
            changes = path.join(outputPath, 'changes')
          }

          await fsPromises.mkdir(outputPath, { recursive: true })

          const mainPath = path.join(outputPath, 'main.csv')
          const errorPath = path.join(outputPath, 'errors.csv')
          const failedPath = path.join(outputPath, 'failed.csv')

          const errorLines: string[] = []
          const fileLines: string[] = []
          const failedLines: string[] = []

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
                memUtilization,
                maxTimeout,
            )
          } else {
            console.log('Processing in serial mode...')
             
            await recursiveWalk(ifcFolder, excludeRegex, outputPath, errorLines, fileLines, failedLines, maxTimeout)
          }

          // Write out results
          await fsPromises.writeFile(mainPath, `file,hash,errors\n${  fileLines.join('')}`)
          await fsPromises.writeFile(errorPath, `${errorCSVHeader}\n${  errorLines.join('')}`)
          await fsPromises.writeFile(failedPath, `file,code,signal\n${  failedLines.join('')}`)

          // If user wants a git diff
          await runDiff(ifcFolder, outputPath, target, changes, dryRun)

          // ---- New: log total runtime
          const divisor = 1000
          const fixedPoint = 2
          const overallEnd = Date.now()
          const totalSec = ((overallEnd - overallStart) / divisor).toFixed(fixedPoint)
          console.log(`\nAll tasks completed. Total runtime: ${totalSec} seconds.`)
        },
    )
    .help().argv
