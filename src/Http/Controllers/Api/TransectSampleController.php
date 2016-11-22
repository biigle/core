<?php

namespace Dias\Modules\Projects\Http\Controllers\Api;

use Cache;
use Dias\Image;
use Dias\Transect;
use Dias\Http\Controllers\Api\Controller;

class TransectSampleController extends Controller
{
    /**
     * Get sample transect images
     *
     * @api {get} transects/:id/sample/:number Get sample transect images
     * @apiGroup Transects
     * @apiName IndexSampleTransectImages
     * @apiPermission member
     * @apiParam {Number} id ID of the transect
     * @apiParam (Optional) {Number} number Number of sample images to return. Default is `10`.
     * @apiDescription Returns the UUIDs of evenly distributed sample images of the transect. The images are ordered by filemane before sampling. If the number to return is higher than the number of transect images, only the UUIDs of all transect images are returned.
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
     * @param id $id transect ID
     * @param number $number Number of samples to return
     *
     * @return \Illuminate\Http\Response
     */
    public function index($id, $number = 10)
    {
        $transect = Transect::select('id')->findOrFail($id);
        $this->authorize('access', $transect);

        // We can cache this for 1 hour because it's unlikely to change as long as the
        // transect exists.
        return Cache::remember("transect-sample-{$id}-{$number}", 60, function () use ($transect, $number) {

            $total = $transect->images()->count();
            $query = $transect->orderedImages();
            $step = round($total / $number);

            /*
             * This is how the images should be chosen (x):
             * Maxbe $number must be event fr this to work??
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
             */

            // This is a preliminary (easy) version that simply chunks the transect into
            // $number parts and takes the first image of each chunk. The method described
            // above would produce a better overview of the transect, though, and should
            // be implemented sometime.
            if ($step <= 1) {
                return $query->pluck('uuid');
            }

            $ids = $transect->images()->pluck('id')->filter(function ($v, $k) use ($step) {
                return $k % $step === 0;
            });

            return $query->whereIn('id', $ids)->pluck('uuid');
        });
    }
}
