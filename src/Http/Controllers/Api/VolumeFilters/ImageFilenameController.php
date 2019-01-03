<?php

namespace Biigle\Modules\Volumes\Http\Controllers\Api\VolumeFilters;

use Biigle\Volume;
use Biigle\Http\Controllers\Api\Controller;

class ImageFilenameController extends Controller
{
    /**
     * List the IDs of images with a filename matching the given pattern.
     *
     * @api {get} volumes/:id/images/filter/filename/:pattern Get images with matching filename
     * @apiGroup Volumes
     * @apiName VolumeImagesFilterFilename
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The volume ID
     * @apiParam {Number} pattern The filename pattern. May be a full filename like `abcde.jpg` or a pattern like `a*.jpg` where `*` matches any string of zero or more characters. Example: `a*.jpg` will match `abcde.jpg` as well as `a.jpg`. Example 2: `*3.jpg` will match `123.jpg` as well as `3.jpg`.
     *
     * @apiSuccessExample {json} Success response:
     * [1, 5, 6]
     *
     * @param  int  $id
     * @param  string  $pattern
     * @return \Illuminate\Http\Response
     */
    public function index($id, $pattern)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);

        if (\DB::connection() instanceof \Illuminate\Database\PostgresConnection) {
            $operator = 'ilike';
        } else {
            $operator = 'like';
        }

        return $volume->images()
            ->where('filename', $operator, str_replace('*', '%', $pattern))
            ->pluck('id');
    }
}
