from sklearn.cluster import AgglomerativeClustering
from scipy.cluster.hierarchy import dendrogram
import numpy as np
import json


#TODO: Extend Requierments

def createDistanceMatrix(hashValues):
    distanceMatrix = np.zeros((len(hashValues),len(hashValues)))
    for i in range(len(hashValues)):
        for j in range(i,len(hashValues)):
            d = hashValues[i] - hashValues [j]
            distanceMatrix[i][j] = d
            distanceMatrix[j][i] = d
    return distanceMatrix

def getSimilarityList(distanceMatrix, hashValueList):

    # Make dendrogram for getting Leaves (From docs)
    def plot_dendrogram(model, **kwargs):
        # Create linkage matrix and then plot the dendrogram
        # create the counts of samples under each node
        counts = np.zeros(model.children_.shape[0])
        n_samples = len(model.labels_)
        for i, merge in enumerate(model.children_):
            current_count = 0
            for child_idx in merge:
                if child_idx < n_samples:
                    current_count += 1  # leaf node
                else:
                    current_count += counts[child_idx - n_samples]
            counts[i] = current_count

        linkage_matrix = np.column_stack([model.children_, model.distances_,
                                          counts]).astype(float)

        # Plot the corresponding dendrogram
        R = dendrogram(linkage_matrix, **kwargs)
        return R

    # Clustering
    model = AgglomerativeClustering(affinity='precomputed', distance_threshold=0, n_clusters=None, linkage='single').fit(distanceMatrix)
    # calculate dendrogram

    R = plot_dendrogram(model, truncate_mode='lastp', p=number_images, no_plot=True)

    similarityIndexList = R['leaves']
    return [hashValueList[x] for x in R['leaves']]

with open(sys.argv[1]) as inputPath:
    #plan that this array hold all hashs per image. Is List.
    hashValueImages = json.load(inputPath)

distanceMatrix = createDistanceMatrix(hashValueImages)
# List that hold the Similarity index for each image, same order of images as input imageHashList
similarityIndexList = plot_dendrogram(distanceMatrix)



with open(sys.argv[2], 'w') as outputPath:
    json.dump(similarityIndexList, outputPath)
