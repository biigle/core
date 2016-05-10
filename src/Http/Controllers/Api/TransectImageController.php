<?php

namespace Dias\Modules\Annotations\Http\Controllers\Api;

use Dias\Transect;
use Dias\Http\Controllers\Api\Controller;

class TransectImageController extends Controller
{
    /**
     * List the IDs of images having one or more annotations
     *
     * @api {get} transects/:id/images/filter/annotations Get all images having annotations
     * @apiGroup Transects
     * @apiName TransectImagesHasAnnotation
     * @apiPermission projectMember
     * @apiDescription Returns IDs of images having one or more annotations
     *
     * @apiParam {Number} id The transect ID
     *
     * @apiSuccessExample {json} Success response:
     * [1, 5, 6]
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function hasAnnotation($id)
    {
        $transect = Transect::findOrFail($id);
        $this->requireCanSee($transect);

        return $transect->images()->has('annotations')->pluck('id');
    }

    /**
     * List the IDs of images having one or more annotations of the specified user.
     *
     * @api {get} transects/:tid/images/filter/user/:uid Get all images having annotations of a user
     * @apiGroup Transects
     * @apiName TransectImagesHasUser
     * @apiPermission projectMember
     * @apiDescription Returns IDs of images having one or more annotations of the specified user.
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
    public function hasUser($tid, $uid)
    {
        $transect = Transect::findOrFail($tid);
        $this->requireCanSee($transect);

        return $transect->images()
            ->join('annotations', 'images.id', '=', 'annotations.image_id')
            ->join('annotation_labels', 'annotations.id', '=', 'annotation_labels.annotation_id')
            ->where('annotation_labels.user_id', $uid)
            ->pluck('images.id');
    }
}
