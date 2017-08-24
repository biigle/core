<?php

namespace Biigle\Modules\Projects\Http\Controllers\Api;

use Cache;
use Biigle\Image;
use Biigle\Volume;
use Biigle\Http\Controllers\Api\Controller;

class VolumeSampleController extends Controller
{
    /**
     * Get sample volume images.
     *
     * @api {get} volumes/:id/sample/:number Get sample volume images
     * @apiGroup Volumes
     * @apiName IndexSampleVolumeImages
     * @apiPermission member
     * @apiParam {Number} id ID of the volume
     * @apiParam (Optional) {Number} number Number of sample images to return. Default is `10`.
     * @apiDescription Returns the UUIDs of evenly distributed sample images of the volume. The images are ordered by filemane before sampling. If the number to return is higher than the number of volume images, only the UUIDs of all volume images are returned.
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    "8b7e75f5-89a6-482b-8ca6-4bc2d6cabb92",
     *    "f3f244af-9ca9-4cdc-816c-ef722b93f231",
     *    "d51bcf5f-6757-4cf7-aea2-b9643ee77242",
     *    "349d0973-616c-430f-a5a0-9c25bd4846ad",
     *    "26fdf7d8-1147-42bf-90ac-e3a9e86c9c4a"
     * ]
     *
     * @param id $id volume ID
     * @param number $number Number of samples to return
     *
     * @return \Illuminate\Http\Response
     */
    public function index($id, $number = 10)
    {
        $volume = Volume::select('id')->findOrFail($id);
        $this->authorize('access', $volume);

        // We can cache this for 1 hour because it's unlikely to change as long as the
        // volume exists.
        return Cache::remember("volume-sample-{$id}-{$number}", 60, function () use ($volume, $number) {
            $total = $volume->images()->count();
            $query = $volume->orderedImages();
            $step = round($total / $number);

            /*
             * This is how I would like to pick the images (x):
             * Maxbe $number must be even for this to work??
             *
             *             image
             *          1 2 3 4 5 6 7
             *        1 x o o o o o o
             *        2 x o o o o o x
             * number 3 x o o x o o x
             *        4 x o x o x o x
             *        5 x x o x o x x
             *        6 ? ? ? ? ? ? ?
             *        7 x x x x x x x
             *
             *  I didn't get this to work so I implemented a simple preliminary version
             *  that chunks the volume into $number parts and takes the first image of
             *  each chunk. The method described above would produce a better overview
             *  of the volume, though, and should be implemented sometime.
             */

            if ($step <= 1) {
                return $query->pluck('uuid');
            }

            $ids = $volume->images()->pluck('id')->filter(function ($v, $k) use ($step) {
                return $k % $step === 0;
            });

            return $query->whereIn('id', $ids)->pluck('uuid');
        });
    }
}
