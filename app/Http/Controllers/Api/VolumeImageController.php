<?php

namespace Biigle\Http\Controllers\Api;

use Exception;
use Biigle\Volume;
use Illuminate\Http\Request;

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
     * @param Request $request
     * @param int $id Volume ID
     *
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request, $id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('update', $volume);

        $this->validate($request, Volume::$addImagesRules);

        $images = Volume::parseImagesQueryString($request->input('images'));

        try {
            $volume->validateImages($images);
        } catch (Exception $e) {
            return $this->buildFailedValidationResponse($request, [
                'images' => $e->getMessage(),
            ]);
        }

        try {
            $volume->createImages($images);
        } catch (Exception $e) {
            return response($e->getMessage(), 400);
        }

        $images = $volume->images()
            ->select('id', 'filename')
            ->orderBy('id', 'desc')
            ->take(sizeof($images))
            ->get();

        $ids = $images->pluck('id')->toArray();

        $volume->handleNewImages($ids);
        event('images.created', [$id, $ids]);

        return $images;
    }
}
