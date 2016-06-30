import sys
import numpy as np
from pyexcelerate import Workbook, Style, Font
import csv
import ast

project_name = sys.argv[1]
target_file = sys.argv[2]
transect_csvs = sys.argv[3:]

workbook = Workbook()
numSheets = 0

def addRow(x="", y="", label="", filename="", annotation_id="", shape=""):
    return [filename, annotation_id, shape, x, y, label]

for path in transect_csvs:
    f = open(path, 'r')
    transect_csv = csv.reader(f)
    transect_name = transect_csv.next()[0]
    rows = np.array(list(transect_csv))
    f.close()
    if rows.shape[0] == 0:
        continue
    numSheets += 1
    # rows have the content: image_filename, annotation_id, label_name, shape_name, points
    celldata = [[transect_name]]
    celldata.append(addRow("x/radius", "y", "labels", "filename", "annotation_id", "shape"))

    uniqueimages = np.unique(rows[:, 0])

    for img in uniqueimages:
        curImgData = rows[rows[:, 0] == img]
        uniqueannotations = np.unique(curImgData[:, 1])

        for annotation in uniqueannotations:
            curAnnotationData = curImgData[curImgData[:, 1] == annotation]
            labels = ", ".join(curAnnotationData[:, 2])
            points = ast.literal_eval(curAnnotationData[:, 4][0])
            it = iter(points)
            celldata.append(addRow(it.next(), it.next(), labels, img, annotation, curAnnotationData[0, 3]))
            try:
                for x in it:
                    celldata.append(addRow(x, next(it)))
            except StopIteration:
                pass
            if len(points) % 2 == 1:
                # add radius
                celldata.append(addRow(points[-1], ""))

    ws = workbook.new_sheet("transect " + str(numSheets), data=celldata)
    ws.set_row_style(1, Style(font=Font(bold=True)))
    ws.set_row_style(2, Style(font=Font(bold=True)))

workbook.save(target_file)
