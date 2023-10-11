<?php

namespace Biigle\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Volume;

class FileLabelsController extends Controller
{
    /**
     * Get the labels for each image/video
     *
     * @api {get} volumes/:id/files/labels Get the labels for each image/video
     * @apiGroup Volumes
     * @apiName VolumeIndexFileLabels
     * @apiPermission projectMember
     * @apiDescription Returns an object with the image/video IDs as keys and the arrays
     * of file labels as values (depending on the volume media type).
     *
     * @apiParam {Number} id The volume ID
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "123": [
     *       {
     *          "id": 1,
     *          "label_id": 2,
     *          "user_id": 1,
     *          "label": {
     *             "id": 2,
     *             "name": "Bad quality",
     *             "parent_id": 1,
     *             "color": "0099ff",
     *             "label_tree_id": 1
     *          },
     *          "user": {
     *             "id": 1,
     *             "role_id": 2,
     *             "firstname": "Joe",
     *             "lastname": "User"
     *          }
     *       }
     *    ]
     * }
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function index($id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);

        return $volume->files()
            ->with('labels.label', 'labels.user')
            ->select('id')
            ->get()
            ->keyBy('id')
            ->map(fn ($image) => $image->labels);
    }
}
