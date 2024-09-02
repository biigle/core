<?php

namespace Biigle\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Volume;

class FilenamesController extends Controller
{
    /**
     * Get all filenames of a volume.
     *
     * @api {get} volumes/:id/filenames Get file names
     * @apiGroup Volumes
     * @apiName VolumeIndexFilenames
     * @apiPermission projectMember
     * @apiDescription Returns a map of image/video IDs to their file names.
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
     * @return \Illuminate\Support\Collection
     */
    public function index($id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);

        return $volume->files()->pluck('filename', 'id');
    }
}
