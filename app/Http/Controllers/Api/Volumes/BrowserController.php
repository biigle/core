<?php

namespace Biigle\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Volume;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Storage;

class BrowserController extends Controller
{
    /**
     * Instantiate a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            if (!config('volumes.browser')) {
                abort(Response::HTTP_NOT_FOUND);
            }

            return $next($request);
        });
    }

    /**
     * List directories in a storage disk.
     *
     * @api {get} volumes/browser/directories/:disk List directories
     * @apiGroup Volume_Browser
     * @apiName VolumeBrowserIndexDirectories
     * @apiPermission user
     * @apiDescription The volume browser can be disabled for a BIIGLE instance.
     *
     * @apiParam {Number} disk Name of the storage disk to browse.
     * @apiParam {Number} path Path in the storage disk to list directories for.
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    'images_1_1',
     *    'images_1_2',
     *    'images_1_3',
     * ]
     *
     * @param  Request $request
     * @param  string $disk
     * @return \Illuminate\Http\Response
     */
    public function indexDirectories(Request $request, $disk)
    {
        if (!$this->diskAccessible($disk)) {
            abort(Response::HTTP_NOT_FOUND);
        }

        if ($request->has('path')) {
            $path = $request->input('path', '');
            $directories = Storage::disk($disk)->directories($path);

            return $this->removePrefix($path, $directories);
        }

        return Storage::disk($disk)->directories();
    }

    /**
     * List images in a storage disk.
     *
     * @api {get} volumes/browser/images/:disk List images
     * @apiGroup Volume_Browser
     * @apiName VolumeBrowserIndexImages
     * @apiPermission user
     * @apiDescription The volume browser can be disabled for a BIIGLE instance.
     *
     * @apiParam {Number} disk Name of the storage disk to browse.
     * @apiParam {Number} path Path in the storage disk to list images for.
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    'image_1.jpg',
     *    'image_2.jpg',
     *    'image_3.jpg',
     * ]
     *
     * @param  Request $request
     * @param  string $disk
     * @return \Illuminate\Http\Response
     */
    public function indexImages(Request $request, $disk)
    {
        return $this->indexFiles($request, $disk, Volume::IMAGE_FILE_REGEX);
    }

    /**
     * List videos in a storage disk.
     *
     * @api {get} volumes/browser/videos/:disk List videos
     * @apiGroup Volume_Browser
     * @apiName VolumeBrowserIndexVideos
     * @apiPermission user
     * @apiDescription The volume browser can be disabled for a BIIGLE instance.
     *
     * @apiParam {Number} disk Name of the storage disk to browse.
     * @apiParam {Number} path Path in the storage disk to list videos for.
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    'video_1.mp4',
     *    'video_2.mp4',
     *    'video_3.mp4',
     * ]
     *
     * @param  Request $request
     * @param  string $disk
     * @return \Illuminate\Http\Response
     */
    public function indexVideos(Request $request, $disk)
    {
        return $this->indexFiles($request, $disk, Volume::VIDEO_FILE_REGEX);
    }

    /**
     * List files filtered by a regex in a storage disk.
     *
     * @param Request $request
     * @param string $disk
     * @param string $regex
     *
     * @return \Illuminate\Http\Response
     */
    protected function indexFiles(Request $request, $disk, $regex)
    {
        if (!$this->diskAccessible($disk)) {
            abort(Response::HTTP_NOT_FOUND);
        }
        $path = $request->input('path', '');
        // Use array_values to discard keys. This ensures the JSON returned by this
        // endpoint is an array, not an object.
        $files = array_values(preg_grep($regex, Storage::disk($disk)->files($path)));

        return $this->removePrefix($path, $files);
    }

    /**
     * Determines if a storage disk is accessible.
     *
     * @param string $disk
     *
     * @return bool
     */
    protected function diskAccessible($disk)
    {
        return in_array($disk, config('volumes.browser_disks')) &&
            in_array($disk, array_keys(config('filesystems.disks')));
    }

    /**
     * Removes a prefix from all strings in an array.
     *
     * @param string $prefix
     * @param array $list
     *
     * @return array
     */
    protected function removePrefix($prefix, $list)
    {
        $regex = "!^{$prefix}/?!";

        return array_map(function ($item) use ($regex) {
            return preg_replace($regex, '', $item);
        }, $list);
    }
}
