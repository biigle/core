<?php

namespace Dias\Http\Controllers\Api;

use Dias\Transect;

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

        return $transect->images()
                ->with('annotations.labels', 'annotations.shape', 'annotations.points')
                // take only the images having annotations
                ->whereExists(function ($query) {
                    $query->select(\DB::raw(1))
                        ->from('annotations')
                        ->whereRaw('annotations.image_id = images.id');
                })
                ->get();
    }
}
