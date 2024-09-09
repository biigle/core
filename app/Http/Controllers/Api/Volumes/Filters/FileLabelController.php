<?php

namespace Biigle\Http\Controllers\Api\Volumes\Filters;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Volume;

class FileLabelController extends Controller
{
    /**
     * List the IDs of images/videos having the specified label attached.
     *
     * @api {get} volumes/:vid/files/filter/labels/:lid Get files with a certain label
     * @apiGroup Volumes
     * @apiName VolumeFilesHasFileLabel
     * @apiPermission projectMember
     * @apiDescription Returns IDs of images/videos having the specified label attached to them.
     *
     * @apiParam {Number} vid The volume ID
     * @apiParam {Number} lid The label ID
     *
     * @apiSuccessExample {json} Success response:
     * [1, 5, 6]
     *
     * @param  int  $vid
     * @param  int  $lid
     * @return \Illuminate\Support\Collection
     */
    public function index($vid, $lid)
    {
        $volume = Volume::findOrFail($vid);
        $this->authorize('access', $volume);

        $relation = $volume->files()->getRelated()->labels();
        $table = $relation->getRelated()->getTable();

        return $volume->files()
            ->join($table, $relation->getQualifiedParentKeyName(), '=', $relation->getQualifiedForeignKeyName())
            ->where("{$table}.label_id", $lid)
            ->distinct()
            ->pluck($relation->getQualifiedParentKeyName());
    }
}
