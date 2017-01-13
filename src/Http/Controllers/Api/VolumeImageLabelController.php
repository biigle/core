<?php

namespace Biigle\Modules\Volumes\Http\Controllers\Api;

use DB;
use Biigle\Label;
use Biigle\Volume;
use Biigle\Http\Controllers\Api\Controller;

class VolumeImageLabelController extends Controller
{
    /**
     * Find a label in all image labels that were used in a volume
     *
     * @api {get} volumes/:id/image-labels/find/:pattern Find a label in all image labels that were used in a volume
     * @apiGroup Volumes
     * @apiName VolumeFindImageLabel
     * @apiPermission projectMember
     * @apiDescription Returns only the first 10 matches
     *
     * @apiParam {Number} id The volume ID
     * @apiParam {String} pattern Part of the label name to find
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
     * @param  string  $pattern
     * @return \Illuminate\Http\Response
     */
    public function findLabel($id, $pattern) {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);

        if (DB::connection() instanceof \Illuminate\Database\PostgresConnection) {
            $operator = 'ilike';
        } else {
            $operator = 'like';
        }

        return Label::select('id', 'name', 'color', 'parent_id')
            ->where('name', $operator, "%{$pattern}%")
            ->whereExists(function ($query) use ($id) {
                // take only labels that are attached to images of this volume
                $query->select(DB::raw(1))
                    ->from('image_labels')
                    ->join('images', 'image_labels.image_id', '=', 'images.id')
                    ->where('images.volume_id', $id)
                    ->whereRaw('image_labels.label_id = labels.id');
            })
            ->take(10)
            ->get();
    }
}
