<?php

namespace Biigle\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Volume;
use Symfony\Component\HttpFoundation\StreamedJsonResponse;

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
     * of file labels as values (depending on the volume media type). Files without any
     * labels are omitted.
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
     * @return \Symfony\Component\HttpFoundation\StreamedJsonResponse
     */
    public function index($id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);

        $query = $volume->files()
            ->has('labels')
            ->with('labels.label', 'labels.user')
            ->select('id');

        $generator = function () use ($query) {
            foreach ($query->lazy() as $file) {
                yield $file->id => $file->labels;
            }
        };

        return new StreamedJsonResponse($generator());
    }
}
