<?php

namespace Biigle\Http\Controllers\Api\Volumes\Filters;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Volume;

class FileLabelUserController extends Controller
{
    /**
     * List the IDs of images/videos having one or more labels attached by the specified user.
     *
     * @api {get} volumes/:vid/files/filter/labels/users/:uid Get files with labels by a user
     * @apiGroup Volumes
     * @apiName VolumeFilesHasLabelUser
     * @apiPermission projectMember
     * @apiDescription Returns IDs of images/videos having one or more image/video labels attached by the specified user.
     *
     * @apiParam {Number} vid The volume ID
     * @apiParam {Number} uid The user ID
     *
     * @apiSuccessExample {json} Success response:
     * [1, 5, 6]
     *
     * @param  int  $vid
     * @param  int  $uid
     * @return \Illuminate\Support\Collection
     */
    public function index($vid, $uid)
    {
        $volume = Volume::findOrFail($vid);
        $this->authorize('access', $volume);

        $relation = $volume->files()->getRelated()->labels();
        $table = $relation->getRelated()->getTable();

        return $volume->files()
            ->join($table, $relation->getQualifiedParentKeyName(), '=', $relation->getQualifiedForeignKeyName())
            ->where("{$table}.user_id", $uid)
            ->distinct()
            ->pluck($relation->getQualifiedParentKeyName());
    }
}
