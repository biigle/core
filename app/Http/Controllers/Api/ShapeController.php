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
     * @return \Illuminate\Support\Collection<int, array>
     */
    public function index()
    {
        return collect(Shape::cases())->map->toArray()->values();
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
        $shape = Shape::tryFrom((int) $id);
        abort_if($shape === null, 404);
        return $shape;
    }
}
