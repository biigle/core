<?php

namespace Biigle\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Http\Requests\StoreParseIfdo;

class ParseIfdoController extends Controller
{
    /**
     * parse an iFDO file
     *
     * @api {post} volumes/parse-ifdo Parse an iFDO file
     * @apiGroup Volumes
     * @apiName StoreVolumeIfdo
     * @apiPermission user
     * @apiDescription This endpoint parses an iFDO file (https://marine-imaging.com/fair) and returns the content that can be imported in BIIGLE as a new volume, formatted as JSON.
     *
     * @apiParam (Required attributes) {File} file iFDO file in YAML format (maximum size 500 MB).
     *
     * @param StoreParseIfdo $request
     *
     * @return \Illuminate\Http\Response
     */
    public function store(StoreParseIfdo $request)
    {
        return $request->metadata;
    }
}
