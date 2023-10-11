<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Requests\DestroyVideo;
use Biigle\Video;

class VideoController extends Controller
{
    /**
     * Shows the specified image.
     *
     * @api {get} videos/:id Get video information
     * @apiGroup Videos
     * @apiName ShowVideos
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The video ID.
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 1,
     *    "uuid": "01ef3e62-31ae-384c-b9d7-1b7ee64fd58a",
     *    "filename": "video.mp4"
     *    "volume_id": 123,
     *    "size": 172889435,
     *    "mimeType": "video/mp4",
     *    "duration": 149.84,
     *    "error": null,
     * }
     *
     * @param int $id image id
     * @return Video
     */
    public function show($id)
    {
        $video = Video::findOrFail($id);
        $this->authorize('access', $video);

        return $video->append('size', 'mimeType', 'error');
    }

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
        $request->file->delete();
    }
}
