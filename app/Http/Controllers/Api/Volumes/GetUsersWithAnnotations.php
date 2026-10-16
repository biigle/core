<?php

namespace Biigle\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Volume;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
     * @return \Illuminate\Support\Collection
     */
    public function index(Request $request, $vid)
    {
        $volume = Volume::findOrFail($vid);
        $this->authorize('access', $volume);
        // Determine the distinct user IDs first and fetch the users only once.
        if ($volume->isImageVolume()) {
            $userIds = DB::table('image_annotation_labels')
                ->join('image_annotations', 'image_annotations.id', '=', 'image_annotation_labels.annotation_id')
                ->join('images', 'image_annotations.image_id', '=', 'images.id')
                ->where('images.volume_id', $volume->id)
                ->select('image_annotation_labels.user_id');
        } else {
            $userIds = DB::table('video_annotation_labels')
                ->join('video_annotations', 'video_annotations.id', '=', 'video_annotation_labels.annotation_id')
                ->join('videos', 'video_annotations.video_id', '=', 'videos.id')
                ->where('videos.volume_id', $volume->id)
                ->select('video_annotation_labels.user_id');
        }

        return DB::table('users')
            ->whereIn('id', $userIds)
            ->selectRaw("id as user_id, CONCAT(firstname, ' ', lastname) as name")
            ->orderBy('id')
            ->get();
    }
};
