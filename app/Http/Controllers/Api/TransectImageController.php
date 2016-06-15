<?php

namespace Dias\Http\Controllers\Api;

use Dias\Transect;

class TransectImageController extends Controller
{
    /**
     * List the image IDs of the specified transect.
     *
     * @api {get} transects/:id/images Get all images
     * @apiGroup Transects
     * @apiName IndexTransectImages
     * @apiPermission projectMember
     * @apiDescription Returns a list of all image IDs of the transect.
     *
     * @apiParam {Number} id The transect ID.
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
        $transect = Transect::findOrFail($id);
        $this->authorize('access', $transect);

        return $transect->images()
            ->orderBy('id', 'asc')
            ->pluck('id');
    }


    /**
     * Add images to the specified transect
     *
     * @api {post} transects/:id/images Add images
     * @apiGroup Transects
     * @apiName StoreTransectImages
     * @apiPermission projectAdmin
     *
     * @apiParam {Number} id The transect ID.
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
     * @param int $id Transect ID
     *
     * @return \Illuminate\Http\Response
     */
    public function store($id)
    {
        $transect = Transect::findOrFail($id);
        $this->authorize('update', $transect);

        $this->validate($this->request, Transect::$addImagesRules);

        $images = Transect::parseImagesQueryString($this->request->input('images'));

        if (empty($images)) {
            return $this->buildFailedValidationResponse($this->request, [
                'images' => 'No images were supplied!',
            ]);
        }

        try {
            $transect->createImages($images);
        } catch (\Exception $e) {
            return response($e->getMessage(), 400);
        }

        $images = $transect->images()
            ->select('id', 'filename')
            ->orderBy('id', 'desc')
            ->take(sizeof($images))
            ->get();

        $transect->generateThumbnails($images->pluck('id')->all());

        return $images;
    }
}
