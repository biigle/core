<?php

namespace Biigle\Http\Controllers\Api;

use Exception;
use Biigle\Annotation;
use Illuminate\Http\Request;

class AnnotationController extends Controller
{
    /**
     * Displays the annotation.
     *
     * @api {get} annotations/:id Get an annotation
     * @apiGroup Annotations
     * @apiName ShowAnnotation
     * @apiParam {Number} id The annotation ID.
     * @apiPermission projectMember
     * @apiDescription Access may be denied by an active annotation session of the project to which the annotation belongs.
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
     * @return Annotation
     */
    public function show($id)
    {
        $annotation = Annotation::findOrFail($id);
        $this->authorize('access', $annotation);

        return $annotation;
    }

    /**
     * Updates the annotation including its points.
     *
     * @api {put} annotations/:id Update an annotation
     * @apiGroup Annotations
     * @apiName UpdateAnnotation
     * @apiPermission projectEditor
     *
     * @apiParam {Number} id The annotation ID.
     * @apiParam (Attributes that can be updated) {Number[]} points Array (JSON or as String) of new points of the annotation. The new points will replace the old points. See the "Create a new annotation" endpoint for how the points are interpreted for different shapes.
     * @apiParamExample {json} Request example (JSON):
     * {
     *    "points": [10, 11, 20, 21]
     * }
     * @apiParamExample {String} Request example (String):
     * points: '[10, 11, 20, 21]'
     *
     * @param Request $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $annotation = Annotation::findOrFail($id);
        $this->authorize('update', $annotation);

        // from a JSON request, the array may already be decoded
        $points = $request->input('points');

        if (is_string($points)) {
            $points = json_decode($points);
        }

        try {
            $annotation->validatePoints($points);
        } catch (Exception $e) {
            return $this->buildFailedValidationResponse($request, [
                'points' => [$e->getMessage()],
            ]);
        }

        $annotation->points = $points;
        $annotation->save();
    }

    /**
     * Removes the annotation.
     *
     * @api {delete} annotations/:id Delete an annotation
     * @apiGroup Annotations
     * @apiName DestroyAnnotation
     * @apiPermission projectEditor
     *
     * @apiParam {Number} id The annotation ID.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $annotation = Annotation::findOrFail($id);
        $this->authorize('destroy', $annotation);

        $annotation->delete();
    }
}
