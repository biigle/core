import pandas as pd
import numpy
from shapely.geometry import Point
from shapely.affinity import scale, rotate
import warnings
import sys
import math
import json
import ast
import os
import shutil

import random

# Command format: python script.py volumeName path imagePath splitRatio csv1 csv2 ...

volumeName = sys.argv[1]
path = sys.argv[2]
image_path = sys.argv[3] if len(sys.argv) > 3 else ''
split_ratio = sys.argv[4] if len(sys.argv) > 4 else '0.7 0.2 0.1'
paths = sys.argv[5:]  # CSV files

# Clean up image path
if image_path:
    image_path = image_path.strip().strip('"').strip("'")

# Parse split ratio
try:
    splits = [float(x) for x in split_ratio.split()]
    if len(splits) != 3:
        splits = [0.7, 0.2, 0.1]
except:
    splits = [0.7, 0.2, 0.1]

# Normalize splits
total_split = sum(splits)
splits = [x / total_split for x in splits]

def check_shape_and_attributes(row):
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

def get_bbox(row):
    desired_array = ast.literal_eval(row.points)
    if row.shape_name == "Circle":
        x, y, r = desired_array
        r = max(r, 1)
        circlePolygon = Point(x, y).buffer(r)
        desired_array = numpy.array(list(zip(*circlePolygon.exterior.coords.xy))).flatten().astype(float).tolist()
    elif row.shape_name == "Ellipse":
        m1x, m1y, mi1x, mi1y, m2x, m2y, mi2x, mi2y = desired_array
        x = (m1x+mi1x+m2x+mi2x)/4
        y = (m1y+mi1y+m2y+mi2y)/4
        lm = math.sqrt((m1x-m2x)**2+(m1y-m2y)**2)/2
        lmi = math.sqrt((mi1x-mi2x)**2+(mi1y-mi2y)**2)/2
        angle=0
        if m1x-m2x==0:
            angle=math.pi/2
        else:
            angle = math.atan((m1y-m2y)/(m1x-m2x))
        circlePolygon = Point(x, y).buffer(1)
        circlePolygon = scale(circlePolygon, lm, lmi)
        circlePolygon = rotate(circlePolygon, angle, use_radians=True)
        desired_array = numpy.array(list(zip(*circlePolygon.exterior.coords.xy))).flatten().astype(float).tolist()
    elif row.shape_name == "Rectangle":
        desired_array.extend(desired_array[:2])

    x_coord = desired_array[::2]
    y_coord = desired_array[1::2]
    xmax = max(x_coord)
    ymax = max(y_coord)
    xmin = min(x_coord)
    ymin = min(y_coord)
    
    return xmin, ymin, xmax, ymax

def convert_to_yolo(xmin, ymin, xmax, ymax, img_width, img_height):
    # YOLO format: x_center y_center width height (normalized)
    dw = 1. / img_width
    dh = 1. / img_height
    x = (xmin + xmax) / 2.0
    y = (ymin + ymax) / 2.0
    w = xmax - xmin
    h = ymax - ymin
    x = x * dw
    w = w * dw
    y = y * dh
    h = h * dh
    return x, y, w, h

