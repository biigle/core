<?php

namespace Dias\Http\Controllers\Api;

use Dias\Image;
use Dias\Shape;
use Dias\Label;
use Dias\Annotation;

class ImageAnnotationController extends Controller
{
    /**
     * Shows a list of all annotations of the specified image.
     *
     * @api {get} images/:id/annotations Get all annotations
     * @apiGroup Images
     * @apiName IndexImageAnnotations
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The image ID.
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "created_at": "2015-02-18 11:45:00",
     *       "id": 1,
     *       "image_id": 1,
     *       "shape_id": 1,
     *       "updated_at": "2015-02-18 11:45:00",
     *       "points": [
     *          {"x": 100, "y": 200}
     *       ]
     *    }
     * ]
     *
     * @param int $id image id
     * @return \Illuminate\Http\Response
     */
    public function index($id)
    {
        $image = Image::findOrFail($id);
        $this->requireCanSee($image);

        return $image->annotations()->with(['points' => function ($query) {
            $query->orderBy('index', 'asc');
        }])->get();
    }

    /**
     * Creates a new annotation in the specified image.
     *
     * @api {post} images/:id/annotations Create a new annotation
     * @apiGroup Annotations
     * @apiName StoreImageAnnotations
     * @apiPermission projectEditor
     *
     * @apiParam {Number} id The image ID.
     *
     * @apiParam (Required arguments) {Number} shape_id ID of the shape of the new annotation.
     * @apiParam (Required arguments) {Number} label_id ID of the initial category label of the new annotation.
     * @apiParam (Required arguments) {Number} confidence Confidence of the initial annotation label of the new annotation.
     * @apiParam (Required arguments) {Obejct[]} points Array (JSON or as String) of the initial points of the annotation. Must contain at least one point.
     *
     * @apiParamExample {JSON} Request example (JSON):
     * {
     *    "shape_id": 1,
     *    "label_id": 1,
     *    "confidence": 0.75,
     *    "points": [
     *       {"x": 10, "y": 11},
     *       {"x": 20, "y": 21}
     *    ]
     * }
     *
     * @apiParamExample {String} Request example (String):
     * shape_id: 1
     * label_id: 1
     * confidence: 0.75
     * points: '[{"x":10,"y":11},{"x":20,"y":21}]'
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "created_at": "2015-02-18 11:45:00",
     *    "id": 1,
     *    "image_id": 1,
     *    "shape_id": 1,
     *    "updated_at": "2015-02-18 11:45:00",
     *    "points": [
     *       {"x": 100, "y": 200}
     *    ]
     * }
     *
     * @param int $id image ID
     * @return Annotation
     */
    public function store($id)
    {
        $image = Image::findOrFail($id);
        $this->requireCanEdit($image);

        $this->validate($this->request, Image::$createAnnotationRules);
        $this->validate($this->request, Annotation::$attachLabelRules);

        $shape = Shape::find($this->request->input('shape_id'));

        // from a JSON request, the array may already be decoded
        $points = $this->request->input('points');

        if (is_string($points)) {
            $points = json_decode($points);
        }

        if (empty($points)) {
            abort(400, 'Annotation must be initialized with at least one point.');
        }

        $annotation = new Annotation;
        $annotation->shape()->associate($shape);
        $annotation->image()->associate($image);
        $annotation->save();

        $annotation->addPoints($points);
        $annotation->addLabel(
            $this->request->input('label_id'),
            $this->request->input('confidence'),
            $this->user
        );

        return Annotation::with(['points' => function ($query) {
            $query->orderBy('index', 'asc');
        }])->find($annotation->id);
    }
}
