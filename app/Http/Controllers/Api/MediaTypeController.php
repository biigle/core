<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\MediaType;

class MediaTypeController extends Controller
{
    /**
     * Shows all media types.
     *
     * @api {get} media-types Get all media types
     * @apiGroup Media-Types
     * @apiName IndexMediaTypes
     * @apiPermission user
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "name": "image"
     *    },
     *    {
     *       "id": 2,
     *       "name": "video"
     *    }
     * ]
     *
     * @return \Illuminate\Support\Collection<int, array>
     */
    public function index()
    {
        return collect(MediaType::cases())->map->toArray()->values();
    }

    /**
     * Displays the specified media type.
     *
     * @api {get} media-types/:id Get a media type
     * @apiGroup Media-Types
     * @apiName ShowMediaTypes
     * @apiPermission user
     *
     * @apiParam {Number} id The media type ID.
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 1,
     *    "name": "image"
     * }
     *
     * @param  int  $id
     * @return MediaType
     */
    public function show($id)
    {
        $mediaType = MediaType::tryFrom((int) $id);
        abort_if($mediaType === null, 404);
        return $mediaType;
    }
}
