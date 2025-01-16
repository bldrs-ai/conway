#!/bin/bash

usageAndExit() {
  echo "Usage: $0 /path/to/headless_three /path/to/model_directory [useWebIfc]"
  echo ""
  echo "    EXCLUDE_FILENAMES    list file names to filter for exclusion, e.g. 'foo.ifc bar.ifc'. Optional"
  exit 1
}

# Check if the server directory path is provided as the first argument
if [ -z "${1}" ]; then
  echo "Error: No server directory path provided."
  usageAndExit
fi

# Check if the model directory path is provided as the second argument
if [ -z "${2}" ]; then
  echo "Error: No model directory path provided."
  usageAndExit
fi

# If left blank, will use conway for server.  Otherwise assert it's useWebIfc
if [ -z "${3}" ]; then
  isEngineConway=1
  engineSuffix=""
else
  if [ "${3}" != "useWebIfc" ]; then
    echo "Error: unknown engine command (to use conway leave blank)."
    usageAndExit
  fi
  isEngineConway=0
  engineSuffix="-webifc"
fi

# Server directory path passed as the first argument
serverDir="$1"

# Model directory path passed as the second argument
modelDir="$2"

# Original script directory (to return to after server operations)
scriptDir=$(pwd)

# Get current date in YYYYMMDD_HMS format
currentDate=$(date +"%Y%m%d_%H%M%S")

# If web-ifc, get the version once
if [ $isEngineConway -eq 1 ] ; then
   #engine="conway"$(cd "$serverDir/node_modules/@bldrs-ai/conway-web-ifc-adapter/node_modules/@bldrs-ai/conway"; \
   engine="conway"$(cd $serverDir; yarn list --pattern @bldrs-ai/conway 2>&1 | grep '@bldrs-ai/conway@' | sed 's/.*@//g')
  #node -p "require('./package.json').version"; \
  #cd "$scriptDir")
else
  engine="webifc"$(cd $serverDir; yarn list --pattern web-ifc 2>&1 | grep web-ifc | sed 's/.*@//g' ; cd $scriptDir)
fi

# Extract the last folder name from the model directory path, e.g. test-models
modelDirName=$(basename "$modelDir")

# e.g. conway@0.1.560_test-models
testRunName=${engine}_${modelDirName}

# Create the output directory with the model directory name appended
outputBase="${scriptDir}/../benchmarks"
outputDir="${outputBase}/${testRunName}"
mkdir -p "$outputDir"

# Output from this script
basicStatsFilename="${outputDir}/performance.csv"

# Detailed rollup of stats for each model
newResults="${outputDir}/performance-detail.csv"

# Define the main error log file
errorLogFile="${outputDir}/performance.err.txt"

# Temporary file for storing server output
tempServerOutputFile="${outputDir}/rendering-server.log.txt"

# Write CSV headers
echo "timestamp,loadStatus,uname,engine,filename,schemaVersion,parseTimeMs,geometryTimeMs,totalTimeMs,geometryMemoryMb,rssMb,heapUsedMb,heapTotalMb,preprocessorVersion,originatingSystem" > "$newResults"

# Convert a list of filenames to exclude to a regex pattern
exclude_pattern=$(echo $EXCLUDE_FILENAMES | sed 's/ \+/|/g')

# Kept for output below
uname=$(uname -p)

rm -f "$basicStatsFilename"
rm -f "$errorLogFile"

all_status='OK'

