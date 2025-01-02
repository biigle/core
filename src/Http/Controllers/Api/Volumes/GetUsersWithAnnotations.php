<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\ImageAnnotationLabel;
use Biigle\Volume;
use Biigle\MediaType;
use Illuminate\Http\Request;

class GetUsersWithAnnotations extends Controller
{
/**
     * Show all image annotations of the volume that have a specific label attached.
     *
     * @api {get} volumes/image/users-with-annotations/:vid Get users with annotations
     * @apiGroup Volumes
     * @apiName ShowUsersWithImageAnnotations
     * @apiParam {Number} vid The volume ID
     * @apiPermission projectMember
     * @apiDescription Returns the users with annotations
     *
     * @param Request $request
     * @param  int  $vid Volume ID
     * @param int $lid Label ID
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request, $vid)
    {
        $volume = Volume::findOrFail($vid);
        $this->authorize('access', $volume);
        if ($volume->media_type_id == MediaType::imageId()){
            $usersWithAnnotations = ImageAnnotationLabel::query()
                ->join('image_annotations', 'image_annotations.id', '=', 'image_annotation_labels.annotation_id')
                ->join('images', 'image_annotations.image_id', '=', 'images.id')
                ->where('images.volume_id', $vid)
                ->join('users', 'image_annotation_labels.user_id', '=', 'users.id')
                ->distinct('image_annotation_labels.user_id')
                ->select('image_annotation_labels.user_id', 'users.lastname', 'users.firstname')
                ->get();
        } else {
            $usersWithAnnotations = VideoAnnotationLabel::query()
                ->join('video_annotations', 'video_annotations.id', '=', 'video_annotation_labels.annotation_id')
                ->join('videos', 'video_annotations.video_id', '=', 'videos.id')
                ->whereIn('videos.volume_id', $vid)
                ->join('users', 'video_annotation_labels.user_id', '=', 'users.id')
                ->distinct('video_annotation_labels.user_id')
                ->select('video_annotation_labels.user_id', 'users.lastname', 'users.firstname')
                ->get();
        }

        return $usersWithAnnotations;
    }
};
