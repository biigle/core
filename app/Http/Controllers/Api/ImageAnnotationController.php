<?php

namespace Biigle\Http\Controllers\Api;

use Exception;
use Biigle\Image;
use Biigle\Shape;
use Biigle\Label;
use Biigle\Annotation;
use Biigle\AnnotationLabel;
use Illuminate\Http\Request;
use Illuminate\Contracts\Auth\Guard;

class ImageAnnotationController extends Controller
{
    /**
     * Shows a list of all annotations of the specified image.
     *
     * @api {get} images/:id/annotations Get all annotations
     * @apiGroup Images
     * @apiName IndexImageAnnotations
     * @apiPermission projectMember
     * @apiDescription If there is an active annotation session for the transect of this image, only those annotations will be returned that the user is allowed to access.
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
     *       "points": [100, 200],
     *       "labels": [
     *          {
     *             "confidence": 1,
     *             "id": 1,
     *             "label": {
     *                "color": "bada55",
     *                "id": 3,
     *                "name": "My label",
     *                "parent_id": null,
     *                "project_id": null
     *             },
     *             "user": {
     *                "id": 4,
     *                "firstname": "Graham",
     *                "lastname": "Hahn",
     *                "role_id": 2
     *             }
     *          }
     *       ]
     *    }
     * ]
     *
     * @param int $id image id
     * @param Guard $auth
     * @return \Illuminate\Http\Response
     */
    public function index($id, Guard $auth)
    {
        $image = Image::findOrFail($id);
        $this->authorize('access', $image);
        $user = $auth->user();
        $session = $image->transect->getActiveAnnotationSession($user);

        if ($session) {
            return $session->getImageAnnotations($image, $user);
        }

        return $image->annotations()->with('labels')->get();
    }

    /**
     * Creates a new annotation in the specified image.
     *
     * @api {post} images/:id/annotations Create a new annotation
     * @apiGroup Annotations
     * @apiName StoreImageAnnotations
     * @apiPermission projectEditor
     * @apiDescription Only labels may be used that belong to a label tree used by one of
     * the projects, the image belongs to.
     *
     * @apiParam {Number} id The image ID.
     *
     * @apiParam (Required arguments) {Number} shape_id ID of the shape of the new annotation.
     * @apiParam (Required arguments) {Number} label_id ID of the initial category label of the new annotation.
     * @apiParam (Required arguments) {Number} confidence Confidence of the initial annotation label of the new annotation. Must be a value between 0 and 1.
     * @apiParam (Required arguments) {Number[]} points Array (JSON or as String) of the initial points of the annotation. Must contain at least one point. The points array is interpreted as alternating x and y coordinates like this `[x1, y1, x2, y2...]`. The interpretation of the points of the different shapes is as follows:
     * **Point:** The first point is the center of the annotation point.
     * **Rectangle:** The first four points are the vertices of the rectangle (in the given order).
     * **Polygon:** Like rectangle with one or more vertices.
     * **LineString:** Like rectangle with one or more vertices.
     * **Circle:** The first point is the center of the circle. The third value of the points array is the radius of the circle. A valid points array of a circle might look like this: `[10, 10, 5]`.
     *
     * @apiParamExample {JSON} Request example (JSON):
     * {
     *    "shape_id": 3,
     *    "label_id": 1,
     *    "confidence": 0.75,
     *    "points": [10, 11, 20, 21]
     * }
     *
     * @apiParamExample {String} Request example (String):
     * shape_id: 3
     * label_id: 1
     * confidence: 0.75
     * points: '[10, 11, 20, 21]'
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "created_at": "2015-02-18 11:45:00",
     *    "id": 1,
     *    "image_id": 1,
     *    "shape_id": 3,
     *    "updated_at": "2015-02-18 11:45:00",
     *    "points": [10, 11, 20, 21],
     *    "labels": [
     *       {
     *          "confidence": 1,
     *          "id": 1,
     *          "label": {
     *             "color": "bada55",
     *             "id": 3,
     *             "name": "My label",
     *             "parent_id": null,
     *             "project_id": null
     *          },
     *          "user": {
     *             "id": 4,
     *             "firstname": "Graham",
     *             "lastname": "Hahn",
     *             "role_id": 2
     *          }
     *       }
     *    ]
     * }
     *
     * @param Request $request
     * @param Guard $auth
     * @param int $id image ID
     * @return Annotation
     */
    public function store(Request $request, Guard $auth, $id)
    {
        $image = Image::findOrFail($id);
        $this->authorize('add-annotation', $image);

        $this->validate($request, Image::$createAnnotationRules);
        $this->validate($request, Annotation::$attachLabelRules);

        // from a JSON request, the array may already be decoded
        $points = $request->input('points');

        if (is_string($points)) {
            $points = json_decode($points);
        }

        $annotation = new Annotation;
        $annotation->shape_id = $request->input('shape_id');
        $annotation->image()->associate($image);

        try {
            $annotation->validatePoints($points);
        } catch (Exception $e) {
            return $this->buildFailedValidationResponse($request, [
                'points' => [$e->getMessage()]
            ]);
        }

        $annotation->points = $points;
        $label = Label::findOrFail($request->input('label_id'));

        $this->authorize('attach-label', [$annotation, $label]);
        $annotation->save();

        $annotationLabel = new AnnotationLabel;
        $annotationLabel->label_id = $label->id;
        $annotationLabel->user_id = $auth->user()->id;
        $annotationLabel->confidence = $request->input('confidence');
        $annotation->labels()->save($annotationLabel);

        $annotation->load('labels');

        return $annotation;
    }
}
