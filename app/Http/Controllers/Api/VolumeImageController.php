<?php

namespace Biigle\Http\Controllers\Api;

use DB;
use Biigle\Volume;
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
        DB::transaction(function () use ($request) {
            $request->volume->createImages($request->input('images'));
        });

        $images = $request->volume->images()
            ->select('id', 'filename')
            ->orderBy('id', 'desc')
            ->take(sizeof($request->input('images')))
            ->get();

        $ids = $images->pluck('id')->toArray();
        $request->volume->handleNewImages($ids);
        event('images.created', [$request->volume->id, $ids]);

        return $images;
    }
}
