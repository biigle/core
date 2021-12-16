<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Requests\StoreVideoLabel;
use Biigle\Video;
use Biigle\VideoLabel;

class VideoLabelController extends VolumeFileLabelController
{
    /**
     * @api {get} videos/:id/labels Get all labels
     * @apiGroup Videos
     * @apiName IndexVideoLabels
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The video ID.
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "label_id": 2,
     *       "user_id": 1,
     *       "label": {
     *          "id": 2,
     *          "name": "Bad quality",
     *          "parent_id": 1,
     *          "color": "0099ff",
     *          "label_tree_id": 1
     *       },
     *       "user": {
     *          "id": 1,
     *          "role_id": 2,
     *          "firstname": "Joe",
     *          "lastname": "User"
     *       }
     *    }
     * ]
     *
     */

    /**
     * Creates a new label for the specified video.
     *
     * @api {post} videos/:id/labels Attach a label
     * @apiGroup Videos
     * @apiName StoreVideoLabels
     * @apiPermission projectEditor
     * @apiDescription Only labels may be used that belong to a label tree used by one of
     * the projects, the video belongs to.
     *
     * @apiParam {Number} id The video ID.
     * @apiParam (Required arguments) {Number} label_id The ID of the label category to attach to the video.
     * @apiParamExample {String} Request example:
     * label_id: 1
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 1,
     *    "label": {
     *       "id": 1,
     *       "name": "Bad quality",
     *       "parent_id": null,
     *       "color": "0099ff",
     *       "label_tree_id": 1
     *    },
     *    "user": {
     *       "id": 1,
     *       "role_id": 2,
     *       "firstname": "Joe",
     *       "lastname": "User"
     *    }
     * }
     *
     * @param StoreVideoLabel $request
     * @return \Illuminate\Http\Response
     */
    public function store(StoreVideoLabel $request)
    {
        return parent::baseStore($request);
    }

    /**
     * @api {delete} video-labels/:id Detach a label
     * @apiGroup Videos
     * @apiName DeleteVideoLabels
     * @apiPermission projectEditor
     *
     * @apiParam {Number} id The video **label** ID (not the video ID).
     */

    /**
    * Get the file model class name.
    *
    * @return string
    */
    protected function getFileModel()
    {
        return Video::class;
    }

    /**
    * Get the file label model class name.
    *
    * @return string
    */
    protected function getFileLabelModel()
    {
        return VideoLabel::class;
    }
}
