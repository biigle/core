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
     *                 "labels": [
     *                    {
     *                       "id":1,
     *                       "confidence": 0.6,
     *                       "label": {
     *                          "id":3,
     *                          "name":"Benthic Object",
     *                          "parent_id":2,
     *                          "aphia_id":null,
     *                          "project_id":null,
     *                          "color": "0099ff"
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
     *                 "points": [4, 8]
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
        $images = $transect->images()->has('annotations')->get();
        // assemble the JSON string instead of storing all Eloquent modely or arrays
        $imagesJson = '[';

        foreach ($images as $image) {
            // get the image model as JSON object and add the annotations array (remove the '}')
            $imageJson = substr($image->toJson(), 0, -1).',"annotations":[';

            Annotation::with('labels', 'shape')
                ->where('image_id', $image['id'])
                // omit timestamps to reduce response size
                ->select('annotations.id', 'annotations.image_id', 'annotations.shape_id', 'annotations.points')
                ->chunk(500, function ($annotations) use (&$imageJson) {
                    // append to the annotations array string (remove the '[]')
                    $imageJson .= substr($annotations->toJson(), 1, -1);
                });
            // finish the annotations array string and image object
            $imagesJson .= $imageJson.']},';
        }

        // finish the images array (remove the last comma)
        $imagesJson = substr($imagesJson, 0, -1).']';

        return response($imagesJson)->header('Content-Type', 'application/json');
    }
}
