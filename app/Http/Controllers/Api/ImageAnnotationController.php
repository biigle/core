<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Requests\StoreImageAnnotation;
use Biigle\Image;
use Biigle\ImageAnnotation;
use Biigle\ImageAnnotationLabel;
use Biigle\Services\LabelBot\LabelBotService;
use DB;
use Exception;
use Generator;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedJsonResponse;

class ImageAnnotationController extends Controller
{
    /**
     * Shows a list of all annotations of the specified image.
     *
     * @api {get} images/:id/annotations Get all annotations
     * @apiGroup Images
     * @apiName IndexImageAnnotations
     * @apiPermission projectMember
     * @apiDescription If there is an active annotation session for the volume of this image, only those annotations will be returned that the user is allowed to access.
     *
     * @apiParam {Number} id The image ID.
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "image_id": 1,
     *       "shape_id": 1,
     *       "created_at": "2015-02-18 11:45:00",
     *       "updated_at": "2015-02-18 11:45:00",
     *       "points": [100, 200],
     *       "labels": [
     *          {
     *             "id": 1,
     *             "annotation_id": 1,
     *             "label_id": 3,
     *             "user_id": 4,
     *             "label": {
     *                "color": "bada55",
     *                "id": 3,
     *                "name": "My label",
     *                "parent_id": null,
     *                "label_tree_id": 1,
     *             },
     *             "user": {
     *                "id": 4,
     *                "firstname": "Graham",
     *                "lastname": "Hahn",
     *             }
     *          }
     *       ]
     *    }
     * ]
     *
     * @param Request $request
     * @param int $id image id
     * @return \Symfony\Component\HttpFoundation\StreamedJsonResponse
     */
    public function index(Request $request, $id)
    {
        $image = Image::findOrFail($id);
        $this->authorize('access', $image);
        $user = $request->user();
        $session = $image->volume->getActiveAnnotationSession($user);

        $load = [
            // Hide confidence.
            'labels:id,annotation_id,label_id,user_id',
            // Hide label_source_id and source_id.
            'labels.label:id,name,parent_id,color,label_tree_id',
            // Hide role_id.
            'labels.user:id,firstname,lastname',
        ];

        // Prevent exceeding memory limit by using generator and stream
        if ($session) {
            $yieldAnnotations = $session->getVolumeFileAnnotations($image, $user, $load);
        } else {
            $yieldAnnotations = function () use ($image, $load): Generator {
                foreach ($image->annotations()->with($load)->lazy() as $annotation) {
                    yield $annotation;
                }
            };
        }

        return new StreamedJsonResponse($yieldAnnotations());
    }

    /**
     * @api {get} annotations/:id Get an annotation
     * @apiDeprecated use now (#ImageAnnotations:ShowImageAnnotation).
     * @apiGroup Annotations
     * @apiName ShowAnnotation
     * @apiParam {Number} id The annotation ID.
     * @apiPermission projectMember
     * @apiDescription Access may be denied by an active annotation session of the volume, the annotation belongs to.
     * @apiSuccessExample {json} Success response:
     * {
     *    "id":1,
     *    "image_id":1,
     *    "shape_id":1,
     *    "created_at":"2015-02-13 11:59:23",
     *    "updated_at":"2015-02-13 11:59:23",
     *    "points": [100, 100]
     * }
     */

    /**
     * Displays the annotation.
     *
     * @api {get} image-annotations/:id Get an annotation
     * @apiGroup ImageAnnotations
     * @apiName ShowImageAnnotation
     * @apiParam {Number} id The annotation ID.
     * @apiPermission projectMember
     * @apiDescription Access may be denied by an active annotation session of the volume, the annotation belongs to.
     * @apiSuccessExample {json} Success response:
     * {
     *    "id":1,
     *    "image_id":1,
     *    "shape_id":1,
     *    "created_at":"2015-02-13 11:59:23",
     *    "updated_at":"2015-02-13 11:59:23",
     *    "points": [100, 100]
     * }
     *
     * @param  int  $id
     * @return ImageAnnotation
     */
    public function show($id)
    {
        $annotation = ImageAnnotation::findOrFail($id);
        $this->authorize('access', $annotation);

        return $annotation;
    }

