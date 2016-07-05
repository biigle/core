<?php

namespace Dias\Modules\Annotations\Http\Controllers\Api;

use DB;
use Dias\Transect;
use Dias\Label;
use Dias\Http\Controllers\Api\Controller;

class TransectLabelController extends Controller
{
    /**
     * Find a label category in all categories that were used in a transect
     *
     * @api {get} transects/:id/annotation-labels/find/:pattern Find a label category in all categories that were used in a transect
     * @apiGroup Transects
     * @apiName TransectFindLabel
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The transect ID
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
    public function find($id, $pattern) {
        $transect = Transect::findOrFail($id);
        $this->authorize('access', $transect);

        if (DB::connection() instanceof \Illuminate\Database\PostgresConnection) {
            $operator = 'ilike';
        } else {
            $operator = 'like';
        }

        return Label::select('id', 'name', 'color', 'parent_id')
            ->where('name', $operator, "%{$pattern}%")
            ->whereExists(function ($query) use ($id) {
                // take only labels that are used in annotations of this transect
                $query->select(DB::raw(1))
                    ->from('images')
                    ->join('annotations', 'images.id', '=', 'annotations.image_id')
                    ->join('annotation_labels', 'annotations.id', '=', 'annotation_labels.annotation_id')
                    ->where('images.transect_id', $id)
                    ->whereRaw('annotation_labels.label_id = labels.id');
            })
            ->take(10)
            ->get();
    }
}
