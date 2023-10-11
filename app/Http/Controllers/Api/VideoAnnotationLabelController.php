<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Requests\DestroyVideoAnnotationLabel;
use Biigle\Http\Requests\StoreVideoAnnotationLabel;
use Biigle\VideoAnnotationLabel;
use Illuminate\Database\QueryException;
use Str;

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

        $annotationLabel = new VideoAnnotationLabel;
        $annotationLabel->user()->associate($request->user());
        $annotationLabel->label()->associate($request->label);
        $annotationLabel->annotation()->associate($request->annotation);

        $exists = VideoAnnotationLabel::where('user_id', $annotationLabel->user_id)
            ->where('label_id', $annotationLabel->label_id)
            ->where('annotation_id', $annotationLabel->annotation_id)
            ->exists();

        if ($exists) {
            abort(400, 'The user already attached this label to the annotation.');
        }

        try {
            $annotationLabel->save();
            // should not be returned
            unset($annotationLabel->annotation);

            return response($annotationLabel, 201);
        } catch (QueryException $e) {
            // Although we check for existence above, this error happened some time.
            // I suspect some kind of race condition between PHP FPM workers.
            if (!Str::contains($e->getMessage(), 'Unique violation')) {
                throw $e;
            }
        }
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
