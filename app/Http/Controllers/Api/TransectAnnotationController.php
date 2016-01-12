<?php

namespace Dias\Http\Controllers\Api;

use Dias\Transect;
use Dias\Annotation;
use Illuminate\Http\JsonResponse;

class TransectAnnotationController extends Controller
{
    /**
     * List all annotations of the specified transect.
     *
     * @api {get} transects/:id/annotations Get all annotations
     * @apiGroup Transects
     * @apiName IndexTransectAnnotations
     * @apiPermission projectMember
     * @apiDescription Returns a list of all images that have annotations, along with detailed information on all annotations.
     *
     * @apiParam {Number} id The transect ID.
     *
     * @apiSuccessExample {json} Success response:
     * [
     *     {
     *         "id":1,
     *         "filename":"image.jpg",
     *         "annotations": [
     *             {
     *                 "id":1,
     *                 "image_id":1,
     *                 "shape_id":6,
     *                 "created_at":"2015-09-30 07:51:12",
     *                 "updated_at":"2015-09-30 07:51:12",
     *                 "labels": [
     *                    {
     *                       "id":1,
     *                       "confidence": 0.6,
     *                       "created_at":"2015-09-30 07:51:12",
     *                       "updated_at":"2015-09-30 07:51:12",
     *                       "label": {
     *                          "id":3,
     *                          "name":"Benthic Object",
     *                          "parent_id":2,
     *                          "aphia_id":null,
     *                          "project_id":null
     *                       },
     *                       "user": {
     *                          "id":13,
     *                          "role_id":2,
     *                          "name":"Gudrun Schinner"
     *                       }
     *                    }
     *                 ],
     *                 "shape": {
     *                    "id":6,
     *                    "name":"Circle"
     *                 },
     *                 "points": [
     *                    {"x":4,"y":8}
     *                 ]
     *             }
     *         ]
     *     }
     * ]
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function index($id)
    {
        $transect = Transect::findOrFail($id);
        $this->requireCanSee($transect);

        // With lots of images and lots of annotations this query can return LOTS of
        // items. We'll then run into memory issues if we try to process them all as
        // Eloquent models. Do these workarounds to prevent that.
        $images = $transect->images()->has('annotations')->get()->toArray();

        foreach ($images as &$image) {
            $image['annotations'] = [];

            Annotation::with('labels', 'shape', 'points')
                ->where('image_id', $image['id'])
                ->chunk(500, function ($annotations) use (&$image) {
                    $image['annotations'] = array_merge($image['annotations'], $annotations->toArray());
                });
        }

        return new JsonResponse($images);
    }
}
