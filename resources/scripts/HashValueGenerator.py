from PIL import Image
import imagehash
import numpy as np
import sys
import io
import json


HASHSIZE = 64

def createHashValue(img):
    createdHash = imagehash.average_hash(img, hash_size=HASHSIZE)
    return createdHash


with open(sys.argv[1])) as inputJson:
    image_data = json.load(inputJson)

id = image_data['image_id']
imageBytes = image_data['image_as_byte_string']

with Image.open(io.BytesIO(imageBytes))as img:
    createdHash = createHashValue(img)

returnData = {
    'id': id,
    'hash': createdHash
}

with open(sys.argv[2], 'w') as f:
    json.dump(returnData, f)

