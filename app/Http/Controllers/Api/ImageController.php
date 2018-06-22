<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Image;

class ImageController extends Controller
{
    /**
     * Shows the specified image.
     *
     * @api {get} images/:id Get image information
     * @apiGroup Images
     * @apiName ShowImages
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The image ID.
     * @apiSuccessExample {json} Success response:
     * {
     *    "id":1,
     *    "filename":"IMG_3275.JPG",
     *    "volume":{
     *       "id":1,
     *       "name":"Test volume",
     *       "media_type_id":2,
     *       "creator_id":1,
     *       "created_at":"2015-05-04 07:34:04",
     *       "updated_at":"2015-05-04 07:34:04",
     *       "url":"disk:\/\/\/path\/to\/volume\/1"
     *    }
     * }
     *
     * @param int $id image id
     * @return Image
     */
    public function show($id)
    {
        $image = Image::with('volume')->findOrFail($id);
        $this->authorize('access', $image);

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
     * @apiDescription Responds with the original file. If the image is remote, responds with a redirect to the remote location. If the image is tiled, responds with a JSON containing the image `uuid`, `width` and `height`.
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
