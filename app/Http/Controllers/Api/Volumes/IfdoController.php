<?php

namespace Biigle\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Volume;

class IfdoController extends Controller
{
    /**
     * Get an iFDO file attached to a volume
     *
     * @api {get} volumes/:id/ifdo Get an iFDO file
     * @apiGroup Volumes
     * @apiName GetVolumeIfdo
     * @apiPermission user
     ~
     * @param int $id
     *
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);

        return $volume->downloadIfdo();
    }
}
