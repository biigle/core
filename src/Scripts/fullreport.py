import sys
import numpy as np
from pyexcelerate import Workbook, Color, Style, Fill
import csv
import ast

prjName = sys.argv[1]
transects = sys.argv[2:]
prefix = "/tmp/"


def addRow(x="", y="", label="", filename="", annotation_id="", shape=""):
    return[filename, annotation_id, shape, x, y, label]

workbook = Workbook()

for transect in transects:
    f = open(prefix + transect, 'r')
    res = np.array(list(csv.reader(f)))
    f.close()
    if res.size == 0:
        workbook.new_sheet(transect)
        continue
    celldata = []
    celldata.append(addRow("x/radius", "y", "label", "filename", "annotation_id", "shape"))
    uniqueimages = np.unique(res[:, 1])
    for img in uniqueimages:
        curImgData = res[res[:, 1] == img]
        uniqueannotations = np.unique(curImgData[:, 2])
        for annotation in uniqueannotations:
            curAnnotationData = curImgData[curImgData[:, 2] == annotation]
            labels = ",".join(curAnnotationData[:, 0])
            points = ast.literal_eval(curAnnotationData[:, 6][0])
            it = iter(points)
            celldata.append(addRow(it.next(), it.next(), labels, img, annotation, curAnnotationData[0, 5]))
            try:
                for x in it:
                    celldata.append(addRow(x, next(it)))
            except StopIteration:
                pass
            if len(points) % 2 == 1:
                # add radius
                celldata.append(addRow(points[-1], ""))
    ws = workbook.new_sheet(transect, data=celldata)
    ws.set_row_style(1, Style(fill=Fill(background=Color(200, 200, 200, 0))))
workbook.save(prefix + "BiigleDiasReport(full).xlsx")