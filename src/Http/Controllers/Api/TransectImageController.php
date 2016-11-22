<?php

namespace Dias\Modules\Transects\Http\Controllers\Api;

use DB;
use Dias\Transect;
use Dias\Http\Controllers\Api\Controller;

class TransectImageController extends Controller
{
    /**
     * List the image IDs of the specified transect, ordered by filename
     *
     * @api {get} transects/:id/images/order-by/filename Get all images ordered by filename
     * @apiGroup Transects
     * @apiName IndexTransectImagesOrderByFilename
     * @apiPermission projectMember
     * @apiDescription Returns a list of all image IDs of the transect, ordered by image filenames
     *
     * @apiParam {Number} id The transect ID.
     *
     * @apiSuccessExample {json} Success response:
     * [1, 4, 3, 2, 6, 5]
     *
     * @param  int  $id
     *
     * @return \Illuminate\Http\Response
     */
    public function indexOrderByFilename($id) {
        $transect = Transect::findOrFail($id);
        $this->authorize('access', $transect);

        return $transect->orderedImages()
            ->pluck('id');
    }

    /**
     * List the IDs of images having one or more image labels attached
     *
     * @api {get} transects/:id/images/filter/labels Get all images having image labels
     * @apiGroup Transects
     * @apiName TransectImagesHasImageLabels
     * @apiPermission projectMember
     * @apiDescription Returns IDs of images having one or more image labels
     *
     * @apiParam {Number} id The transect ID
     *
     * @apiSuccessExample {json} Success response:
     * [1, 5, 6]
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function hasLabel($id)
    {
        $transect = Transect::findOrFail($id);
        $this->authorize('access', $transect);

        return $transect->images()->has('labels')->pluck('id');
    }

    /**
     * List the IDs of images having one or more image labels attached by the specified user.
     *
     * @api {get} transects/:tid/images/filter/image-label-user/:uid Get all images having image labels attached by a user
     * @apiGroup Transects
     * @apiName TransectImagesHasLabelUser
     * @apiPermission projectMember
     * @apiDescription Returns IDs of images having one or more image labels attached by the specified user.
     *
     * @apiParam {Number} tid The transect ID
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
        $transect = Transect::findOrFail($tid);
        $this->authorize('access', $transect);

        return DB::table('images')
            ->where('transect_id', $tid)
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
     * @api {get} transects/:tid/images/filter/image-label/:lid Get all images having a certain label
     * @apiGroup Transects
     * @apiName TransectImagesHasImageLabel
     * @apiPermission projectMember
     * @apiDescription Returns IDs of images having the specified label attached to them.
     *
     * @apiParam {Number} tid The transect ID
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
        $transect = Transect::findOrFail($tid);
        $this->authorize('access', $transect);

        return DB::table('images')
            ->where('transect_id', $tid)
            ->whereExists(function ($query) use ($lid) {
                $query->select(DB::raw(1))
                      ->from('image_labels')
                      ->where('image_labels.label_id', $lid)
                      ->whereRaw('image_labels.image_id = images.id');
            })
            ->pluck('id');
    }
}
