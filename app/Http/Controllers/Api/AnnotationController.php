<?php

namespace Dias\Http\Controllers\Api;

use Dias\Annotation;

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
     * @apiSuccessExample {json} Success response:
     * {
     *    "id":1,
     *    "image_id":1,
     *    "shape_id":1,
     *    "created_at":"2015-02-13 11:59:23",
     *    "updated_at":"2015-02-13 11:59:23",
     *    "points": [
     *        {"x": 100, "y": 200}
     *    ]
     * }
     *
     * @param  int  $id
     * @return Annotation
     */
    public function show($id)
    {
        $annotation = $this->requireNotNull(
            Annotation::with('points')->find($id)
        );

        // call fresh so the transect and image doesn't appear in the output
        // (they will be fetched for projectIds())
        $this->requireCanSee($annotation->fresh());

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
     * @apiParam (Attributes that can be updated) {Object[]} points Array (JSON or as String) of new points of the annotation. The new points will replace the old points.
     * @apiParamExample {json} Request example (JSON):
     * {
     *    "points": [
     *       {"x": 10, "y": 11},
     *       {"x": 20, "y": 21}
     *    ]
     * }
     * @apiParamExample {String} Request example (String):
     * points: '[{"x":10,"y":11},{"x":20,"y":21}]'
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update($id)
    {
        $annotation = $this->requireNotNull(
            Annotation::with('points')->find($id)
        );

        $this->requireCanEdit($annotation->fresh());

        // from a JSON request, the array may already be decoded
        $points = $this->request->input('points');

        if (is_string($points)) {
            $points = json_decode($points);
        }

        $annotation->refreshPoints($points);
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
        $annotation = $this->requireNotNull(Annotation::find($id));

        $this->requireCanEdit($annotation);

        $annotation->delete();

        return response('Deleted.', 200);
    }
}
