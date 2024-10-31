<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api\Shapes;

use Illuminate\Http\Request;
use Biigle\Shape;
use Biigle\Http\Controllers\Api\Controller;


class GetShapesTypes extends Controller
{
    /**
     * Get all shapes currently available in Biigle
     *
     * @api {get} shapes
     *
     * @param Request $request
     */
    public function index(Request $request) {
        return Shape::pluck('name', 'id');;
    }
}
