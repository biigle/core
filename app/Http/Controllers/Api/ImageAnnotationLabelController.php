<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Events\AnnotationLabelAttached;
use Biigle\Http\Requests\StoreImageAnnotationLabel;
use Biigle\ImageAnnotation;
use Biigle\ImageAnnotationLabel;
use Biigle\Label;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Str;

class ImageAnnotationLabelController extends Controller
{
    /**
     * @api {get} annotations/:id/labels Get all labels
     * @apiDeprecated use now (#ImageAnnotations:IndexImageAnnotationLabels).
     * @apiGroup Annotations
     * @apiName IndexAnnotationLabels
     * @apiPermission projectMember
     * @apiDescription Access may be denied by an active annotation session of the volume, the annotation belongs to.
     *
     * @apiParam {Number} id The annotation ID.
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "confidence": 0.5,
     *       "label": {
     *          "id": 2,
     *          "name": "Coral",
     *          "parent_id": 1,
     *          "color": "0099ff"
     *       },
     *       "user": {
     *          "id": 1,
     *          "role_id": 2,
     *          "firstname": "Joe",
     *          "lastname": "User"
     *       }
     *    }
     * ]
     */

    /**
     * Shows all labels of the specified annotation.
     *
     * @api {get} image-annotations/:id/labels Get all labels
     * @apiGroup ImageAnnotations
     * @apiName IndexImageAnnotationLabels
     * @apiPermission projectMember
     * @apiDescription Access may be denied by an active annotation session of the volume, the annotation belongs to.
     *
     * @apiParam {Number} id The annotation ID.
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "confidence": 0.5,
     *       "label": {
     *          "id": 2,
     *          "name": "Coral",
     *          "parent_id": 1,
     *          "color": "0099ff"
     *       },
     *       "user": {
     *          "id": 1,
     *          "firstname": "Joe",
     *          "lastname": "User"
     *       }
     *    }
     * ]
     *
     * @param int $id ImageAnnotation ID
     * @return \Illuminate\Database\Eloquent\Collection<int, AnnotationLabel>
     */
    public function index($id)
    {
        $annotation = ImageAnnotation::findOrFail($id);
        $this->authorize('access', $annotation);

        $load = [
            // Hide label_source_id and source_id.
            'label:id,name,parent_id,color,label_tree_id',
            // Hide role_id.
            'user:id,firstname,lastname',
        ];

        return $annotation->labels()->with($load)->get();
    }

    /**
     * @api {post} annotations/:id/labels Attach a label
     * @apiDeprecated use now (#ImageAnnotations:StoreImageAnnotationLabels).
     * @apiGroup Annotations
     * @apiName StoreAnnotationLabels
     * @apiPermission projectEditor
     * @apiDescription Only labels may be used that belong to a label tree used by one of
     * the projects, the annotation belongs to.
     *
     * @apiParam {Number} id The annotation ID.
     * @apiParam (Required arguments) {Number} label_id The ID of the label category to attach to the annotation.
     * @apiParam (Required arguments) {Number} confidence The level of confidence for this annotation label.
     * @apiParamExample {String} Request example:
     * label_id: 1
     * confidence: 0.75
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 1,
     *    "confidence": 0.5,
     *    "label": {
     *       "id": 2,
     *       "name": "Coral",
     *       "parent_id": 1,
     *       "color": "0099ff",
     *       "label_tree_id": 1
     *    },
     *    "user": {
     *       "id": 1,
     *       "role_id": 2,
     *       "firstname": "Joe",
     *       "lastname": "User"
     *    }
     * }
     */

