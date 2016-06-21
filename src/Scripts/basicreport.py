import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
import matplotlib.image as mpimg
import datetime
import sys
import collections
import numpy as np
import uuid


prjName = sys.argv[1]
transects = sys.argv[2:]
prefix = "/home/vagrant/dias/storage/"


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
    mid.text(0.404, 0.5, text, fontsize=15)
    # btleft.imshow(mpimg.imread('biigle_dias_logo.png'))
    btmid.text(0.423, 0.5, datetime.date.today(), fontsize=9)
    # btright.imshow(mpimg.imread('logo_en_tr-height72.png'))
    return fig

uid = str(uuid.uuid4())
pdf = PdfPages(prefix + "/" + uid + ".pdf")
fig = TitleSlide("BiigleDias Report")
pdf.savefig(fig)
width = 1.

for transect in transects:
    f = open(transect, 'r')
    species = f.read().split("\n")[:-1]
    f.close()
    if species == []:
        continue
    c = collections.Counter(species)
    sorter = np.argsort(c.keys())
    ind = np.arange(len(c.keys()))
    fig, ax = plt.subplots(figsize=(10, 6))
    fig.subplots_adjust(bottom=0.33)
    ax.bar(ind, np.array(c.values())[sorter], width, color='b')
    if np.array(c.values()).max() > 100:
        ax.set_yscale('log')
    ax.set_xticks(ind + width / 2)
    ax.set_xticklabels(np.array(c.keys())[sorter], rotation='vertical', fontsize=8)
    plt.title(str(transect.split("/")[-1][:-4]))
    plt.xlim([0, len(c.keys())])
    pdf.savefig()
d = pdf.infodict()
d['Title'] = 'BiigleDias Report'
d['Author'] = 'Biodata Mining Group, Bielefeld University'
d['Subject'] = 'Histograms of label distribution in all transects of a project'
d['Keywords'] = ''
d['CreationDate'] = datetime.datetime.today()
d['ModDate'] = datetime.datetime.today()
pdf.close()
print uid + ";" + prefix + "/" + uid + ".pdf"
