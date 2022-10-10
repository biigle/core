<?php

namespace Biigle\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Volume;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use InvalidArgumentException;
use Storage;

class BrowserController extends Controller
{
    /**
     * List directories in a storage disk.
     *
     * @api {get} volumes/browser/directories/:disk List directories
     * @apiGroup Volume_Browser
     * @apiName VolumeBrowserIndexDirectories
     * @apiPermission editor
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
        if (Gate::denies('use-disk', $disk)) {
            abort(Response::HTTP_NOT_FOUND);
        }

        try {
            $disk = Storage::disk($disk);
        } catch (InvalidArgumentException $e) {
            abort(Response::HTTP_NOT_FOUND);
        }

        if ($request->has('path')) {
            $path = $request->input('path', '');
            $directories = $disk->directories($path);

            return $this->removePrefix($path, $directories);
        }

        $directories = $disk->directories();

        natsort($directories);

        return array_values($directories);
    }

    /**
     * List images in a storage disk.
     *
     * @api {get} volumes/browser/images/:disk List images
     * @apiGroup Volume_Browser
     * @apiName VolumeBrowserIndexImages
     * @apiPermission editor
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
        if (Gate::denies('use-disk', $disk)) {
            abort(Response::HTTP_NOT_FOUND);
        }

        return $this->indexFiles($request, $disk, Volume::IMAGE_FILE_REGEX);
    }

    /**
     * List videos in a storage disk.
     *
     * @api {get} volumes/browser/videos/:disk List videos
     * @apiGroup Volume_Browser
     * @apiName VolumeBrowserIndexVideos
     * @apiPermission editor
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
        if (Gate::denies('use-disk', $disk)) {
            abort(Response::HTTP_NOT_FOUND);
        }

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
        $path = $request->input('path', '');
        try {
            $disk = Storage::disk($disk);
        } catch (InvalidArgumentException $e) {
            abort(Response::HTTP_NOT_FOUND);
        }
        // Use array_values to discard keys. This ensures the JSON returned by this
        // endpoint is an array, not an object.
        $files = array_values(preg_grep($regex, $disk->files($path)));

        natsort($files);

        return $this->removePrefix($path, array_values($files));
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
        $prefix = preg_quote($prefix);
        $regex = "!^{$prefix}/?!";

        return array_map(function ($item) use ($regex) {
            return preg_replace($regex, '', $item);
        }, $list);
    }
}
