<?php

namespace Biigle\Http\Controllers\Api\Volumes\Filters;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Volume;

class FilenameController extends Controller
{
    /**
     * List the IDs of files with a filename matching the given pattern.
     *
     * @api {get} volumes/:id/files/filter/filename/:pattern Get files with matching filename
     * @apiGroup Volumes
     * @apiName VolumeFilesFilterFilename
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
     * @return \Illuminate\Support\Collection
     */
    public function index($id, $pattern)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);

        // Escape trailing backslashes, else there would be an error with ilike.
        $pattern = preg_replace('/\\\\$/', '\\\\\\\\', $pattern);

        return $volume->files()
            ->where('filename', 'ilike', str_replace('*', '%', $pattern))
            ->pluck('id');
    }
}
