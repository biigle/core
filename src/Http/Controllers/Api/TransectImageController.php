<?php

namespace Dias\Modules\Annotations\Http\Controllers\Api;

use Dias\Transect;
use Dias\Http\Controllers\Api\Controller;

class TransectImageController extends Controller
{
    /**
     * List the IDs of images having one or more annotations of the specified transect.
     *
     * @api {get} transects/:id/images Get all images having annotations
     * @apiGroup Transects
     * @apiName IndexTransectImagesHavingAnnotations
     * @apiPermission projectMember
     * @apiDescription Returns IDs of images having one or more annotations of the specified transect.
     *
     * @apiParam {Number} id The transect ID.
     *
     * @apiSuccessExample {json} Success response:
     * [1, 5, 6]
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function index($id)
    {
        $transect = Transect::findOrFail($id);
        $this->requireCanSee($transect);

        return $transect->images()->has('annotations')->lists('id');
    }
}
