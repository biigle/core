<?php

namespace Dias\Modules\Transects\Http\Controllers\Api;

use DB;
use Dias\Transect;
use Dias\Label;
use Dias\Http\Controllers\Api\Controller;

class TransectImageLabelController extends Controller
{
    /**
     * Find a label in all image labels that were used in a transect
     *
     * @api {get} transects/:id/image-labels/find/:pattern Find a label in all image labels that were used in a transect
     * @apiGroup Transects
     * @apiName TransectFindImageLabel
     * @apiPermission projectMember
     * @apiDescription Returns only the first 10 matches
     *
     * @apiParam {Number} id The transect ID
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
                // take only labels that are attached to images of this transect
                $query->select(DB::raw(1))
                    ->from('image_labels')
                    ->join('images', 'image_labels.image_id', '=', 'images.id')
                    ->where('images.transect_id', $id)
                    ->whereRaw('image_labels.label_id = labels.id');
            })
            ->take(10)
            ->get();
    }
}
