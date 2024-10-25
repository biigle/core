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
     * @api {get} projects/:tid/video-annotations/filter/label/:lid Get video annotations with a label
     * @apiGroup Projects
     * @apiName ShowProjectsVideoAnnotationsFilterLabels
     * @apiParam {Number} pid The project ID
     * @apiParam {Number} lit The Label ID
     * @apiParam (Optional arguments) {Number} take Number of video annotations to return. If this parameter is present, the most recent annotations will be returned first. Default is unlimited.
     * @apiPermission projectMember
     * @apiDescription Returns a map of video annotation IDs to their video UUIDs.
     *
     * @param Request $request
     */
    public function index(Request $request) {
        return Shape::pluck('name', 'id');;
    }
}