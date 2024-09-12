<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Requests\StoreImageLabel;
use Biigle\Image;
use Biigle\ImageLabel;

class ImageLabelController extends VolumeFileLabelController
{
    /**
     * @api {get} images/:id/labels Get all labels
     * @apiGroup Images
     * @apiName IndexImageLabels
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The image ID.
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
     * Creates a new label for the specified image.
     *
     * @api {post} images/:id/labels Attach a label
     * @apiGroup Images
     * @apiName StoreImageLabels
     * @apiPermission projectEditor
     * @apiDescription Only labels may be used that belong to a label tree used by one of
     * the projects, the image belongs to.
     *
     * @apiParam {Number} id The image ID.
     * @apiParam (Required arguments) {Number} label_id The ID of the label category to attach to the image.
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
     * @param StoreImageLabel $request
     * @return \Biigle\VolumeFileLabel
     */
    public function store(StoreImageLabel $request)
    {
        return parent::baseStore($request);
    }

    /**
     * @api {delete} image-labels/:id Detach a label
     * @apiGroup Images
     * @apiName DeleteImageLabels
     * @apiPermission projectEditor
     *
     * @apiParam {Number} id The image **label** ID (not the image ID).
     */

    /**
    * Get the file model class name.
    *
    * @return string
    */
    protected function getFileModel()
    {
        return Image::class;
    }

    /**
    * Get the file label model class name.
    *
    * @return string
    */
    protected function getFileLabelModel()
    {
        return ImageLabel::class;
    }
}
