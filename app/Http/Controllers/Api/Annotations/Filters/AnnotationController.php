<?php

namespace Biigle\Http\Controllers\Api\Annotations\Filters;

use Biigle\Annotation;
use Biigle\Http\Controllers\Api\Controller;
use Biigle\Volume;
use Illuminate\Http\Request;

class AnnotationController extends Controller
{
    /**
     * List the IDs of images having one or more annotations.
     *
     * @api {get} volumes/:id/images/filter/annotations Get images having annotations
     * @apiGroup Volumes
     * @apiName VolumeImagesHasAnnotation
     * @apiPermission projectMember
     * @apiDescription Returns IDs of images having one or more annotations. If there is an active annotation session, images with annotations hidden by the session are not returned.
     *
     * @apiParam {Number} id The volume ID
     *
     * @apiSuccessExample {json} Success response:
     * [1, 5, 6]
     *
     * @param Request $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request, $id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);

        $user = $request->user();
        $session = $volume->getActiveAnnotationSession($user);

        if ($session) {
            $query = Annotation::allowedBySession($session, $user);
        } else {
            $query = Annotation::getQuery();
        }

        return $query->join('images', 'images.id', '=', 'annotations.image_id')
            ->where('images.volume_id', $id)
            ->groupBy('images.id')
            ->pluck('images.id');
    }
}
