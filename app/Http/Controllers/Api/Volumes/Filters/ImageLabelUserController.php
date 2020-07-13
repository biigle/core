<?php

namespace Biigle\Http\Controllers\Api\Volumes\Filters;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Volume;

class ImageLabelUserController extends Controller
{
    /**
     * List the IDs of images having one or more image labels attached by the specified user.
     *
     * @api {get} volumes/:vid/images/filter/image-label-user/:uid Get images with image labels by a user
     * @apiGroup Volumes
     * @apiName VolumeImagesHasLabelUser
     * @apiPermission projectMember
     * @apiDescription Returns IDs of images having one or more image labels attached by the specified user.
     *
     * @apiParam {Number} vid The volume ID
     * @apiParam {Number} uid The user ID
     *
     * @apiSuccessExample {json} Success response:
     * [1, 5, 6]
     *
     * @param  int  $vid
     * @param  int  $uid
     * @return \Illuminate\Http\Response
     */
    public function index($vid, $uid)
    {
        $volume = Volume::findOrFail($vid);
        $this->authorize('access', $volume);

        return $volume->images()
            ->join('image_labels', 'images.id', '=', 'image_labels.image_id')
            ->where('image_labels.user_id', $uid)
            ->distinct()
            ->pluck('images.id');
    }
}
