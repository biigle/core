<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Shape;

class ShapeController extends Controller
{
    /**
     * Shows all shapes.
     *
     * @api {get} shapes Get all shapes
     * @apiGroup Shapes
     * @apiName IndexShapes
     * @apiPermission user
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "name": "Point"
     *    },
     *    {
     *       "id": 2,
     *       "name": "LineString"
     *    }
     * ]
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function index()
    {
        return Shape::all();
    }

    /**
     * Displays the specified shape.
     *
     * @api {get} shapes/:id Get a shape
     * @apiGroup Shapes
     * @apiName ShowShapes
     * @apiPermission user
     *
     * @apiParam {Number} id The shape ID.
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 1,
     *    "name": "Point"
     * }
     *
     * @param  int  $id
     * @return Shape
     */
    public function show($id)
    {
        return Shape::findOrFail($id);
    }
}
