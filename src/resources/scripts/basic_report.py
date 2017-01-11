# -*- coding: utf-8 -*-
from __future__ import unicode_literals
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
# import matplotlib.image as mpimg
import datetime
import sys
import numpy as np
import csv

title = sys.argv[1]
target_file = sys.argv[2]
data_csvs = sys.argv[3:]

def TitleSlide(text):
    fig = plt.figure(figsize=(10, 4))
    plt.subplot2grid((3, 3), (0, 0), colspan=3)
    mid = plt.subplot2grid((3, 3), (0, 0), colspan=3)
    mid.axis('off')
    btleft = plt.subplot2grid((3, 3), (2, 0))
    btleft.axis('off')
    btmid = plt.subplot2grid((3, 3), (2, 1))
    btmid.axis('off')
    btright = plt.subplot2grid((3, 3), (2, 2))
    btright.axis('off')
    mid.text(0.5, 0.5, text, fontsize=15, horizontalalignment='center')
    # btleft.imshow(mpimg.imread('../assets/images/biigle_biigle_logo.png'))
    btmid.text(0.423, 0.5, datetime.date.today(), fontsize=9)
    # btright.imshow(mpimg.imread('../assets/images/logo_en_tr-height72.png'))
    return fig

pdf = PdfPages(target_file)
fig = TitleSlide("BIIGLE basic report for transect\n" + title.decode('UTF-8'))
pdf.savefig(fig)
width = 1.

for path in data_csvs:
    f = open(path, 'r')
    data_csv = csv.reader(f)
    plot_title = data_csv.next()
    rows = np.array(list(data_csv))
    f.close()
    if rows.shape[0] == 0:
        continue
    # rows have the content: label_name, label_color, label_count
    counts = rows[:, 2].astype(int)
    ind = np.arange(rows.shape[0])

    fig, ax = plt.subplots(figsize=(10, 6))
    fig.subplots_adjust(bottom=0.33)

    # '#'-characters to prepend to the hex color codes
    hashes = np.chararray(rows.shape[0])
    hashes[:] = '#'

    ax.bar(ind, counts, width, color=np.core.defchararray.add(hashes, rows[:, 1]), log=counts.max() > 100)

    ax.set_xticks(ind + width / 2)
    ax.set_xticklabels(rows[:, 0], rotation=45, fontsize=8, ha = 'right')
    if plot_title:
        plt.title(plot_title[0].decode('UTF-8'))
    plt.xlim([0, ind.size])
    pdf.savefig()

d = pdf.infodict()
d['Title'] = "BIIGLE basic report for transect " + title.decode('UTF-8')
d['Author'] = 'Biodata Mining Group, Bielefeld University'
d['Subject'] = 'Histogram of label distribution of the transect'
d['Keywords'] = ''
d['CreationDate'] = datetime.datetime.today()
d['ModDate'] = datetime.datetime.today()
pdf.close()
