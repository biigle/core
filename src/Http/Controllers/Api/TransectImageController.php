<?php

namespace Dias\Modules\Annotations\Http\Controllers\Api;

use DB;
use Dias\Image;
use Dias\Transect;
use Dias\Annotation;
use Illuminate\Contracts\Auth\Guard;
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
        $this->authorize('access', $transect);

        return $transect->images()->has('annotations')->pluck('id');
    }

    /**
     * List the IDs of images having one or more annotations of the specified user.
     *
     * @api {get} transects/:tid/images/filter/annotation-user/:uid Get all images having annotations of a user
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
     * @param Guard $auth
     * @param  int  $tid
     * @param  int  $uid
     * @return \Illuminate\Http\Response
     */
    public function hasAnnotationUser(Guard $auth, $tid, $uid)
    {
        $transect = Transect::findOrFail($tid);
        $this->authorize('access', $transect);

        $session = $transect->activeAnnotationSession;

        if ($session) {
            $query = Annotation::allowedBySession($session, $auth->user());
        } else {
            $query = Annotation::getQuery();
        }

        return $query->join('annotation_labels', 'annotations.id', '=', 'annotation_labels.annotation_id')
                ->where('annotation_labels.user_id', $uid)
                ->join('images', 'annotations.image_id', '=', 'images.id')
                ->where('images.transect_id', $tid)
                ->groupBy('images.id')
                ->pluck('images.id');
    }

    /**
     * List the IDs of images having one or more annotations with the specified label.
     *
     * @api {get} transects/:tid/images/filter/annotation-label/:lid Get all images having annotations with a certain label
     * @apiGroup Transects
     * @apiName TransectImagesHasLabel
     * @apiPermission projectMember
     * @apiDescription Returns IDs of images having one or more annotations with the specified label.
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
    public function hasAnnotationLabel($tid, $lid)
    {
        $transect = Transect::findOrFail($tid);
        $this->authorize('access', $transect);

        return Image::where('transect_id', $tid)
            ->whereExists(function ($query) use ($lid) {
                $query->select(DB::raw(1))
                      ->from('annotations')
                      ->join('annotation_labels', 'annotations.id', '=', 'annotation_labels.annotation_id')
                      ->where('annotation_labels.label_id', $lid)
                      ->whereRaw('annotations.image_id = images.id');
            })
            ->pluck('id');
    }
}
