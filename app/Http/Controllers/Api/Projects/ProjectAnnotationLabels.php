<?php

namespace Biigle\Http\Controllers\Api\Projects;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Label;
use Biigle\Project;
use Illuminate\Support\Facades\DB;

class ProjectAnnotationLabels extends Controller
{
    /**
     * Get all image labels and annotation count for a given project
     *
     * @api {get} projects/:pid/label-count Get annotation labels with a annotation count
     * @apiGroup Projects
     * @apiName test
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
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getProjectAnnotationLabelCounts($id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('access', $project);

        $imageLabelQuery = Label::query()
            ->join('image_annotation_labels', 'labels.id', '=', 'image_annotation_labels.label_id')
            ->join('image_annotations', 'image_annotation_labels.annotation_id', '=', 'image_annotations.id')
            ->join('images', 'image_annotations.image_id', '=', 'images.id')
            ->join('project_volume', 'images.volume_id', '=', 'project_volume.volume_id')
            ->where('project_volume.project_id', '=', $id)
            ->select('labels.*');

        $videoLabelQuery = Label::query()
            ->join('video_annotation_labels', 'labels.id', '=', 'video_annotation_labels.label_id')
            ->join('video_annotations', 'video_annotation_labels.annotation_id', '=', 'video_annotations.id')
            ->join('videos', 'video_annotations.video_id', '=', 'videos.id')
            ->join('project_volume', 'videos.volume_id', '=', 'project_volume.volume_id')
            ->where('project_volume.project_id', '=', $id)
            ->select('labels.*');

        $union = $videoLabelQuery->unionAll($imageLabelQuery);

        return DB::query()->fromSub($union, 'labels')
            ->selectRaw('labels.id, labels.name, labels.color, labels.label_tree_id, count(labels.id) as count')
            ->groupBy(['labels.id', 'labels.name', 'labels.color', 'labels.label_tree_id'])
            ->orderBy('labels.name')
            ->get();
    }
}
