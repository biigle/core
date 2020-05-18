import sys
import numpy as np
from pyexcelerate import Workbook, Style, Font
import csv
import ast
import json

target_file = sys.argv[2]
csvs = sys.argv[3:]

workbook = Workbook()
numSheets = 0


def addRow(x="", y="", label="", filename="", annotation_id="", shape="", area=""):
    return [filename, annotation_id, shape, x, y, label, area]

for path in csvs:
    f = open(path, 'r')
    csv_file = csv.reader(f)
    csv_title = next(csv_file)[0]
    csv_column_labels = next(csv_file)
    rows = np.array(list(csv_file))
    f.close()
    if rows.shape[0] == 0:
        continue
    numSheets += 1
    # rows have the content: image_filename, annotation_id, label_name, shape_name, points
    celldata = [[csv_title], csv_column_labels]

    uniqueimages = np.unique(rows[:, 0])

    for img in uniqueimages:
        curImgData = rows[rows[:, 0] == img]
        uniqueannotations = np.unique(curImgData[:, 1])

        for annotation in uniqueannotations:
            curAnnotationData = curImgData[curImgData[:, 1] == annotation]
            labels = ", ".join(curAnnotationData[:, 2])
            points = ast.literal_eval(curAnnotationData[:, 4][0])
            it = iter(points)
            celldata.append(addRow(next(it), next(it), labels, img, annotation, curAnnotationData[0, 3], curAnnotationData[0, 5]))
            try:
                for x in it:
                    celldata.append(addRow(x, next(it)))
            except StopIteration:
                pass
            if len(points) % 2 == 1:
                # add radius
                celldata.append(addRow(points[-1], ""))

    ws = workbook.new_sheet("sheet " + str(numSheets), data=celldata)
    ws.set_row_style(1, Style(font=Font(bold=True)))
    ws.set_row_style(2, Style(font=Font(bold=True)))

workbook.save(target_file)
