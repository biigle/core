<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Image;
use Biigle\Label;
use Biigle\ImageLabel;
use Biigle\ProjectVolume;
use Illuminate\Http\Request;
use Illuminate\Contracts\Auth\Guard;

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
     * @apiDescription Only labels may be used that belong to a label tree which is
     * attached to the project specified by `project_id`.
     *
     * @apiParam {Number} id The image ID.
     *
     * @apiParam (Required arguments) {Number} project_id ID of the project to which the new image label should belong.
     * @apiParam (Required arguments) {Number} label_id The ID of the label category to attach to the image.
     * @apiParamExample {String} Request example:
     * label_id: 1
     * project_id: 1
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 1,
     *    "project_volume_id": 12,
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
     * @param Request $request
     * @param Guard $auth
     * @param int $id Image ID
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request, Guard $auth, $id)
    {
        $this->validate($request, Image::$attachLabelRules);
        $image = Image::findOrFail($id);
        $label = Label::findOrFail($request->input('label_id'));
        $pivot = ProjectVolume::where('volume_id', $image->volume_id)
            ->where('project_id', $request->input('project_id'))
            ->firstOrFail();
        $this->authorize('attach-label', [$image, $label, $pivot]);

        $imageLabel = new ImageLabel;
        $imageLabel->project_volume_id = $pivot->id;
        $imageLabel->user()->associate($auth->user());
        $imageLabel->label()->associate($label);
        $imageLabel->image()->associate($image);

        $exists = ImageLabel::where('label_id', $imageLabel->label_id)
            ->where('image_id', $imageLabel->image_id)
            ->where('project_volume_id', $imageLabel->project_volume_id)
            ->exists();

        if ($exists) {
            abort(400, 'This label is already attached to the image.');
        } else {
            $imageLabel->save();
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
