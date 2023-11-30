<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Requests\StorePendingVolume;

class ProjectPendingVolumeController extends Controller
{
    /**
     * Creates a new pending volume associated to the specified project.
     *
     * @api {post} projects/:id/pending-volumes Create a new pending volume
     * @apiGroup Volumes
     * @apiName StoreProjectPendingVolumes
     * @apiPermission projectAdmin
     *
     * @apiParam {Number} id The project ID.
     *
     * @apiParam (Required attributes) {String} media_type The media type of the new volume (`image` or `video`).
     */
    public function store(StorePendingVolume $request)
    {
        return $request->project->pendingVolumes()->create([
            'media_type_id' => $request->input('media_type_id'),
            'user_id' => $request->user()->id,
        ]);
    }
}
