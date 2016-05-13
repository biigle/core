<?php

namespace Dias\Modules\Transects\Http\Controllers\Api;

use Dias\Transect;
use Dias\Http\Controllers\Api\Controller;

class TransectImageController extends Controller
{
    /**
     * List the image IDs of the specified transect, ordered by filename
     *
     * @api {get} transects/:id/images/order-by/filename Get all images ordered by filename
     * @apiGroup Transects
     * @apiName IndexTransectImagesOrderByFilename
     * @apiPermission projectMember
     * @apiDescription Returns a list of all image IDs of the transect, ordered by image filenames
     *
     * @apiParam {Number} id The transect ID.
     *
     * @apiSuccessExample {json} Success response:
     * [1, 4, 3, 2, 6, 5]
     *
     * @param  int  $id
     *
     * @return \Illuminate\Http\Response
     */
    public function indexOrderByFilename($id) {
        $transect = Transect::findOrFail($id);
        $this->requireCanSee($transect);

        return $transect->images()
            ->orderBy('filename', 'asc')
            ->pluck('id');
    }
}
