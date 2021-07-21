<?php

namespace Biigle\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Volume;
use Biigle\MediaType;
use Illuminate\Http\Response;

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
        $volume = Volume::where('media_type_id', MediaType::imageId())->findOrFail($id);
        $this->authorize('access', $volume);

        if ($volume->images()->whereNull('similarityIndex')->exists()) {
            abort(Response::HTTP_NOT_FOUND);
        }

        return $volume->files()->pluck('similarityIndex', 'id');




    }
}
