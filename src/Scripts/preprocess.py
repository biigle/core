import matplotlib.image as mpimg
import csv
import collections
import sys
import numpy as np
import scipy.misc
import sklearn.cluster
import os
import ast


csvfile = sys.argv[1]
transect = sys.argv[2]
storage_path = sys.argv[3]

TRANSECT_PATH = storage_path + "/ate/"
PATCHES_PATH = storage_path + "/ate/" + str(transect) + "/"

if not os.path.isdir(PATCHES_PATH):
    os.makedirs(PATCHES_PATH)

npfile = None
dictfile = None

if os.path.isfile(TRANSECT_PATH + transect + ".npy"):
    f = open(TRANSECT_PATH + transect + ".npy")
    npfile = np.load(f)
    dictfile = np.load(f)
    f.close()

f = open(csvfile)
csvr = csv.reader(f)

img2points = collections.defaultdict(list)

for row in csvr:
    img2points[row[1]].append([row[2], row[0]])

newpatches = []
patchid2annotationid = dict()
curnum = npfile.shape[0] if npfile else 0

for i in img2points:
    img = mpimg.imread(i)
    for points in img2points[i]:
        npoints = np.array(ast.literal_eval(points[0]))
        radius = 0
        # if point marker
        if len(points) == 2:
            radius = 64
            xmin = npoints[0] - radius
            ymin = npoints[1] - radius
            xmax = npoints[0] + radius
            ymax = npoints[1] + radius
        # if circle
        elif len(points) == 3:
            radius = npoints[3]
            xmin = npoints[0] - radius
            ymin = npoints[1] - radius
            xmax = npoints[0] + radius
            ymax = npoints[1] + radius
        else:
            xmin = np.min(npoints[::2])
            ymin = np.min(npoints[1::2])
            xmax = np.max(npoints[::2])
            ymax = np.max(npoints[1::2])
        patch = img[ymin:ymax, xmin:xmax]
        mpimg.imsave(PATCHES_PATH + str(points[1]) + ".png", patch)
        patch64 = scipy.misc.imresize(patch, (64, 64))
        if points[1] in patchid2annotationid.values():
            # get index of points
            key = [key for key, value in dictfile.items() if value == 'value'][0]
            npfile[key] = patch64
        else:
            newpatches.append(patch64)
            patchid2annotationid[curnum] = points[1]
            curnum += 1
npfile = np.vstack((npfile, np.array(newpatches))) if npfile else np.array(newpatches)
if dictfile:
    dictfile.update(patchid2annotationid)
else:
    dictfile = patchid2annotationid
f = open(TRANSECT_PATH + transect + ".npy", 'w')
# km = sklearn.cluster.KMeans()
# km.fit(npfile)
# km.labels_
np.save(f, npfile)
np.save(f, dictfile)
f.close()
