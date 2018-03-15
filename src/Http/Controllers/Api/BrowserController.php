<?php

namespace Biigle\Modules\Volumes\Http\Controllers\Api;

use Storage;
use Biigle\Volume;
use Biigle\Http\Controllers\Api\Controller;

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
                abort(404);
            }

            return $next($request);
        });
    }

    /**
     * List root directories in a storage disk.
     *
     * @api {get} volumes/browser/directories/:disk List root directories in a storage disk
     * @apiGroup Volumes
     * @apiName VolumeBrowserIndexRoot
     * @apiPermission user
     *
     * @apiParam {Number} disk Name of the storage disk to browse.
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    'images_1',
     *    'cruise_42',
     *    'kitten'
     * ]
     *
     * @param  string $disk
     * @return \Illuminate\Http\Response
     */
    public function indexRoot($disk)
    {
        if (!$this->diskAccessible($disk)) {
            abort(404);
        }

        return Storage::disk($disk)->directories();
    }

    /**
     * List directories in a storage disk.
     *
     * @api {get} volumes/browser/directories/:disk/:path List directories in a storage disk
     * @apiGroup Volumes
     * @apiName VolumeBrowserIndexDirectories
     * @apiPermission user
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
     * @param  string $disk
     * @param  string $path
     * @return \Illuminate\Http\Response
     */
    public function indexDirectories($disk, $path)
    {
        if (!$this->diskAccessible($disk)) {
            abort(404);
        }

        return $this->removePrefix($path, Storage::disk($disk)->directories($path));
    }

    /**
     * List images in a storage disk.
     *
     * @api {get} volumes/browser/images/:disk/:path List images in a storage disk
     * @apiGroup Volumes
     * @apiName VolumeBrowserIndexImages
     * @apiPermission user
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
     * @param  string $disk
     * @param  string $path
     * @return \Illuminate\Http\Response
     */
    public function indexImages($disk, $path)
    {
        if (!$this->diskAccessible($disk)) {
            abort(404);
        }

        $files = Storage::disk($disk)->files($path);

        return $this->removePrefix($path, preg_grep(Volume::FILE_REGEX, $files));
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
        $regex = "/^{$prefix}\/?/";
        return array_map(function ($item) use ($regex) {
            return preg_replace($regex, '', $item);
        }, $list);
    }
}
