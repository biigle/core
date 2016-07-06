<?php

namespace Dias\Http\Controllers\Api;

use Dias\Image;
use Dias\Label;
use Dias\ImageLabel;
use Illuminate\Database\QueryException;

class ImageLabelController extends Controller
{
    /**
     * Shows all labels of the specified image.
     *
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
     * @param int $id Annotation ID
     * @return \Illuminate\Http\Response
     */
    public function index($id)
    {
        $image = Image::findOrFail($id);
        $this->authorize('access', $image);

        return $image->labels()
            ->select('id', 'label_id', 'user_id')
            ->get();
    }

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
     * @param int $id Image ID
     * @return \Illuminate\Http\Response
     */
    public function store($id)
    {
        $this->validate($this->request, Image::$attachLabelRules);
        $image = Image::findOrFail($id);
        $label = Label::findOrFail($this->request->input('label_id'));
        $this->authorize('attach-label', [$image, $label]);

        try {
            $imageLabel = new ImageLabel;
            $imageLabel->user()->associate($this->user);
            $imageLabel->label()->associate($label);
            $imageLabel->image()->associate($image);
            $imageLabel->save();
        } catch (QueryException $e) {
            abort(400, 'This label is already attached to the image.');
        }

        // should not be returned
        unset($imageLabel->image);

        return $imageLabel;
    }

    /**
     * Deletes the specified image label.
     *
     * @api {delete} image-labels/:id Detach a label
     * @apiGroup Images
     * @apiName DeleteImageLabels
     * @apiPermission projectEditor
     *
     * @apiParam {Number} id The image **label** ID (not the image ID).
     *
     * @param int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $imageLabel = ImageLabel::findOrFail($id);
        $this->authorize('destroy', $imageLabel);

        $imageLabel->delete();
    }
}
