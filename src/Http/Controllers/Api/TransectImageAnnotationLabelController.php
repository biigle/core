<?php

namespace Biigle\Modules\Transects\Http\Controllers\Api;

use Biigle\Transect;
use Biigle\Annotation;
use Illuminate\Contracts\Auth\Guard;
use Biigle\Http\Controllers\Api\Controller;

class TransectImageAnnotationLabelController extends Controller
{
    /**
     * List the IDs of images having one or more annotations with the specified label.
     *
     * @api {get} transects/:tid/images/filter/annotation-label/:lid Get all images having annotations with a certain label
     * @apiGroup Transects
     * @apiName TransectImagesHasLabel
     * @apiPermission projectMember
     * @apiDescription Returns IDs of images having one or more annotations with the specified label. If there is an active annotation session, images with annotations hidden by the session are not returned.
     *
     * @apiParam {Number} tid The transect ID
     * @apiParam {Number} lid The label ID
     *
     * @apiSuccessExample {json} Success response:
     * [1, 5, 6]
     *
     * @param Guard $auth
     * @param  int  $tid
     * @param  int  $lid
     * @return \Illuminate\Http\Response
     */
    public function index(Guard $auth, $tid, $lid)
    {
        $transect = Transect::findOrFail($tid);
        $this->authorize('access', $transect);

        $user = $auth->user();
        $session = $transect->getActiveAnnotationSession($user);

        if ($session) {
            $query = Annotation::allowedBySession($session, $user);
        } else {
            $query = Annotation::getQuery();
        }

        return $query->join('annotation_labels', 'annotations.id', '=', 'annotation_labels.annotation_id')
                ->where('annotation_labels.label_id', $lid)
                ->join('images', 'annotations.image_id', '=', 'images.id')
                ->where('images.transect_id', $tid)
                ->groupBy('images.id')
                ->pluck('images.id');
    }
}
