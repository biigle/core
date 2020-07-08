<?php

namespace Biigle\Http\Controllers\Api\VolumeSorters;

use Biigle\Volume;
use Biigle\Http\Controllers\Api\Controller;

class ImageFilenameController extends Controller
{
    /**
     * List the image IDs of the specified volume, ordered by filename.
     *
     * @api {get} volumes/:id/images/order-by/filename Get images ordered by filename
     * @apiGroup Volumes
     * @apiName IndexVolumeImagesOrderByFilename
     * @apiPermission projectMember
     * @apiDescription Returns a list of all image IDs of the volume, ordered by image filenames
     *
     * @apiParam {Number} id The volume ID.
     *
     * @apiSuccessExample {json} Success response:
     * [1, 4, 3, 2, 6, 5]
     *
     * @param  int  $id
     *
     * @return \Illuminate\Http\Response
     */
    public function index($id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);

        return $volume->orderedImages()
            ->pluck('id');
    }
}
