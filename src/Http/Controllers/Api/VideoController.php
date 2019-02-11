<?php

namespace Biigle\Modules\Videos\Http\Controllers\Api;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Modules\Videos\Http\Requests\DestroyVideo;

class VideoController extends Controller
{
    /**
     * Delete a video.
     *
     * @api {delete} videos/:id Delete a video
     * @apiGroup Videos
     * @apiName DestroyVideos
     * @apiPermission projectAdmin
     *
     * @apiParam {Number} id The video ID.
     *
     * @apiParam (Optional parameters) {Boolean} force Must be set to `true` if the video has any annotations and should be deleted anyway.
     *
     * @param DestroyVideo $request
     * @return mixed
     */
    public function destroy(DestroyVideo $request)
    {
        $request->video->delete();
    }
}
