<?php

namespace Dias\Http\Controllers\Api;

use Dias\MediaType;

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
     *       "name": "time-series"
     *    },
     *    {
     *       "id": 2,
     *       "name": "location-series"
     *    }
     * ]
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        return MediaType::all();
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
     *    "name": "time-series"
     * }
     *
     * @param  int  $id
     * @return MediaType
     */
    public function show($id)
    {
        return MediaType::find($id);
    }
}
