<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Image;
use Biigle\Label;
use Biigle\ImageLabel;
use Biigle\ProjectVolume;
use Illuminate\Http\Request;
use Illuminate\Contracts\Auth\Guard;

class ProjectImageLabelController extends Controller
{
    /**
     * Shows all labels of the specified image that were attached through the specified project.
     *
     * @api {get} projects/:pid/images/:id/labels Get all labels of an image
     * @apiGroup Projects
     * @apiName IndexImageLabels
     * @apiPermission projectMember
     *
     * @apiParam {Number} pid The project ID.
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
     * @param int $pid Project ID
     * @param int $id Image ID
     * @return \Illuminate\Http\Response
     */
    public function index($pid, $id)
    {
        $image = Image::findOrFail($id);
        // TODO authorize('access-through-project', [$image, $pid])
        $this->authorize('access', $image);

        return $image->labels()
            ->where('project_volume_id', function ($query) use ($pid, $image) {
                return $query->select('id')
                    ->from('project_volume')
                    ->where('project_id', $pid)
                    ->where('volume_id', $image->volume_id);
            })
            ->select('id', 'label_id', 'user_id')
            ->get();
    }

    /**
     * Creates a new label for the specified image through the specified project.
     *
     * @api {post} projects/:pid/images/:id/labels Attach a label to an image
     * @apiGroup Projects
     * @apiName StoreImageLabels
     * @apiPermission projectEditor
     * @apiDescription Only labels may be used that belong to a label tree which is
     * attached to the project.
     *
     * @apiParam {Number} pid ID of the project to which the new image label should belong.
     * @apiParam {Number} id The image ID.
     *
     * @apiParam (Required arguments) {Number} label_id The ID of the label category to attach to the image.
     * @apiParamExample {String} Request example:
     * label_id: 1
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
     * @param int $pid Project ID
     * @param int $id Image ID
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request, Guard $auth, $pid, $id)
    {
        $this->validate($request, Image::$attachLabelRules);
        $image = Image::findOrFail($id);
        $label = Label::findOrFail($request->input('label_id'));
        $pivot = ProjectVolume::where('volume_id', $image->volume_id)
            ->where('project_id', $pid)
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
}
