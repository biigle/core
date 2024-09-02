<?php

namespace Biigle\Http\Controllers\Api\Volumes\Filters;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Volume;

class AnyFileLabelController extends Controller
{
    /**
     * List the IDs of images/videos having one or more labels attached.
     *
     * @api {get} volumes/:id/files/filter/labels Get files with image labels
     * @apiGroup Volumes
     * @apiName VolumeFilesHasFileLabels
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The volume ID
     *
     * @apiSuccessExample {json} Success response:
     * [1, 5, 6]
     *
     * @param  int  $id
     * @return \Illuminate\Support\Collection
     */
    public function index($id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);

        return $volume->files()->has('labels')->pluck('id');
    }
}
