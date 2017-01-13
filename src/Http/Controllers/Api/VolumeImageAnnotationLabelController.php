<?php

namespace Biigle\Modules\Volumes\Http\Controllers\Api;

use Biigle\Volume;
use Biigle\Annotation;
use Illuminate\Contracts\Auth\Guard;
use Biigle\Http\Controllers\Api\Controller;

class VolumeImageAnnotationLabelController extends Controller
{
    /**
     * List the IDs of images having one or more annotations with the specified label.
     *
     * @api {get} volumes/:tid/images/filter/annotation-label/:lid Get all images having annotations with a certain label
     * @apiGroup Volumes
     * @apiName VolumeImagesHasLabel
     * @apiPermission projectMember
     * @apiDescription Returns IDs of images having one or more annotations with the specified label. If there is an active annotation session, images with annotations hidden by the session are not returned.
     *
     * @apiParam {Number} tid The volume ID
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
        $volume = Volume::findOrFail($tid);
        $this->authorize('access', $volume);

        $user = $auth->user();
        $session = $volume->getActiveAnnotationSession($user);

        if ($session) {
            $query = Annotation::allowedBySession($session, $user);
        } else {
            $query = Annotation::getQuery();
        }

        return $query->join('annotation_labels', 'annotations.id', '=', 'annotation_labels.annotation_id')
                ->where('annotation_labels.label_id', $lid)
                ->join('images', 'annotations.image_id', '=', 'images.id')
                ->where('images.volume_id', $tid)
                ->groupBy('images.id')
                ->pluck('images.id');
    }
}
