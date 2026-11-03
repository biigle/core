<?php

namespace Biigle\Http\Controllers\Api\Projects;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Project;
use Illuminate\Support\Facades\DB;

class ProjectAnnotationLabels extends Controller
{
    /**
     * Get all image labels and annotation count for a given project
     *
     * @api {get} projects/:id/label-count Get annotation labels with a annotation count
     * @apiGroup Projects
     * @apiName GetProjectAnnotationLabelCounts
     * @apiParam {Number} id The Project ID
     * @apiPermission projectMember
     * @apiDescription Returns a collection of annotation labels and their counts in the project
     *
     * @apiSuccessExample {json} Success response:
     * [{"id":1,
     * "name":"a",
     * "color":"f2617c",
     * "label_tree_id":1,
     * "count":10}]
     *
     * @param int $id Project ID
     * @return \Illuminate\Support\Collection
     */
    public function getProjectAnnotationLabelCounts($id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('access', $project);

        // Count the annotation labels per label first and join the labels only once
        // with the (much smaller) result.
        $imageCountQuery = DB::table('image_annotation_labels')
            ->join('image_annotations', 'image_annotation_labels.annotation_id', '=', 'image_annotations.id')
            ->join('images', 'image_annotations.image_id', '=', 'images.id')
            ->join('project_volume', 'images.volume_id', '=', 'project_volume.volume_id')
            ->where('project_volume.project_id', '=', $id)
            ->select('image_annotation_labels.label_id')
            ->selectRaw('count(*) as count')
            ->groupBy('image_annotation_labels.label_id');

        $videoCountQuery = DB::table('video_annotation_labels')
            ->join('video_annotations', 'video_annotation_labels.annotation_id', '=', 'video_annotations.id')
            ->join('videos', 'video_annotations.video_id', '=', 'videos.id')
            ->join('project_volume', 'videos.volume_id', '=', 'project_volume.volume_id')
            ->where('project_volume.project_id', '=', $id)
            ->select('video_annotation_labels.label_id')
            ->selectRaw('count(*) as count')
            ->groupBy('video_annotation_labels.label_id');

        $union = $videoCountQuery->unionAll($imageCountQuery);

        return DB::query()->fromSub($union, 'counts')
            ->join('labels', 'labels.id', '=', 'counts.label_id')
            // Cast the sum to bigint so it is returned as integer like count().
            ->selectRaw('labels.id, labels.name, labels.color, labels.label_tree_id, sum(counts.count)::bigint as count')
            ->groupBy(['labels.id', 'labels.name', 'labels.color', 'labels.label_tree_id'])
            ->orderBy('labels.name')
            ->get();
    }
}
