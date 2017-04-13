<?php

namespace Biigle\Modules\Volumes\Http\Controllers\Api;

use DB;
use Biigle\Volume;
use Biigle\Http\Controllers\Api\Controller;

class VolumeImageController extends Controller
{
    /**
     * List the image IDs of the specified volume, ordered by filename.
     *
     * @api {get} volumes/:id/images/order-by/filename Get all images ordered by filename
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
    public function indexOrderByFilename($id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);

        return $volume->orderedImages()
            ->pluck('id');
    }

    /**
     * List the IDs of images having one or more image labels attached.
     *
     * @api {get} volumes/:id/images/filter/labels Get all images having image labels
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
    public function hasLabel($id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);

        return $volume->images()->has('labels')->pluck('id');
    }

    /**
     * List the IDs of images having one or more image labels attached by the specified user.
     *
     * @api {get} volumes/:tid/images/filter/image-label-user/:uid Get all images having image labels attached by a user
     * @apiGroup Volumes
     * @apiName VolumeImagesHasLabelUser
     * @apiPermission projectMember
     * @apiDescription Returns IDs of images having one or more image labels attached by the specified user.
     *
     * @apiParam {Number} tid The volume ID
     * @apiParam {Number} uid The user ID
     *
     * @apiSuccessExample {json} Success response:
     * [1, 5, 6]
     *
     * @param  int  $tid
     * @param  int  $uid
     * @return \Illuminate\Http\Response
     */
    public function hasImageLabelUser($tid, $uid)
    {
        $volume = Volume::findOrFail($tid);
        $this->authorize('access', $volume);

        return DB::table('images')
            ->where('volume_id', $tid)
            ->whereExists(function ($query) use ($uid) {
                $query->select(DB::raw(1))
                      ->from('image_labels')
                      ->where('image_labels.user_id', $uid)
                      ->whereRaw('image_labels.image_id = images.id');
            })
            ->pluck('id');
    }

    /**
     * List the IDs of images having the specified label attached.
     *
     * @api {get} volumes/:tid/images/filter/image-label/:lid Get all images having a certain label
     * @apiGroup Volumes
     * @apiName VolumeImagesHasImageLabel
     * @apiPermission projectMember
     * @apiDescription Returns IDs of images having the specified label attached to them.
     *
     * @apiParam {Number} tid The volume ID
     * @apiParam {Number} lid The label ID
     *
     * @apiSuccessExample {json} Success response:
     * [1, 5, 6]
     *
     * @param  int  $tid
     * @param  int  $lid
     * @return \Illuminate\Http\Response
     */
    public function hasImageLabel($tid, $lid)
    {
        $volume = Volume::findOrFail($tid);
        $this->authorize('access', $volume);

        return DB::table('images')
            ->where('volume_id', $tid)
            ->whereExists(function ($query) use ($lid) {
                $query->select(DB::raw(1))
                      ->from('image_labels')
                      ->where('image_labels.label_id', $lid)
                      ->whereRaw('image_labels.image_id = images.id');
            })
            ->pluck('id');
    }
}