for path in paths:
    data = pd.read_csv(path)
    # Filter invalid shapes
    for index, row in data.iterrows():
        if not check_shape_and_attributes(row):
            data.drop(index, inplace=True)
            
    # Create temp dir for this csv
    base_dir = os.path.dirname(path)
    temp_dir = os.path.join(base_dir, 'yolo_temp_' + os.path.basename(path))
    os.makedirs(temp_dir)
    
    labels_dir = os.path.join(temp_dir, 'labels')
    os.makedirs(labels_dir)
    
    # Map labels to IDs (0-indexed)
    unique_labels = data[['label_id', 'label_name']].drop_duplicates().sort_values('label_id')
    label_map = {row.label_id: i for i, row in enumerate(unique_labels.itertuples())}
    class_names = [row.label_name for row in unique_labels.itertuples()]
    
    # Write classes.txt
    with open(os.path.join(temp_dir, 'classes.txt'), 'w') as f:
        for name in class_names:
            f.write(f"{name}\n")
            
    # Group by image
    grouped = data.groupby('filename')
    all_filenames = list(grouped.groups.keys())
    
    # Shuffle and split
    random.seed(42)
    random.shuffle(all_filenames)
    
    total_images = len(all_filenames)
    train_count = int(total_images * splits[0])
    val_count = int(total_images * splits[1])
    
    train_files = all_filenames[:train_count]
    val_files = all_filenames[train_count:train_count+val_count]
    test_files = all_filenames[train_count+val_count:]
    
    split_files = {
        'train': train_files,
        'val': val_files,
        'test': test_files
    }
    
    # Create standard YOLO directory structure
    # images/train, images/val, images/test
    # labels/train, labels/val, labels/test
    images_dir = os.path.join(temp_dir, 'images')
    labels_dir = os.path.join(temp_dir, 'labels')
    
    for split in ['train', 'val', 'test']:
        os.makedirs(os.path.join(images_dir, split), exist_ok=True)
        os.makedirs(os.path.join(labels_dir, split), exist_ok=True)
    
    # Determine which split each image belongs to
    image_to_split = {}
    for split_name, file_list in split_files.items():
        for img_file in file_list:
            image_to_split[img_file] = split_name
    
    # Generate label files
    for filename, group in grouped:
        # Determine which split this image belongs to
        split_name = image_to_split.get(filename, 'train')
        split_labels_dir = os.path.join(labels_dir, split_name)
        
        txt_filename = os.path.splitext(filename)[0] + '.txt'
        label_file_path = os.path.join(split_labels_dir, txt_filename)
        
        with open(label_file_path, 'w') as f:
            for row in group.itertuples():
                # Get image dimensions
                try:
                    desired_dict = json.loads(row.attributes)
                    img_width = desired_dict["width"]
                    img_height = desired_dict["height"]
                    
                    xmin, ymin, xmax, ymax = get_bbox(row)
                    x, y, w, h = convert_to_yolo(xmin, ymin, xmax, ymax, img_width, img_height)
                    cls_idx = label_map[row.label_id]
                    
                    f.write(f"{cls_idx} {x:.6f} {y:.6f} {w:.6f} {h:.6f}\n")
                except Exception as e:
                    warnings.warn(f"Error processing annotation for {filename}: {e}")
    
    # Create symlinks for images in their respective split directories
    if image_path:
        for split_name, file_list in split_files.items():
            target_images_dir = os.path.join(images_dir, split_name)
            for img_file in file_list:
                source = os.path.join(image_path, img_file)
                target = os.path.join(target_images_dir, img_file)
                try:
                    os.symlink(source, target)
                except Exception as e:
                    warnings.warn(f"Could not create symlink for {img_file}: {e}")
    
    # Create data.yaml
    data_yaml_path = os.path.join(temp_dir, 'data.yaml')
    with open(data_yaml_path, 'w') as f:
        # Use relative paths in data.yaml
        f.write("train: images/train\n")
        f.write("val: images/val\n")
        f.write("test: images/test\n")
        f.write("\n")
        f.write(f"nc: {len(class_names)}\n")
        f.write("names:\n")
        for i, name in enumerate(class_names):
            f.write(f"  {i}: {name}\n")
    
    # Create README.txt
    readme_path = os.path.join(temp_dir, 'README.txt')
    with open(readme_path, 'w') as f:
        f.write("YOLO Dataset\n")
        f.write("=============\n\n")
        f.write("This dataset is in YOLO format for object detection.\n\n")
        f.write("Directory Structure:\n")
        f.write("- data.yaml: Dataset configuration file\n")
        if image_path:
            f.write("- images/train/: Training images (symlinks)\n")
            f.write("- images/val/: Validation images (symlinks)\n")
            f.write("- images/test/: Test images (symlinks)\n")
        else:
            f.write(" Please copy the image to the following directories with the same split as the labels:\n")
            f.write("- images/train/: Training images\n")
            f.write("- images/val/: Validation images\n")
            f.write("- images/test/: Test images\n")
        f.write("- labels/train/: Training annotation files\n")
        f.write("- labels/val/: Validation annotation files\n")
        f.write("- labels/test/: Test annotation files\n\n")
        
        if image_path:
            f.write(f"Image symlinks point to: {image_path}\n\n")
        else:
            f.write("WARNING: No image path provided. Image symlinks were not created. Please copy/symlink the images into this directory with the same split as the labels. See above for the expected directory structure.\n\n")
            
        f.write("Usage:\n")
        f.write("1. Unzip this archive.\n")
        f.write("2. Run training using the ABSOLUTE path to data.yaml:\n")
        f.write("   yolo train data=$(pwd)/data.yaml model=yolo11n.pt epochs=10\n\n")
        
        if image_path and image_path.startswith('~'):
            f.write("WARNING: You used '~' in your image path.\n")
            f.write("Symlinks might not resolve '~' to your home directory automatically.\n")
            f.write("If images are not found, try using the full absolute path (e.g., /Users/name/...)\n")

    # Create output directory next to the CSV file
    output_dir = os.path.splitext(path)[0] + '_yolo_output'
    
    # Move temp_dir contents to output_dir
    shutil.move(temp_dir, output_dir)
