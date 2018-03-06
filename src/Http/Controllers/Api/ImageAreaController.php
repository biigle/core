<?php

namespace Biigle\Modules\Annotations\Http\Controllers\Api;

use Biigle\Image;
use Biigle\Http\Controllers\Api\Controller;

class ImageAreaController extends Controller
{
    /**
     * Get the area of an image in m²
     *
     * @api {get} images/:id/area Get the area of an image in m²
     * @apiGroup Images
     * @apiName ImagesShowArea
     * @apiPermission projectMember
     * @apiDescription The area may be provided by image metadata or laser point detection (if available). Returns `-1` if no area is available.
     *
     * @apiParam {Number} id The image ID
     *
     * @apiSuccessExample Success response:
     * 4.49
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $image = Image::findOrFail($id);
        $this->authorize('access', $image);

        if (array_has($image->metadata, 'area')) {
            return $image->metadata['area'];
        } else if (array_has($image->attrs, 'laserpoints.area')) {
            return $image->attrs['laserpoints']['area'];
        }

        return -1;
    }
}
