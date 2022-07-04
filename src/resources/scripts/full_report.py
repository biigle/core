import sys
from pyexcelerate import Workbook, Style, Font
import csv
import json

# See: https://github.com/biigle/reports/issues/79
csv.field_size_limit(sys.maxsize)

target_file = sys.argv[2]
csvs = sys.argv[3:]

workbook = Workbook()
numSheets = 0

def add_sheet(csv_path, index):
    with open(csv_path, 'r') as f:
        csv_reader = csv.reader(f)

        csv_title = next(csv_reader)[0]
        csv_column_labels = next(csv_reader)


        images = {}

        for row in csv_reader:
            if row[0] not in images:
                images[row[0]] = {
                    'annotations': {},
                    'area': row[5],
                }

            image = images[row[0]]

            if row[1] not in image['annotations']:
                image['annotations'][row[1]] = {
                    'id': row[1],
                    'shape': row[3],
                    'points': json.loads(row[4]),
                    'labels': [],
                }

            image['annotations'][row[1]]['labels'].append(row[2])

    # rows have the content: image_filename, annotation_id, label_name, shape_name, points, image area
    celldata = [[csv_title], csv_column_labels]

    for filename in sorted(images):
        image = images[filename]
        for annotation_id, annotation in image['annotations'].items():
            points = iter(annotation['points'])
            labels = ' ,'.join(annotation['labels'])
            celldata.append([filename, annotation_id, annotation['shape'], next(points), next(points), labels, image['area']])
            for point in points:
                celldata.append(['', '', '', point, next(points, ''), '', ''])

    ws = workbook.new_sheet("sheet {}".format(index), data=celldata)
    ws.set_row_style(1, Style(font=Font(bold=True)))
    ws.set_row_style(2, Style(font=Font(bold=True)))

for i, csv_path in enumerate(csvs):
    add_sheet(csv_path, i)

workbook.save(target_file)
