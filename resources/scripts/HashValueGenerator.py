from PIL import Image
import imagehash
import numpy as np
import sys
import io

HASHSIZE = 64

def createHashValue(img):
    createdHash = imagehash.average_hash(img, hash_size=HASHSIZE)
    return createdHash


with Image.open(io.BytesIO(sys.argv[1]))as img:
    createdHash = createHashValue(img)
    print(createdHash)


