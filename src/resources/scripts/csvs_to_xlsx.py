import sys
import numpy as np
from pyexcelerate import Workbook, Style, Font
import csv

# See: https://github.com/biigle/reports/issues/79
csv.field_size_limit(sys.maxsize)

target_file = sys.argv[2]
csvs = sys.argv[3:]

workbook = Workbook()
numSheets = 0

for path in csvs:
    f = open(path, 'r')
    rows = np.array(list(csv.reader(f)))
    f.close()
    # volume name is the first row
    # column titles are in the second row
    if rows.shape[0] == 2:
        continue
    numSheets += 1
    # rows have the content: image_filename, label_name, label_count

    # Excel does not permit worksheet names longer than 31 characters
    ws = workbook.new_sheet("sheet " + str(numSheets), data=rows)

    # bold font for titles
    ws.set_row_style(1, Style(font=Font(bold=True)))
    ws.set_row_style(2, Style(font=Font(bold=True)))

if not numSheets:
    ws = workbook.new_sheet("No labels found", data=[['No labels found']])

workbook.save(target_file)
