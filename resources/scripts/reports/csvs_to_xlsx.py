import sys
from pyexcelerate import Workbook, Style, Font
import csv

# See: https://github.com/biigle/reports/issues/79
csv.field_size_limit(sys.maxsize)

target_file = sys.argv[2]
csvs = sys.argv[3:]

#Arbitrary limit of rows for a single sheet. See https://github.com/biigle/core/issues/1040
ROW_LIMIT = 5000

workbook = Workbook()
numSheets = 0

for path in csvs:
    f = open(path, 'r')
    rows = list(csv.reader(f))
    f.close()
    # Volume name is the first row, column titles are in the second row.
    # So if we only have two rows, the volume is empty.
    if len(rows) == 2:
        continue
    numSheets += 1

    # rows have the content: image_filename, label_name, label_count
    for i in range(0, len(rows), ROW_LIMIT):
        sheet_number = i // ROW_LIMIT
        # Excel does not permit worksheet names longer than 31 characters
        ws = workbook.new_sheet(f"sheet {str(numSheets)}-{str(sheet_number)}", data=rows[i:i+ROW_LIMIT])

        # bold font for titles
        ws.set_row_style(1, Style(font=Font(bold=True)))
        ws.set_row_style(2, Style(font=Font(bold=True)))

if not numSheets:
    ws = workbook.new_sheet("No labels found", data=[['No labels found']])

workbook.save(target_file)
