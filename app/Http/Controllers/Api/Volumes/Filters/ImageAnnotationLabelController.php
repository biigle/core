<?php

namespace Biigle\Http\Controllers\Api\Volumes\Filters;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\ImageAnnotation;
use Biigle\Volume;
use Illuminate\Http\Request;

class ImageAnnotationLabelController extends Controller
{
    /**
     * List the IDs of images having one or more annotations with the specified label.
     *
     * @api {get} volumes/:tid/images/filter/annotation-label/:lid Get images with a label
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
     * @param Request $request
     * @param  int  $tid
     * @param  int  $lid
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request, $tid, $lid)
    {
        $volume = Volume::findOrFail($tid);
        $this->authorize('access', $volume);

        $session = $volume->getActiveAnnotationSession($request->user());

        if ($session) {
            $query = ImageAnnotation::allowedBySession($session, $request->user());
        } else {
            $query = ImageAnnotation::getQuery();
        }

        return $query->join('image_annotation_labels', 'image_annotations.id', '=', 'image_annotation_labels.annotation_id')
                ->where('image_annotation_labels.label_id', $lid)
                ->join('images', 'image_annotations.image_id', '=', 'images.id')
                ->where('images.volume_id', $tid)
                ->groupBy('images.id')
                ->pluck('images.id');
    }
}
