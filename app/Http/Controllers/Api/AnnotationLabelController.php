<?php

namespace Dias\Http\Controllers\Api;

use Dias\Annotation;
use Dias\Label;
use Dias\AnnotationLabel;
use Illuminate\Database\QueryException;

class AnnotationLabelController extends Controller
{
    /**
     * Shows all labels of the specified annotation.
     *
     * @api {get} annotations/:id/labels Get all labels
     * @apiGroup Annotations
     * @apiName IndexAnnotationLabels
     * @apiPermission projectMember
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
     * @param int $id Annotation ID
     * @return \Illuminate\Http\Response
     */
    public function store($id)
    {
        $this->validate($this->request, Annotation::$attachLabelRules);
        $annotation = Annotation::findOrFail($id);
        $label = Label::findOrFail($this->request->input('label_id'));
        $this->authorize('attach-label', [$annotation, $label]);

        try {
            $annotationLabel = new AnnotationLabel;
            $annotationLabel->confidence = $this->request->input('confidence');
            $annotationLabel->user()->associate($this->user);
            $annotationLabel->label()->associate($label);
            $annotationLabel->annotation()->associate($annotation);
            $annotationLabel->save();
        } catch (QueryException $e) {
            abort(400, 'The user already attached this label to the annotation.');
        }

        // should not be returned
        unset($annotationLabel->annotation);

        return response($annotationLabel, 201);
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
     * @param int  $id
     */
    public function update($id)
    {
        $annotationLabel = AnnotationLabel::findOrFail($id);
        $this->authorize('update', $annotationLabel);

        $annotationLabel->confidence = $this->request->input(
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
     *
     * @apiParam {Number} id The annotation **label** ID (not the annotation ID).
     *
     * @param int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $annotationLabel = AnnotationLabel::findOrFail($id);
        $this->authorize('destroy', $annotationLabel);

        $annotationLabel->delete();

        return response('Deleted.', 200);
    }
}
