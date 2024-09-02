<?php

namespace Biigle\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Label;
use Biigle\Volume;
use DB;

class UsedFileLabelsController extends Controller
{
    /**
     * Get all file labels that were used in a volume.
     *
     * @api {get} volumes/:id/file-labels Get used file labels
     * @apiGroup Volumes
     * @apiName VolumeIndexUsedFileLabels
     * @apiPermission projectMember
     * @apiDescription Returns all image/video labels that were used in the volume.
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
     * @return \Illuminate\Database\Eloquent\Collection<int, Label>
     */
    public function index($id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);


        return Label::select('id', 'name', 'color', 'parent_id')
            ->whereExists(function ($query) use ($volume) {
                $filesModel = $volume->files()->getRelated();
                $filesTable = $filesModel->getTable();
                $relation = $filesModel->labels();
                $table = $relation->getRelated()->getTable();

                // take only labels that are attached to files of this volume
                $query->select(DB::raw(1))
                    ->from($table)
                    ->join($filesTable, $relation->getQualifiedForeignKeyName(), '=', $relation->getQualifiedParentKeyName())
                    ->where("{$filesTable}.volume_id", $volume->id)
                    ->whereRaw("{$table}.label_id = labels.id");
            })
            ->get();
    }
}
