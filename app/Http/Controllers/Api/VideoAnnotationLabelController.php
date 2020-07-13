<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Http\Requests\DestroyVideoAnnotationLabel;
use Biigle\Http\Requests\StoreVideoAnnotationLabel;
use Biigle\VideoAnnotationLabel;

class VideoAnnotationLabelController extends Controller
{
    /**
     * Attach a label to a video annotation
     *
     * @api {post} video-annotations/:id/labels Attach a label
     * @apiGroup VideoAnnotations
     * @apiName AttachVideoAnnotationLabel
     * @apiPermission projectEditor
     * @apiDescription Only labels may be used that belong to a label tree used by
     * the project to which the video belongs to.
     *
     * @apiParam {Number} id The video annotation ID.
     *
     * @apiParam (Required arguments) {Number} label_id ID of the label to be attached to the annotation.
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 2,
     *    "label": {
     *       "color": "bada55",
     *       "id": 3,
     *       "name": "My label",
     *       "parent_id": null,
     *    },
     *    "user": {
     *       "id": 4,
     *       "firstname": "Graham",
     *       "lastname": "Hahn",
     *    }
     * }
     *
     * @param StoreVideoAnnotationLabel $request
     * @return mixed
     */
    public function store(StoreVideoAnnotationLabel $request)
    {
        return VideoAnnotationLabel::create([
            'label_id' => $request->label->id,
            'user_id' => $request->user()->id,
            'video_annotation_id' => $request->annotation->id,
        ])->load('label', 'user');
    }

    /**
     * Detach a label
     *
     * @api {delete} video-annotation-labels/:id Detach a label
     * @apiGroup VideoAnnotations
     * @apiName DeleteVideoAnnotationLabels
     * @apiPermission projectEditor
     * @apiDescription Only project experts or admins can detach labels of other users. The last label of an annotation cannot be detached.
     *
     * @apiParam {Number} id The **annotation label** ID (not the label ID).
     *
     * @param DestroyVideoAnnotationLabel $request
     * @return mixed
     */
    public function destroy(DestroyVideoAnnotationLabel $request)
    {
        $request->annotationLabel->delete();
    }
}