start_time=$(date "+%s")
# Process files and save outputs to the new directory
find "${modelDir}/ifc" -type f \( -name "*.ifc" \) -print0 | while IFS= read -r -d '' f; do
  # Extract the base filename
  base_filename=$(basename "$f")
  
  # Check if exclude_pattern is not empty
  if [ -n "$exclude_pattern" ]; then
    # Check if the filename matches any in the exclude list
    if echo "$base_filename" | grep -Eq "$exclude_pattern"; then
      echo "skip, 0s, ${f#$modelDir/}" >> $basicStatsFilename
      continue  # Skip this file and continue with the next iteration
    fi
  fi


  # Change to server directory
  cd "$serverDir"

  # Start the server (redirect output to tmp file)
  yarn "serve${engineSuffix}" > "$tempServerOutputFile" 2>&1 &

  # Get the PID of the last background process (yarn serve)
  server_pid=$!

  # Wait a bit for the server to be fully up and running
  sleep 3

  # Change back to the original script directory
  cd "$scriptDir"

  # Split the directory and filename
  absoluteDirPath=$(dirname "$f")
  filename=$(basename "$f")

  # Get the relative directory path by removing the current working directory prefix
  dir_path=$(echo "$absoluteDirPath" | sed "s|^$modelDir/||")

  # Encode only the filename, replacing spaces with %20
  encoded_file_name=$(python3 -c "import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1]))" "$filename")

  # Construct the URL with the encoded filename
  # url="http://127.0.0.1:8001/${dir_path}/${encoded_file_name}"
  url="file://${absoluteDirPath}/${encoded_file_name}"

  # Define the output PNG file path
  output_png="${outputDir}/${filename}-fit.png"

  # Flag to track if curl command is successful
  curl_success=true

  model_start_time=$(date "+%s")
  # Execute the curl command and check for errors
  if ! curl -f -d "{\"url\": \"$url\"}" \
       -H 'content-type: application/json' \
       -o "$output_png" --fail --silent \
       --max-time 180 \
       http://localhost:8001/render; then
    # If there's an error, append it to the main error log
    echo "Error processing file $url" >> $errorLogFile
    curl_success=false
    model_end_time=$(date "+%s")
    delta_time=$((model_end_time - model_start_time))
    echo "error, ${delta_time}s, ${f#$modelDir/}" >> $basicStatsFilename
  else
    model_end_time=$(date "+%s")
    delta_time=$((model_end_time - model_start_time))
    echo "ok, ${delta_time}s, ${f#$modelDir/}" >> $basicStatsFilename
  fi

  # Extract statistics only if curl command was successful
  if [ "$curl_success" = true ]; then
    statFile="${outputDir}/${filename}-statistics.txt"

    if [ $isEngineConway -eq 1 ] ; then
      awk '/\[.*\]: Load Status: OK/{flag=1} flag; /MB, Heap Used:.*MB/{flag=0}' "$tempServerOutputFile" > "$statFile"
      # Extract Statistics from file
      timestamp=$(awk -F ']: ' '/Load Status/{print $1}' "$statFile" | tr -d '[')
      schemaVersion=$(awk -F ', ' '{for(i=1;i<=NF;i++) if ($i ~ /Version:/ && $(i+1) ~ /Conway Version:/) print $i}' "$statFile" | awk -F 'Version: ' '{print $2}')
      parseTimeMs=$(awk -F 'Parse Time: ' '{print $2}' "$statFile" | awk '{print $1}' | tr -d ' ms')
      geometryTimeMs=$(awk -F 'Geometry Time: ' '{print $2}' "$statFile" | awk '{print $1}' | tr -d ' ms')
      totalTimeMs=$(awk -F 'Total Time: ' '{print $2}' "$statFile" | awk '{print $1}' | tr -d ' ms')
      geometryMemoryMb=$(awk -F 'Geometry Memory: ' '{print $2}' "$statFile" | awk '{print $1}' | tr -d ' MB')
      rssMb=$(awk -F 'RSS ' '{print $2}' "$statFile" | awk '{print $1}' | tr -d ' MB')
      heapUsedMb=$(awk -F 'Heap Used: ' '{print $2}' "$statFile" | awk '{print $1}' | tr -d ' MB')
      heapTotalMb=$(awk -F 'Heap Total: ' '{print $2}' "$statFile" | awk '{print $1}' | tr -d ' MB')
      preprocessorVersion=$(awk -F"Preprocessor Version: '" '{split($2, a, "'\''"); print a[1]}' "$statFile")
      originatingSystem=$(awk -F"Originating System: '" '{split($2, a, "'\''"); print a[1]}' "$statFile")
    else
      grep -E '(Total Time|web-ifc memory)' "$tempServerOutputFile" | tr \\n , > "$statFile"
      timestamp=$(awk -F ']: ' '/Total Time/{print $1}' "$statFile" | tr -d '[')
      schemaVersion='N/A'
      parseTimeMs=0
      geometryTimeMs=0
      totalTimeMs=$(awk -F 'Total Time: ' '{print $2}' "$statFile" | awk '{print $1}' | tr -d ' ms')
      geometryMemoryMb=$(awk -F 'Geometry Memory: ' '{print $2}' "$statFile" | awk '{print $1}' | tr -d ' MB')
      rssMb=$(awk -F 'RSS ' '{print $2}' "$statFile" | awk '{print $1}' | tr -d ' MB')
      heapUsedMb=$(awk -F 'Heap Used: ' '{print $2}' "$statFile" | awk '{print $1}' | tr -d ' MB')
      heapTotalMb=$(awk -F 'Heap Total: ' '{print $2}' "$statFile" | awk '{print $1}' | tr -d ' MB')
      preprocessorVersion=0
      originatingSystem=0
    fi

    # Write the extracted data to the CSV file
    echo "$timestamp,OK,$uname,$engine,$filename,$schemaVersion,$parseTimeMs,$geometryTimeMs,$totalTimeMs,$geometryMemoryMb,$rssMb,$heapUsedMb,$heapTotalMb,$preprocessorVersion,$originatingSystem" >> "$newResults"

  else
    # If curl failed, log the failure
    timestamp=$(date +"%Y%m%d_%H%M%S")
    uname=$(uname -p)
    filename=$(basename "$f")
    all_status='fail'
    # Write the failure data to the CSV file
    echo "$timestamp,FAIL,$uname,N/A,$filename,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A" >> "$newResults"
  fi

  # Change back to server directory to safely stop the server
  cd "$serverDir"
  kill $server_pid

  # Wait a moment to ensure the server has fully stopped
  sleep 2

  # Change back to the script directory
  cd "$scriptDir"
done
end_time=$(date "+%s")
delta_time=$((end_time - start_time))
echo "${all_status}, ${delta_time}s, ALL_FILES" >> $basicStatsFilename

# Use npm to get the latest version of @bldrs-ai/conway
oldVersion=$(npm show @bldrs-ai/conway version --registry=https://npm.pkg.github.com/)

# Decrement the minor version
oldVersion=$(echo "$oldVersion" | awk -F. '{print $1 "." $2-1 "." $3}')

# Construct the paths for the current and latest runs
oldResults="${outputBase}/conway${oldVersion}_${modelDirName}/performance-detail.csv"

# Extract the version number
newVersion=$(echo "$engine" | awk -F'conway' '{print $2}')

# Construct the output path for the delta file
deltaOutputPath="${outputDir}/conway${newVersion}_${oldVersion}_delta.csv"

# Check if the latest version's performance-detail.csv exists
if [ -f "$oldResults" ]; then
  echo "Generating delta file: $deltaOutputPath"
  python3 gen_delta_csv.py "$oldResults" "$newResults" "$deltaOutputPath"
else
  echo "Warning: Latest version's performance-detail.csv not found at $oldResults. Delta file not generated."
fi