    /**
     * Creates a new label for the specified annotation.
     *
     * @api {post} image-annotations/:id/labels Attach a label
     * @apiGroup ImageAnnotations
     * @apiName StoreImageAnnotationLabels
     * @apiPermission projectEditor
     * @apiDescription Only labels may be used that belong to a label tree used by one of
     * the projects, the annotation belongs to.
     *
     * @apiParam {Number} id The annotation ID.
     * @apiParam (Required arguments) {Number} label_id The ID of the label category to attach to the annotation.
     * @apiParam (Required arguments) {Number} confidence The level of confidence for this annotation label.
     * @apiParamExample {String} Request example:
     * label_id: 1
     * confidence: 0.75
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 1,
     *    "confidence": 0.5,
     *    "label": {
     *       "id": 2,
     *       "name": "Coral",
     *       "parent_id": 1,
     *       "color": "0099ff",
     *       "label_tree_id": 1
     *    },
     *    "user": {
     *       "id": 1,
     *       "role_id": 2,
     *       "firstname": "Joe",
     *       "lastname": "User"
     *    }
     * }
     *
     * @param StoreImageAnnotationLabel $request
     * @return ImageAnnotationLabel|void
     */
    public function store(StoreImageAnnotationLabel $request)
    {
        $annotationLabel = new ImageAnnotationLabel;
        $annotationLabel->confidence = $request->input('confidence');
        $annotationLabel->user()->associate($request->user());
        $annotationLabel->label()->associate($request->label);
        $annotationLabel->annotation()->associate($request->annotation);

        $exists = ImageAnnotationLabel::where('user_id', $annotationLabel->user_id)
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

            AnnotationLabelAttached::dispatch($annotationLabel);

            return $annotationLabel;
        } catch (QueryException $e) {
            // Although we check for existence above, this error happened some time.
            // I suspect some kind of race condition between PHP FPM workers.
            if (!Str::contains($e->getMessage(), 'Unique violation')) {
                throw $e;
            }
        }
    }

    /**
     * @api {put} annotation-labels/:id Update a label
     * @apiDeprecated use now (#ImageAnnotations:UpdateImageAnnotationLabels).
     * @apiGroup Annotations
     * @apiName UpdateAnnotationLabels
     * @apiPermission projectEditor
     *
     * @apiParam {Number} id The annotation **label** ID (not the annotation ID).
     * @apiParam (Attributes that can be updated) {Number} confidence The level of confidence for this annotation label.
     * @apiParamExample {String} Request example:
     * confidence: 0.75
     */

    /**
     * Updates the attributes of the specified annotation label.
     *
     * @api {put} image-annotation-labels/:id Update a label
     * @apiGroup ImageAnnotations
     * @apiName UpdateImageAnnotationLabels
     * @apiPermission projectEditor
     *
     * @apiParam {Number} id The annotation **label** ID (not the annotation ID).
     * @apiParam (Attributes that can be updated) {Number} confidence The level of confidence for this annotation label.
     * @apiParamExample {String} Request example:
     * confidence: 0.75
     *
     * @param Request $request
     * @param int  $id
     */
    public function update(Request $request, $id)
    {
        $annotationLabel = ImageAnnotationLabel::findOrFail($id);
        $this->authorize('update', $annotationLabel);

        $annotationLabel->confidence = $request->input(
            'confidence',
            $annotationLabel->confidence
        );

        $annotationLabel->save();
    }

    /**
     * @api {delete} annotation-labels/:id Detach a label
     * @apiDeprecated use now (#ImageAnnotations:DeleteImageAnnotationLabels).
     * @apiGroup Annotations
     * @apiName DeleteAnnotationLabels
     * @apiPermission projectEditor
     * @apiDescription If the detached label is the last label of an annotation, the annotation will be deleted as well!
     *
     * @apiParam {Number} id The annotation **label** ID (not the annotation ID).
     */

    /**
     * Deletes the specified annotation label.
     *
     * @api {delete} image-annotation-labels/:id Detach a label
     * @apiGroup ImageAnnotations
     * @apiName DeleteImageAnnotationLabels
     * @apiPermission projectEditor
     * @apiDescription If the detached label is the last label of an annotation, the annotation will be deleted as well!
     *
     * @apiParam {Number} id The annotation **label** ID (not the annotation ID).
     *
     * @param int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $annotationLabel = ImageAnnotationLabel::with('annotation')->findOrFail($id);
        $this->authorize('destroy', $annotationLabel);

        $annotationLabel->delete();

        if (!$annotationLabel->annotation->labels()->exists()) {
            $annotationLabel->annotation->delete();
        }

        return response('Deleted.', 200);
    }
}
