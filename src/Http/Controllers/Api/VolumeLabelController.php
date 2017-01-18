<?php

namespace Biigle\Modules\Annotations\Http\Controllers\Api;

use DB;
use Biigle\Label;
use Biigle\Volume;
use Biigle\Http\Controllers\Api\Controller;

class VolumeLabelController extends Controller
{
    /**
     * Find a label category in all categories that were used in a volume.
     *
     * @api {get} volumes/:id/annotation-labels/find/:pattern Find a label category in all categories that were used in a volume
     * @apiGroup Volumes
     * @apiName VolumeFindLabel
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The volume ID
     * @apiParam {String} pattern Part of the label name to find
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "name": "Benthic Object",
     *       "parent_id": null,
     *       "color": "0099ff"
     *    },
     *    {
     *       "id": 2,
     *       "name": "Coral",
     *       "parent_id": 1,
     *       "color": "9900ff"
     *    }
     * ]
     *
     * @param  int  $id
     * @param  string  $pattern
     * @return \Illuminate\Http\Response
     */
    public function find($id, $pattern)
    {
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
                // take only labels that are used in annotations of this volume
                $query->select(DB::raw(1))
                    ->from('images')
                    ->join('annotations', 'images.id', '=', 'annotations.image_id')
                    ->join('annotation_labels', 'annotations.id', '=', 'annotation_labels.annotation_id')
                    ->where('images.volume_id', $id)
                    ->whereRaw('annotation_labels.label_id = labels.id');
            })
            ->take(10)
            ->get();
    }
}
