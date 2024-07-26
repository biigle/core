<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Requests\StoreImageAnnotations;
use Biigle\ImageAnnotation;
use Biigle\ImageAnnotationLabel;
use DB;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ImageAnnotationBulkController extends Controller
{
    /**
     * @api {post} annotations Create new annotations
     * @apiDeprecated use now (#ImageAnnotations:BulkStoreImageAnnotations).
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
     */

    /**
     * Create new annotations
     *
     * @api {post} image-annotations Create new annotations
     * @apiGroup ImageAnnotations
     * @apiName BulkStoreImageAnnotations
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
     * @param StoreImageAnnotations $request
     *
     * @return mixed
     */
    public function store(StoreImageAnnotations $request)
    {
        $annotations = collect($request->all())->map(function ($input) {
            $annotation = new ImageAnnotation;
            $annotation->shape_id = $input['shape_id'];

            try {
                $annotation->validatePoints($input['points']);
            } catch (Exception $e) {
                throw ValidationException::withMessages(['points' => [$e->getMessage()]]);
            }

            $annotation->points = $input['points'];
            $annotation->image_id = $input['image_id'];
            /** @phpstan-ignore-next-line */
            $annotation->label_id = $input['label_id'];
            /** @phpstan-ignore-next-line */
            $annotation->confidence = $input['confidence'];

            return $annotation;
        });

        DB::transaction(function () use ($request, $annotations) {
            $annotations->each(function ($annotation) use ($request) {
                /** @phpstan-ignore-next-line */
                $label = $request->labels[$annotation->label_id];
                /** @phpstan-ignore-next-line */
                $confidence = $annotation->confidence;
                unset($annotation->label_id, $annotation->confidence);

                $this->authorize('attach-label', [$annotation, $label]);
                $annotation->save();

                $annotationLabel = new ImageAnnotationLabel;
                $annotationLabel->annotation_id = $annotation->id;
                $annotationLabel->label_id = $label->id;
                $annotationLabel->user_id = $request->user()->id;
                $annotationLabel->confidence = $confidence;
                $annotationLabel->save();
            });
        });

        return ImageAnnotation::with('labels')->findMany($annotations->pluck('id'));
    }
}
