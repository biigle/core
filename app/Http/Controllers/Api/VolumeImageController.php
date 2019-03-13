<?php

namespace Biigle\Http\Controllers\Api;

use DB;
use Biigle\Volume;
use Biigle\Jobs\CreateNewImages;
use Biigle\Http\Requests\StoreVolumeImage;

class VolumeImageController extends Controller
{
    /**
     * List the image IDs of the specified volume.
     *
     * @api {get} volumes/:id/images Get all images
     * @apiGroup Volumes
     * @apiName IndexVolumeImages
     * @apiPermission projectMember
     * @apiDescription Returns a list of all image IDs of the volume.
     *
     * @apiParam {Number} id The volume ID.
     *
     * @apiSuccessExample {json} Success response:
     * [1, 2, 3, 4, 5, 6]
     *
     * @param  int  $id
     *
     * @return \Illuminate\Http\Response
     */
    public function index($id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);

        return $volume->images()
            ->orderBy('id', 'asc')
            ->pluck('id');
    }

    /**
     * Add images to the specified volume.
     *
     * @api {post} volumes/:id/images Add images
     * @apiGroup Volumes
     * @apiName StoreVolumeImages
     * @apiPermission projectAdmin
     *
     * @apiParam {Number} id The volume ID.
     *
     * @apiParam (Required attributes) {String} images List of image file names, formatted as comma separated values.
     *
     * @apiParamExample {String} Request example:
     * images: '1.jpg,2.jpg,3.jpg'
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "filename": "1.jpg"
     *    },
     *    {
     *       "id": 2,
     *       "filename": "2.jpg"
     *    }
     * ]
     *
     *
     * @param StoreVolumeImage $request
     * @return \Illuminate\Http\Response
     */
    public function store(StoreVolumeImage $request)
    {
        $images = $request->input('images');
        // No asynchronous processing from this endpoint since the new images should
        // be immediately returned. Do not push the job on the sync queue because the
        // returned JSON could not be tested this way.
        (new CreateNewImages($request->volume, $images))->handle();

        return $request->volume->images()
            ->select('id', 'filename')
            ->orderBy('id', 'desc')
            ->take(sizeof($images))
            ->get();
    }
}
