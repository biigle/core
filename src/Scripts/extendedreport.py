import sys
import collections
import numpy as np
from pyexcelerate import Workbook, Color, Style, Fill

prjName = sys.argv[1]
transects = sys.argv[2:]
prefix = "/tmp/"

workbook = Workbook()

for transect in transects:
    f = open(prefix + transect, 'r')
    res = np.array(map(lambda x: x.split(","), f.read().split("\n")[:-1]))
    f.close()
    uniqueclasses = np.unique(res[:, 1])
    uniqueimages = np.unique(res[:, 0])
    class2column = dict(zip(uniqueclasses, range(len(uniqueclasses))))
    data = np.zeros((len(uniqueimages) + 1, len(uniqueclasses) + 1), np.int).tolist()
    for cl in class2column:
        data[0][1 + class2column[cl]] = cl
    for rowidx, img in enumerate(uniqueimages):
        data[rowidx + 1][0] = img
        c = collections.Counter(res[res[:, 0] == img][:, 1])
        for entry in c:
            data[rowidx + 1][class2column[entry] + 1] = int(c[entry])
    ws = workbook.new_sheet(transect, data=data)
    ws.set_cell_value(1, 1, "")
    ws.set_row_style(1, Style(fill=Fill(background=Color(200, 200, 200, 0))))
    ws.set_col_style(1, Style(fill=Fill(background=Color(200, 200, 200, 0))))
workbook.save(prefix + "BiigleDiasReport.xlsx")