<?php

namespace Biigle\Modules\Volumes\Http\Controllers\Api\VolumeFilters;

use Biigle\Volume;
use Biigle\Http\Controllers\Api\Controller;

class ImageLabelController extends Controller
{
    /**
     * List the IDs of images having the specified label attached.
     *
     * @api {get} volumes/:vid/images/filter/image-label/:lid Get images with a label
     * @apiGroup Volumes
     * @apiName VolumeImagesHasImageLabel
     * @apiPermission projectMember
     * @apiDescription Returns IDs of images having the specified label attached to them.
     *
     * @apiParam {Number} vid The volume ID
     * @apiParam {Number} lid The label ID
     *
     * @apiSuccessExample {json} Success response:
     * [1, 5, 6]
     *
     * @param  int  $vid
     * @param  int  $lid
     * @return \Illuminate\Http\Response
     */
    public function index($vid, $lid)
    {
        $volume = Volume::findOrFail($vid);
        $this->authorize('access', $volume);

        return $volume->images()
            ->join('image_labels', 'images.id', '=', 'image_labels.image_id')
            ->where('image_labels.label_id', $lid)
            ->distinct()
            ->pluck('images.id');
    }
}
