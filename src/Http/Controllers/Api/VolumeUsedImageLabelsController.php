<?php

namespace Biigle\Modules\Volumes\Http\Controllers\Api;

use DB;
use Biigle\Label;
use Biigle\Volume;
use Biigle\Http\Controllers\Api\Controller;

class VolumeUsedImageLabelsController extends Controller
{
    /**
     * Get all image labels that were used in a volume.
     *
     * @api {get} volumes/:id/image-labels Get used image labels
     * @apiGroup Volumes
     * @apiName VolumeIndexUsedImageLabels
     * @apiPermission projectMember
     * @apiDescription Returns all image labels that were used in the volume.
     *
     * @apiParam {Number} id The volume ID
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "name": "Quality",
     *       "parent_id": null,
     *       "color": "0099ff"
     *    },
     *    {
     *       "id": 2,
     *       "name": "Bad quality",
     *       "parent_id": 1,
     *       "color": "9900ff"
     *    }
     * ]
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function index($id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);

        return Label::select('id', 'name', 'color', 'parent_id')
            ->whereExists(function ($query) use ($id) {
                // take only labels that are attached to images of this volume
                $query->select(DB::raw(1))
                    ->from('image_labels')
                    ->join('images', 'image_labels.image_id', '=', 'images.id')
                    ->where('images.volume_id', $id)
                    ->whereRaw('image_labels.label_id = labels.id');
            })
            ->get();
    }
}
