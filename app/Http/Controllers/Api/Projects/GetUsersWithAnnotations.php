<?php

namespace Biigle\Http\Controllers\Api\Projects;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
     * @return \Illuminate\Support\Collection
     */
    public function index(Request $request, $pid)
    {
        $project = Project::findOrFail($pid);
        $this->authorize('access', $project);
        $volumes = fn ($query) => $query->select('volume_id')
            ->from('project_volume')
            ->where('project_id', $project->id);

        // Determine the distinct user IDs first and fetch the users only once.
        $imageUserIds = DB::table('image_annotation_labels')
            ->join('image_annotations', 'image_annotations.id', '=', 'image_annotation_labels.annotation_id')
            ->join('images', 'image_annotations.image_id', '=', 'images.id')
            ->whereIn('images.volume_id', $volumes)
            ->select('image_annotation_labels.user_id');

        $videoUserIds = DB::table('video_annotation_labels')
            ->join('video_annotations', 'video_annotations.id', '=', 'video_annotation_labels.annotation_id')
            ->join('videos', 'video_annotations.video_id', '=', 'videos.id')
            ->whereIn('videos.volume_id', $volumes)
            ->select('video_annotation_labels.user_id');

        return DB::table('users')
            ->whereIn('id', $imageUserIds->union($videoUserIds))
            ->selectRaw("id as user_id, CONCAT(firstname, ' ', lastname) as name")
            ->orderBy('id')
            ->get();
    }
};
