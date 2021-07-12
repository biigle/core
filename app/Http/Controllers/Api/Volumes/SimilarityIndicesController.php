<?php

namespace Biigle\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Volume;

class SimilarityIndicesController extends Controller
{
    /**
     * Get all similarity indices of a volume.
     *
     * @api {get} volumes/:id/similarityIndices Get similarity indices
     * @apiGroup Volumes
     * @apiName VolumeSimilarityIndex
     * @apiPermission projectMember
     * @apiDescription Returns a map of image IDs to their similarity indices.
     *
     * @apiParam {Number} id The volume ID
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "123": 0,
     *    "321": 1
     * }
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function index($id)
    {
        // should not be find or fail
        $volume = Volume::findOrFail($id);
        if ($volume->isImageVolume()) {
            $this->authorize('access', $volume);

            return $volume->files()->pluck('similarityIndex', 'id');
        }
        // check right return statement
        return;

    }
}
