import csv
import sys


def compute_deltas(data1, data2):
    data1_by_file_dict = {entry['filename']: entry for entry in data1}
    data2_by_file_dict = {entry['filename']: entry for entry in data2}
    deltas = []
    for filename, entry1 in data1_by_file_dict.items():
        entry2 = data2_by_file_dict.get(filename)
        if entry2:
            total_time_delta = computeDelta('totalTimeMs', entry2, entry1)
            total_time_percentage_change = computePercentageChange(entry1.get('totalTimeMs'), entry2.get('totalTimeMs'))
            
            delta = {
                'timestamp': entry1.get('timestamp'),
                'loadStatus1': entry1.get('loadStatus'),
                'loadStatus2': entry2.get('loadStatus'),
                'uname': entry1.get('uname'),
                'engine1': entry1.get('engine'),
                'engine2': entry2.get('engine'),
                'filename': filename,
                'schemaVersion': entry1.get('schemaVersion'),
                'engine1TotalTimeMs': entry1.get('totalTimeMs'),
                'engine2TotalTimeMs': entry2.get('totalTimeMs'),
                'parseTimeMsDelta': computeDelta('parseTimeMs', entry2, entry1),
                'geometryTimeMsDelta': computeDelta('geometryTimeMs', entry2, entry1),
                'totalTimeMsDelta': total_time_delta,
                'totalTimeMsPercentageChange': total_time_percentage_change,
                'geometryMemoryMbDelta': computeDelta('geometryMemoryMb', entry2, entry1),
                'rssMbDelta': computeDelta('rssMb', entry2, entry1),
                'heapUsedMbDelta': computeDelta('heapUseMb', entry2, entry1),
                'heapTotalMbDelta': computeDelta('heapTotalMb', entry2, entry1)
            }
            deltas.append(delta)
        else:
            delta = {
                'timestamp': entry1.get('timestamp'),
                'loadStatus1': entry1.get('loadStatus'),
                'loadStatus2': 'N/A',
                'uname': entry1.get('uname'),
                'engine1': entry1.get('engine'),
                'engine2': 'N/A',
                'filename': filename,
                'schemaVersion': entry1.get('schemaVersion'),
                'engine1TotalTimeMs': entry1.get('totalTimeMs'),
                'engine2TotalTimeMs': 'N/A',
                'parseTimeMsDelta': 'N/A',
                'geometryTimeMsDelta': 'N/A',
                'totalTimeMsDelta': 'N/A',
                'totalTimeMsPercentageChange': 'N/A',
                'geometryMemoryMbDelta': 'N/A',
                'rssMbDelta': 'N/A',
                'heapUsedMbDelta': 'N/A',
                'heapTotalMbDelta': 'N/A',
            }
            deltas.append(delta)
    for filename, entry2 in data2_by_file_dict.items():
        if filename not in data1_by_file_dict:
            delta = {
                'timestamp': entry2.get('timestamp'),
                'loadStatus1': 'N/A',
                'loadStatus2': entry2.get('loadStatus'),
                'uname': entry2.get('uname'),
                'engine1': 'N/A',
                'engine2': entry2.get('engine'),
                'filename': filename,
                'schemaVersion': entry2.get('schemaVersion'),
                'engine1TotalTimeMs': 'N/A',
                'engine2TotalTimeMs': entry2.get('totalTimeMs'),
                'parseTimeMsDelta': 'N/A',
                'geometryTimeMsDelta': 'N/A',
                'totalTimeMsDelta': 'N/A',
                'totalTimeMsPercentageChange': 'N/A',
                'geometryMemoryMbDelta': 'N/A',
                'rssMbDelta': 'N/A',
                'heapUsedMbDelta': 'N/A',
                'heapTotalMbDelta': 'N/A',
            }
            deltas.append(delta)
    return deltas


def computePercentageChange(old_value, new_value):
    old_value = parse_value(old_value)
    new_value = parse_value(new_value)
    if old_value == 0:
        return 'Infinity' if new_value > 0 else '0%'
    return f"{((new_value - old_value) / old_value) * 100:.2f}%"



def computeDelta(field, e2, e1):
  return parse_value(e2.get(field)) - parse_value(e1.get(field))


def read_data_from_csv(stats_filepath):
    models_stats = []
    # Open the CSV file
    with open(stats_filepath, mode='r', newline='') as csvfile:
      # Create a CSV reader object
      csvreader = TrimmingDictReader(csvfile)

      # Dict read starts at row 2, since row 1 is consumed to build dict properties
      # TODO(pablo): validate
      for row in csvreader:
         models_stats.append(row)

    return models_stats


def write_data_to_csv(data, csv_filename):
    # Define CSV header
    csv_header = ['timestamp', 'loadStatus1', 'loadStatus2', 'uname', 'engine1', 'engine2', 'filename', 'schemaVersion',
              'engine1TotalTimeMs', 'engine2TotalTimeMs', 'parseTimeMsDelta', 'geometryTimeMsDelta', 'totalTimeMsDelta',
              'totalTimeMsPercentageChange', 'geometryMemoryMbDelta', 'rssMbDelta', 'heapUsedMbDelta', 'heapTotalMbDelta']

    
    # Write data to CSV
    with open(csv_filename, mode='w', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=csv_header)
        writer.writeheader()
        for row in data:
            writer.writerow(row)


class TrimmingDictReader(csv.DictReader):
    def __next__(self):
        row = super().__next__()
        # Trim whitespace from each field
        return {key: (value.strip() if isinstance(value, str) else value) for key, value in row.items()}


def parse_value(value):
    if value is None:
        return 0.0
    try:
        return float(value) if value.strip() != 'N/A' else 0.0
    except ValueError:
        return 0.0


if __name__ == '__main__':
    # Ensure the document names are provided as arguments
    if len(sys.argv) != 4:
        print('Usage: python script_name.py <run_name1> <run_name2> <output_csv_filename>')
        sys.exit(1)
    
    run_name1 = sys.argv[1]
    run_name2 = sys.argv[2]
    output_csv_filename = sys.argv[3]
    
    data1 = read_data_from_csv(run_name1)
    data2 = read_data_from_csv(run_name2)

    # Compute deltas
    deltas = compute_deltas(data1, data2)
    
    # Write deltas to CSV
    write_data_to_csv(deltas, output_csv_filename)
