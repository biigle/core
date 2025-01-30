<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api\Projects;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\ImageAnnotationLabel;
use Biigle\VideoAnnotationLabel;
use Biigle\Project;
use Illuminate\Http\Request;

class GetUsersWithAnnotations extends Controller
{
    /**
     * Get all users with annotations in the project
     *
     * @api {get} projects/:pid/users-with-annotations Get users with annotations
     * @apiGroup Projects
     * @apiName GetUsersWithAnnotationsProject
     * @apiParam {Number} pid The Project ID
     * @apiPermission projectMember
     * @apiDescription Returns the users with annotations in the project
     *
     * @param Request $request
     * @param  int  $pid Project ID
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request, $pid)
    {
        $project = Project::findOrFail($pid);
        $this->authorize('access', $project);
        $volumes = $project->volumes()->pluck('id');

        $usersWithImageAnnotations = ImageAnnotationLabel::query()
            ->join('image_annotations', 'image_annotations.id', '=', 'image_annotation_labels.annotation_id')
            ->join('images', 'image_annotations.image_id', '=', 'images.id')
            ->whereIn('images.volume_id', $volumes)
            ->join('users', 'image_annotation_labels.user_id', '=', 'users.id')
            ->distinct('image_annotation_labels.user_id')
            ->select('image_annotation_labels.user_id', 'users.lastname', 'users.firstname')
            ->get()->toArray();

        $usersWithVideoAnnotations = VideoAnnotationLabel::query()
            ->join('video_annotations', 'video_annotations.id', '=', 'video_annotation_labels.annotation_id')
            ->join('videos', 'video_annotations.video_id', '=', 'videos.id')
            ->whereIn('videos.volume_id', $volumes)
            ->join('users', 'video_annotation_labels.user_id', '=', 'users.id')
            ->distinct('video_annotation_labels.user_id')
            ->select('video_annotation_labels.user_id', 'users.lastname', 'users.firstname')
            ->get()->toArray();

        return array_merge($usersWithImageAnnotations, $usersWithVideoAnnotations);
    }
};
