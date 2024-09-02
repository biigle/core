<?php

namespace Biigle\Http\Controllers\Api\Annotations;

use Arr;
use Biigle\Http\Controllers\Api\Controller;
use Biigle\Image;
use Biigle\Volume;

class VolumeImageAreaController extends Controller
{
    /**
     * Get the area of the images of a volume in m².
     *
     * @api {get} volumes/:id/images/area Get image areas
     * @apiGroup Volumes
     * @apiName VolumesIndexImageArea
     * @apiPermission projectMember
     * @apiDescription Returns a map from image ID to area in m². The area may be provided by image metadata or laser point detection (if available). `-1` means no area is available for an image.
     *
     * @apiParam {Number} id The volume ID
     *
     * @apiSuccessExample Success response:
     * {
     *    "123": 4.49
     * }
     *
     * @param  int  $id
     * @return \Illuminate\Support\Collection<int|string, mixed>
     */
    public function index($id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);
        $images = $volume->images()->pluck('attrs', 'id');

        return $images->map(function ($attrs) {
            if (Arr::has($attrs, 'metadata.area')) {
                return $attrs['metadata']['area'];
            } elseif (Arr::has($attrs, 'laserpoints.area')) {
                return $attrs['laserpoints']['area'];
            }

            return -1;
        });
    }
}
