<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Requests\StoreVolumeFile;
use Biigle\Jobs\CreateNewImagesOrVideos;
use Biigle\Volume;

class VolumeFileController extends Controller
{
    /**
     * List the image/video IDs of the specified volume.
     *
     * @api {get} volumes/:id/files Get all images/videos
     * @apiGroup Volumes
     * @apiName IndexVolumeFiles
     * @apiPermission projectMember
     * @apiDescription Returns a list of all image/video IDs of the volume.
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

        return $volume->files()
            ->orderBy('id', 'asc')
            ->pluck('id');
    }

    /**
     * Add images/videos to the specified volume.
     *
     * @api {post} volumes/:id/files Add images/videos
     * @apiGroup Volumes
     * @apiName StoreVolumeVideos
     * @apiPermission projectAdmin
     *
     * @apiParam {Number} id The volume ID.
     *
     * @apiParam (Required attributes) {String} files List of file names, formatted as comma separated values or as array.
     *
     * @apiParam (Deprecated attributes) {String} images This attribute has been replaced by the `files` attribute which should be used instead.
     *
     * @apiParamExample {String} Request example:
     * images: '1.jpg,2.jpg,3.jpg'
     *
     * @apiParamExample {JSON} Request example:
     * { "images": ["1.jpg", "2.jpg", "3.jpg"] }
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
     * @param StoreVolumeFile $request
     * @return \Illuminate\Http\Response
     */
    public function store(StoreVolumeFile $request)
    {
        $files = $request->input('files');
        // No asynchronous processing from this endpoint since the new files should
        // be immediately returned. Do not push the job on the sync queue because the
        // returned JSON could not be tested this way.
        (new CreateNewImagesOrVideos($request->volume, $files))->handle();

        return $request->volume->files()
            ->select('id', 'filename')
            ->orderBy('id', 'desc')
            ->take(sizeof($files))
            ->get();
    }
}
