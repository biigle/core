from PIL import Image
import imagehash
import numpy as np
import sys
# TODO: Extend requierments with imagehash and Pillow
HASHSIZE = 64

def createHashValue(img):
    createdHash = imagehash.average_hash(img, hash_size=HASHSIZE)
    return createdHash


# TODO: check what input the function could have
with Image.open(sys.argv[1]) as img:
    createdHash = createHashValue(img)


# TODO: Write real return or statement for php
return createdHash
