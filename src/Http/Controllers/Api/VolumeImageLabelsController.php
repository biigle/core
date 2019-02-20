<?php

namespace Biigle\Modules\Volumes\Http\Controllers\Api;

use Biigle\Volume;
use Biigle\Http\Controllers\Api\Controller;

class VolumeImageLabelsController extends Controller
{
    /**
     * Get the image labels for each image
     *
     * @api {get} volumes/:id/images/labels Get the image labels for each image
     * @apiGroup Volumes
     * @apiName VolumeIndexImageLabels
     * @apiPermission projectMember
     * @apiDescription Returns an object with the image IDs as keys and the arrays of
     * image labels as values.
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

        return $volume->images()
            ->with('labels.label', 'labels.user')
            ->select('id')
            ->get()
            ->keyBy('id')
            ->map(function ($image) {
                return $image->labels;
            });
    }
}
