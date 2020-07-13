<?php

namespace Biigle\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Volume;

class ImageFilenamesController extends Controller
{
    /**
     * Get all image filenames of a volume.
     *
     * @api {get} volumes/:id/filenames Get image file names
     * @apiGroup Volumes
     * @apiName VolumeIndexImageFilenames
     * @apiPermission projectMember
     * @apiDescription Returns a map of image IDs to their file names.
     *
     * @apiParam {Number} id The volume ID
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "123": "image.jpg",
     *    "321": "other-image.jpg"
     * }
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function index($id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);

        return $volume->images()->pluck('filename', 'id');
    }
}
