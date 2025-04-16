<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\ImageAnnotationLabel;
use Biigle\VideoAnnotationLabel;
use Biigle\Volume;
use Illuminate\Http\Request;

class GetUsersWithAnnotations extends Controller
{
    /**
     * Get users with at least one annotation in the volume
     *
     * @api {get} volumes/:vid/users-with-annotations Get users with annotations
     * @apiGroup Volumes
     * @apiName GetUsersWithAnnotationsVolume
     * @apiParam {Number} vid The volume ID
     * @apiPermission projectMember
     * @apiDescription Returns the users with annotations in the volume
     *
     * @param Request $request
     * @param int $vid Volume ID
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request, $vid)
    {
        $volume = Volume::findOrFail($vid);
        $this->authorize('access', $volume);
        if ($volume->isImageVolume()) {
            $usersWithAnnotations = ImageAnnotationLabel::query()
                ->join('image_annotations', 'image_annotations.id', '=', 'image_annotation_labels.annotation_id')
                ->join('images', 'image_annotations.image_id', '=', 'images.id')
                ->where('images.volume_id', $vid)
                ->join('users', 'image_annotation_labels.user_id', '=', 'users.id');
        } else {
            $usersWithAnnotations = VideoAnnotationLabel::query()
                ->join('video_annotations', 'video_annotations.id', '=', 'video_annotation_labels.annotation_id')
                ->join('videos', 'video_annotations.video_id', '=', 'videos.id')
                ->where('videos.volume_id', $vid)
                ->join('users', 'video_annotation_labels.user_id', '=', 'users.id');
        }

        return $usersWithAnnotations
            ->distinct('user_id')
            ->selectRaw("user_id, CONCAT(users.firstname, ' ', users.lastname) as name")
            ->get();
    }
};
