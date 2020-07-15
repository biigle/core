<?php

namespace Biigle\Http\Controllers\Api\Annotations\Filters;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\ImageAnnotation;
use Biigle\Volume;
use Illuminate\Http\Request;

class AnnotationUserController extends Controller
{
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
    public function index(Request $request, $tid, $uid)
    {
        $volume = Volume::findOrFail($tid);
        $this->authorize('access', $volume);

        $user = $request->user();
        $session = $volume->getActiveAnnotationSession($user);

        if ($session) {
            $query = ImageAnnotation::allowedBySession($session, $user);
        } else {
            $query = ImageAnnotation::getQuery();
        }

        return $query->join('image_annotation_labels', 'image_annotations.id', '=', 'image_annotation_labels.annotation_id')
                ->where('image_annotation_labels.user_id', $uid)
                ->join('images', 'image_annotations.image_id', '=', 'images.id')
                ->where('images.volume_id', $tid)
                ->groupBy('images.id')
                ->pluck('images.id');
    }
}
