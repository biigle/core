<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Annotation;
use Biigle\AnnotationLabel;
use Biigle\Http\Requests\StoreAnnotations;
use DB;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

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
     * @return Annotation
     */
    public function show($id)
    {
        $annotation = Annotation::findOrFail($id);
        $this->authorize('access', $annotation);

        return $annotation;
    }

    /**
     * Create new annotations
     *
     * @api {post} annotations Create new annotations
     * @apiGroup Annotations
     * @apiName StoreAnnotations
     * @apiPermission projectEditor
     * @apiDescription Accepts an array of new annotations that should be batch-created. A maximum of 100 annotations can be created with a single request.
     *
     * @apiParam (Required arguments) {Number} image_id ID of the image to which the annotation should belong.
     * @apiParam (Required arguments) {Mixed} . All required arguments of the "Create a new annotation" endpoint.
     *
     * @apiParamExample {JSON} Request example (JSON):
     * [
     *     {
     *        "image_id": 123,
     *        "shape_id": 1,
     *        "label_id": 1,
     *        "confidence": 1.00,
     *        "points": [10, 11]
     *     },
     *     {
     *        "image_id": 321,
     *        "shape_id": 3,
     *        "label_id": 5,
     *        "confidence": 1.00,
     *        "points": [10, 11, 20, 21]
     *     }
     * ]
     *
     * @param StoreAnnotations $request
     *
     * @return mixed
     */
    public function store(StoreAnnotations $request)
    {
        $annotations = collect($request->all())->map(function ($input) {
            $annotation = new Annotation;
            $annotation->shape_id = $input['shape_id'];

            try {
                $annotation->validatePoints($input['points']);
            } catch (Exception $e) {
                throw ValidationException::withMessages(['points' => [$e->getMessage()]]);
            }

            $annotation->points = $input['points'];
            $annotation->image_id = $input['image_id'];
            $annotation->label_id = $input['label_id'];
            $annotation->confidence = $input['confidence'];

            return $annotation;
        });

        DB::transaction(function () use ($request, $annotations) {
            $annotations->each(function ($annotation) use ($request) {
                $label = $request->labels[$annotation->label_id];
                $confidence = $annotation->confidence;
                unset($annotation->label_id);
                unset($annotation->confidence);
                $this->authorize('attach-label', [$annotation, $label]);
                $annotation->save();

                $annotationLabel = new AnnotationLabel;
                $annotationLabel->annotation_id = $annotation->id;
                $annotationLabel->label_id = $label->id;
                $annotationLabel->user_id = $request->user()->id;
                $annotationLabel->confidence = $confidence;
                $annotationLabel->save();
            });
        });

        return Annotation::with('labels')->findMany($annotations->pluck('id'));
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
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $annotation = Annotation::findOrFail($id);
        $this->authorize('update', $annotation);
        $request->validate([
            'shape_id' => 'required_without:points|id|exists:shapes,id',
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

        return response('Deleted.', 200);
    }
}
