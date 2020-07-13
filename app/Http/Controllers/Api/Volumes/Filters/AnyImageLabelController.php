<?php

namespace Biigle\Http\Controllers\Api\Volumes\Filters;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Volume;

class AnyImageLabelController extends Controller
{
    /**
     * List the IDs of images having one or more image labels attached.
     *
     * @api {get} volumes/:id/images/filter/labels Get images with image labels
     * @apiGroup Volumes
     * @apiName VolumeImagesHasImageLabels
     * @apiPermission projectMember
     * @apiDescription Returns IDs of images having one or more image labels
     *
     * @apiParam {Number} id The volume ID
     *
     * @apiSuccessExample {json} Success response:
     * [1, 5, 6]
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function index($id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);

        return $volume->images()->has('labels')->pluck('id');
    }
}
