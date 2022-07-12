import pandas as pd
import numpy
from shapely.geometry import Point
from shapely.affinity import scale, rotate
import warnings
import sys
import math
import json
import ast

# the path to the CSV file
paths = sys.argv[2:]


def check_shape_and_attributes(row):
    # check that only accepted shapes are passed on
    shape = row.shape_name
    attrs = row.attributes
    valid = True
    if not(shape == "LineString" or shape == "Polygon" or shape == "Rectangle" or shape == "Circle" or shape == "Ellipse"):
        warnings.warn('The shape %s is not supported !' % (shape))
        valid = False
    try:
        desired_dict=json.loads(attrs)
        desired_dict["height"]
        desired_dict["width"]
    except TypeError:
        warnings.warn('Attributes of %s cannot be read! It might be empty.'% (row.filename))
        valid = False
    except KeyError:
        warnings.warn('Height or width of %s is not listed as an attribute. If you added the file recently please try again later. Otherwise the file may be corrupt.'%(row.filename))
        valid = False
    return valid


def image(row):
    image = {}
    # row.attributes is a string, we want to transform it in a dict
    desired_dict = json.loads(row.attributes)
    image["height"] = desired_dict["height"]
    image["width"] = desired_dict["width"]
    image["id"] = int(row.image_id)
    image["file_name"] = row.filename
    image["longitude"] = float(row.image_longitude) if not math.isnan(
        row.image_longitude) else None
    image["latitude"] = float(row.image_latitude) if not math.isnan(
        row.image_latitude) else None
    return image


def category(row):
    category = {}
    category["id"] = row.label_id
    category["name"] = row.label_name
    return category


def annotation(row):
    annotation = {}
    desired_array = ast.literal_eval(row.points)
    # convert Circle to Polygon using shapely
    if row.shape_name == "Circle":
        x, y, r = desired_array
        r = max(r, 1) # catch case for zero or negative raidus
        circlePolygon = Point(x, y).buffer(r)
        desired_array = numpy.array(
            list(zip(*circlePolygon.exterior.coords.xy))).flatten().astype(float).tolist()
    # convert Ellipse to Polygon using shapely
    elif row.shape_name == "Ellipse":
        m1x, m1y, mi1x, mi1y, m2x, m2y, mi2x, mi2y = desired_array
        x = (m1x+mi1x+m2x+mi2x)/4
        y = (m1y+mi1y+m2y+mi2y)/4
        lm = math.sqrt((m1x-m2x)**2+(m1y-m2y)**2)/2
        lmi = math.sqrt((mi1x-mi2x)**2+(mi1y-mi2y)**2)/2
        angle = math.atan((m1y-m2y)/(m1x-m2x))
        # create Circle and...
        circlePolygon = Point(x, y).buffer(1)
        # scale it to an ellipse and...
        circlePolygon = scale(circlePolygon, lm, lmi)
        # rotate it.
        circlePolygon = rotate(circlePolygon, angle, use_radians=True)
        desired_array = numpy.array(
            list(zip(*circlePolygon.exterior.coords.xy))).flatten().astype(float).tolist()

    # x = even  - start at the beginning at take every second item
    x_coord = desired_array[::2]
    # y = odd - start at second item and take every second item
    y_coord = desired_array[1::2]
    xmax = max(x_coord)
    ymax = max(y_coord)
    xmin = min(x_coord)
    ymin = min(y_coord)
    area = (xmax - xmin)*(ymax - ymin)
    annotation["segmentation"] = [desired_array]
    annotation["iscrowd"] = 0
    annotation["area"] = area
    annotation["image_id"] = int(row.image_id)
    annotation["bbox"] = [xmin, ymin, xmax - xmin, ymax-ymin]
    annotation["category_id"] = row.label_id
    annotation["id"] = int(row.annotation_label_id)
    return annotation


for path in paths:
    data = pd.read_csv(path)
    # delete rows with not supported shapes
    for index, row in data.iterrows():
        if not check_shape_and_attributes(row):
            data.drop(index, inplace=True)

    images = []
    categories = []
    annotations = []

    data['fileid'] = data['filename'].astype('category').cat.codes
    data['categoryid'] = pd.Categorical(data['label_name'], ordered=True).codes
    data['categoryid'] = data['categoryid']+1
    imagedf = data.drop_duplicates(subset=['fileid']).sort_values(by='fileid')
    catdf = data.drop_duplicates(
        subset=['categoryid']).sort_values(by='categoryid')    

    for row in data.itertuples():
        annotations.append(annotation(row))

    for row in imagedf.itertuples():
        images.append(image(row))

    for row in catdf.itertuples():
        categories.append(category(row))

    data_coco = {}
    data_coco["images"] = images
    data_coco["categories"] = categories
    data_coco["annotations"] = annotations
    pretty_json = json.dump(data_coco, open(path, "w"), indent=4)