    /**
     * Creates a new annotation in the specified image.
     *
     * @api {post} images/:id/annotations Create a new annotation
     * @apiGroup ImageAnnotations
     * @apiName StoreImageAnnotations
     * @apiPermission projectEditor
     * @apiDescription Only labels may be used that belong to a label tree used by one of
     * the projects, the image belongs to.
     *
     * @apiParam {Number} id The image ID.
     *
     * @apiParam (Required arguments) {Number} shape_id ID of the shape of the new annotation.
     * @apiParam (Required arguments) {Number} label_id ID of the initial category label of the new annotation. Required if 'feature_vector' is not provided.
     * @apiParam (Required arguments) {Number[]} feature_vector A feature vector array of size 384 for label prediction. Required if 'label_id' is not provided.
     * @apiParam (Required arguments) {Number} confidence Confidence of the initial annotation label of the new annotation. Must be a value between 0 and 1.
     * @apiParam (Required arguments) {Number[]} points Array of the initial points of the annotation. Must contain at least one point. The points array is interpreted as alternating x and y coordinates like this `[x1, y1, x2, y2...]`. The interpretation of the points of the different shapes is as follows:
     * **Point:** The first point is the center of the annotation point.
     * **Rectangle:** The first four points are the vertices of the rectangle (in the given order).
     * **Polygon:** Like rectangle with one or more vertices. The first and last vertices of a polygon must have the same coordinates.
     * **LineString:** Like rectangle with one or more vertices.
     * **Circle:** The first point is the center of the circle. The third value of the points array is the radius of the circle. A valid points array of a circle might look like this: `[10, 10, 5]`.
     * **Ellipse:** The four points specify the end points of the semi-major and semi-minor axes of the ellipse in (counter-)clockwise ordering (depending on how the ellipse was drawn). So the first point is the end point of axis 1, the second is the end point of axis 2, the third is the other end point of axis 1 and the fourth is the other end point of axis 2.
     *
     * @apiParamExample {JSON} Request example (JSON):
     * {
     *    "shape_id": 3,
     *    "label_id": 1,
     *    "confidence": 0.75,
     *    "points": [10, 11, 20, 21]
     * }
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
     * @param StoreImageAnnotation $request
     * @return ImageAnnotation
     */
    public function store(StoreImageAnnotation $request, LabelBotService $labelBotService)
    {
        $points = $request->input('points');

        $annotation = new ImageAnnotation;
        $annotation->shape_id = $request->input('shape_id');
        $image = $request->image;
        $annotation->image()->associate($image);
        try {
            $annotation->validatePoints($points);
        } catch (Exception $e) {
            throw ValidationException::withMessages(['points' => [$e->getMessage()]]);
        }

        $annotation->points = $points;
        
        $label = $labelBotService->getLabelForAnnotation($image->volume_id, $request, $annotation);

        $this->authorize('attach-label', [$annotation, $label]);

        DB::transaction(function () use ($annotation, $request, $label) {
            $annotation->save();
            $annotationLabel = new ImageAnnotationLabel;
            $annotationLabel->label_id = $label->id;
            $annotationLabel->user_id = $request->user()->id;
            $annotationLabel->confidence = $request->input('confidence');
            $annotation->labels()->save($annotationLabel);
        });

        $annotation->load('labels.label', 'labels.user');

        return $annotation;
    }

    /**
     * @api {put} annotations/:id Update an annotation
     * @apiDeprecated use now (#ImageAnnotations:UpdateImageAnnotation).
     * @apiGroup Annotations
     * @apiName UpdateAnnotation
     * @apiPermission projectEditor
     *
     * @apiParam {Number} id The annotation ID.
     * @apiParam (Attributes that can be updated) {Number} shape_id ID of the new shape of the annotation.
     * @apiParam (Attributes that can be updated) {Number[]} points Array of new points of the annotation. The new points will replace the old points. See the "Create a new annotation" endpoint for how the points are interpreted for different shapes.
     * @apiParamExample {json} Request example (JSON):
     * {
     *    "points": [10, 11, 20, 21],
     *    "shape_id": 3
     * }
     */

    /**
     * Updates the annotation including its points.
     *
     * @api {put} image-annotations/:id Update an annotation
     * @apiGroup ImageAnnotations
     * @apiName UpdateImageAnnotation
     * @apiPermission projectEditor
     *
     * @apiParam {Number} id The annotation ID.
     * @apiParam (Attributes that can be updated) {Number} shape_id ID of the new shape of the annotation.
     * @apiParam (Attributes that can be updated) {Number[]} points Array of new points of the annotation. The new points will replace the old points. See the "Create a new annotation" endpoint for how the points are interpreted for different shapes.
     * @apiParamExample {json} Request example (JSON):
     * {
     *    "points": [10, 11, 20, 21],
     *    "shape_id": 3
     * }
     *
     * @param Request $request
     * @param  int  $id
     */
    public function update(Request $request, $id)
    {
        $annotation = ImageAnnotation::findOrFail($id);
        $this->authorize('update', $annotation);
        $request->validate([
            'shape_id' => 'required_without:points|integer|exists:shapes,id',
            'points' => 'required_without:shape_id|array',
        ]);

        // from a JSON request, the array may already be decoded
        $points = $request->input('points', $annotation->points);
        $annotation->shape_id = $request->input('shape_id', $annotation->shape_id);

        try {
            $annotation->validatePoints($points);
        } catch (Exception $e) {
            throw ValidationException::withMessages(['points' => [$e->getMessage()]]);
        }

        $annotation->points = $points;
        $annotation->save();
    }

    /**
     * @api {delete} annotations/:id Delete an annotation
     * @apiDeprecated use now (#ImageAnnotations:DestroyImageAnnotation).
     * @apiGroup Annotations
     * @apiName DestroyAnnotation
     * @apiPermission projectEditor
     *
     * @apiParam {Number} id The annotation ID.
     */

    /**
     * Removes the annotation.
     *
     * @api {delete} image-annotations/:id Delete an annotation
     * @apiGroup ImageAnnotations
     * @apiName DestroyImageAnnotation
     * @apiPermission projectEditor
     *
     * @apiParam {Number} id The annotation ID.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $annotation = ImageAnnotation::findOrFail($id);
        $this->authorize('destroy', $annotation);

        $annotation->delete();

        return response('Deleted.', 200);
    }
}
