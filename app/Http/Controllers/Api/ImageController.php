<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Image;

class ImageController extends Controller
{
    /**
     * Shows the specified image.
     *
     * @api {get} images/:id Get image information
     * @apiDescription Image information includes a subset of the image EXIF
     * data as well as the volume and the image labels.
     * @apiGroup Images
     * @apiName ShowImages
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The image ID.
     * @apiSuccessExample {json} Success response:
     * {
     *    "id":1,
     *    "width":1000,
     *    "height":750,
     *    "filename":"IMG_3275.JPG",
     *    "exif":{
     *       "FileName":"IMG_3275.JPG",
     *       "FileDateTime":1411554694,
     *       "FileSize":3014886,
     *       "FileType":2,
     *       "MimeType":"image\/jpeg",
     *       "Make":"Canon",
     *       "Model":"Canon PowerShot G9",
     *       "Orientation":1,
     *       "DateTime":"2014:05:09 00:53:45",
     *       "ExposureTime":"1\/100",
     *       "FNumber":"28\/10",
     *       "ShutterSpeedValue":"213\/32",
     *       "ApertureValue":"95\/32",
     *       "ExposureBiasValue":"0\/3",
     *       "MaxApertureValue":"95\/32",
     *       "MeteringMode":5,
     *       "Flash":9,
     *       "FocalLength":"7400\/1000",
     *       "ExifImageWidth":3264,
     *       "ExifImageLength":2448,
     *       "ImageType":"IMG:PowerShot G9 JPEG"
     *    },
     *    "volume":{
     *       "id":1,
     *       "name":"Test volume",
     *       "media_type_id":2,
     *       "creator_id":1,
     *       "created_at":"2015-05-04 07:34:04",
     *       "updated_at":"2015-05-04 07:34:04",
     *       "url":"\/path\/to\/volume\/1"
     *    },
     *    "labels": [
     *        {
     *            "created_at":"2017-10-12 13:48:36",
     *            "id":1,
     *            "image_id":"1",
     *            "label":{
     *                "color":"0099ff",
     *                "id":1,
     *                "label_source_id":null,
     *                "label_tree_id":1,
     *                "name":"grayson.strosin",
     *                "parent_id":null
     *                ,"source_id":null
     *             },
     *             "label_id":"1",
     *             "updated_at":"2017-10-12 13:48:36",
     *             "user":{
     *                 "firstname":"Lyla",
     *                 "id":3,
     *                 "lastname":"Considine",
     *                 "role_id":2
     *             },
     *             "user_id":"3"
     *        }
     *    ]
     * }
     *
     * @param int $id image id
     * @return Image
     */
    public function show($id)
    {
        $image = Image::with('labels')->findOrFail($id);
        $this->authorize('access', $image);

        $image->setAttribute('exif', $image->getExif());
        $size = $image->getSize();
        $image->setAttribute('width', $size[0]);
        $image->setAttribute('height', $size[1]);

        return $image;
    }

    /**
     * Shows the specified image thumbnail file.
     *
     * @api {get} images/:id/thumb Get a thumbnail image
     * @apiGroup Images
     * @apiName ShowImageThumbs
     * @apiPermission projectMember
     * @apiDescription Responds with a JPG image thumbnail.
     *
     * @apiParam {Number} id The image ID.
     *
     * @param int $id image id
     * @return \Illuminate\Http\Response
     */
    public function showThumb($id)
    {
        $image = Image::findOrFail($id);
        $this->authorize('access', $image);

        return $image->getThumb();
    }

    /**
     * Shows the specified image file.
     *
     * @api {get} images/:id/file Get the original image
     * @apiGroup Images
     * @apiName ShowImageFiles
     * @apiPermission projectMember
     * @apiDescription Responds with the original file.
     *
     * @apiParam {Number} id The image ID.
     *
     * @param int $id image id
     * @return \Illuminate\Http\Response
     */
    public function showFile($id)
    {
        $image = Image::findOrFail($id);
        $this->authorize('access', $image);

        return $image->getFile();
    }

    /**
     * Deletes the image.
     *
     * @api {delete} images/:id Delete an image
     * @apiGroup Images
     * @apiName DestroyImage
     * @apiPermission projectAdmin
     *
     * @apiParam {Number} id The image ID.
     *
     * @param int $id image id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $image = Image::findOrFail($id);
        $this->authorize('destroy', $image);

        $image->delete();
    }
}
