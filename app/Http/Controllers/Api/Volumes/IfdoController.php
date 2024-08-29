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
     * @apiName ShowVolumeIfdo
     * @apiPermission projectMember
     ~
     * @param int $id
     *
     * @return \Symfony\Component\HttpFoundation\StreamedResponse
     */
    public function show($id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);

        return $volume->downloadIfdo();
    }

    /**
     * Delete an iFDO file attached to a volume
     *
     * @api {delete} volumes/:id/ifdo Delete an iFDO file
     * @apiGroup Volumes
     * @apiName DestroyVolumeIfdo
     * @apiPermission projectAdmin
     ~
     * @param int $id
     */
    public function destroy($id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('update', $volume);
        $volume->deleteIfdo();
    }
}
