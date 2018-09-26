<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Label;
use Biigle\Annotation;
use Biigle\AnnotationLabel;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;
use Biigle\Http\Requests\StoreAnnotationLabel;

class AnnotationLabelController extends Controller
{
    /**
     * Shows all labels of the specified annotation.
     *
     * @api {get} annotations/:id/labels Get all labels
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
     *
     * @param int $id Annotation ID
     * @return \Illuminate\Http\Response
     */
    public function index($id)
    {
        $annotation = Annotation::findOrFail($id);
        $this->authorize('access', $annotation);

        return $annotation->labels;
    }

    /**
     * Creates a new label for the specified annotation.
     *
     * @api {post} annotations/:id/labels Attach a label
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
     *
     * @param StoreAnnotationLabel $request
     * @return \Illuminate\Http\Response
     */
    public function store(StoreAnnotationLabel $request)
    {
        $annotationLabel = new AnnotationLabel;
        $annotationLabel->confidence = $request->input('confidence');
        $annotationLabel->user()->associate($request->user());
        $annotationLabel->label()->associate($request->label);
        $annotationLabel->annotation()->associate($request->annotation);

        $exists = AnnotationLabel::where('user_id', $annotationLabel->user_id)
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
            if (!str_contains($e->getMessage(), 'Unique violation')) {
                throw $e;
            }
        }
    }

    /**
     * Updates the attributes of the specified annotation label.
     *
     * @api {put} annotation-labels/:id Update a label
     * @apiGroup Annotations
     * @apiName UpdateAnnotationLabels
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
        $annotationLabel = AnnotationLabel::findOrFail($id);
        $this->authorize('update', $annotationLabel);

        $annotationLabel->confidence = $request->input(
            'confidence',
            $annotationLabel->confidence
        );

        $annotationLabel->save();
    }

    /**
     * Deletes the specified annotation label.
     *
     * @api {delete} annotation-labels/:id Detach a label
     * @apiGroup Annotations
     * @apiName DeleteAnnotationLabels
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
        $annotationLabel = AnnotationLabel::with('annotation')->findOrFail($id);
        $this->authorize('destroy', $annotationLabel);

        $annotationLabel->delete();

        if (!$annotationLabel->annotation->labels()->exists()) {
            $annotationLabel->annotation->delete();
        }

        return response('Deleted.', 200);
    }
}
