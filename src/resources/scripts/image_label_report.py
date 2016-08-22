import sys
import numpy as np
from pyexcelerate import Workbook, Style, Font
import csv

project_name = sys.argv[1]
target_file = sys.argv[2]
transect_csvs = sys.argv[3:]

workbook = Workbook()
numSheets = 0

for path in transect_csvs:
    f = open(path, 'r')
    transect_csv = csv.reader(f)
    rows = np.array(list(transect_csv))
    f.close()
    # transect name is the first row
    if rows.shape[0] == 1:
        continue
    numSheets += 1
    # rows have the content: image_filename, label_name, label_count

    # Excel does not permit worksheet names longer than 31 characters
    ws = workbook.new_sheet("transect " + str(numSheets), data=rows)
    # first row is transect name
    ws.set_row_style(1, Style(font=Font(bold=True)))

if not numSheets:
    ws = workbook.new_sheet("No labels found")

workbook.save(target_file)
