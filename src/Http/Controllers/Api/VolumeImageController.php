<?php

namespace Biigle\Modules\Annotations\Http\Controllers\Api;

use Biigle\Volume;
use Biigle\Annotation;
use Illuminate\Http\Request;
use Biigle\Http\Controllers\Api\Controller;

class VolumeImageController extends Controller
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
    public function hasAnnotation(Request $request, $id)
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

    /**
     * List the IDs of images having one or more annotations of the specified user.
     *
     * @api {get} volumes/:tid/images/filter/annotation-user/:uid Get all images having annotations of a user
     * @apiGroup Volumes
     * @apiName VolumeImagesHasUser
     * @apiPermission projectMember
     * @apiDescription Returns IDs of images having one or more annotations of the specified user. If there is an active annotation session, images with annotations hidden by the session are not returned.
     *
     * @apiParam {Number} tid The volume ID
     * @apiParam {Number} uid The user ID
     *
     * @apiSuccessExample {json} Success response:
     * [1, 5, 6]
     *
     * @param Request $request
     * @param  int  $tid
     * @param  int  $uid
     * @return \Illuminate\Http\Response
     */
    public function hasAnnotationUser(Request $request, $tid, $uid)
    {
        $volume = Volume::findOrFail($tid);
        $this->authorize('access', $volume);

        $user = $request->user();
        $session = $volume->getActiveAnnotationSession($user);

        if ($session) {
            $query = Annotation::allowedBySession($session, $user);
        } else {
            $query = Annotation::getQuery();
        }

        return $query->join('annotation_labels', 'annotations.id', '=', 'annotation_labels.annotation_id')
                ->where('annotation_labels.user_id', $uid)
                ->join('images', 'annotations.image_id', '=', 'images.id')
                ->where('images.volume_id', $tid)
                ->groupBy('images.id')
                ->pluck('images.id');
    }
}
