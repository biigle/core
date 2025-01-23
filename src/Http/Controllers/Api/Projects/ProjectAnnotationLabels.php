<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api\Projects;

use Biigle\Project;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Biigle\Http\Controllers\Api\Controller;

class ProjectAnnotationLabels extends Controller
{
    /**
     * Get all image labels and annotation count for a given project
     * 
     * @api {get} projects/:pid/labels-count Get annotation labels with a annotation count
     * @apiGroup Projects
     * @apiName test
     * @apiParam {Number} id The Project ID
     * @apiPermission projectMember
     * @apiDescription Returns a collection of project image labels and annotation label counts
     * 
     * @apiSuccessExample {json} Success response:
     * [{"id":1,
     * "name":"a",
     * "color":"f2617c",
     * "parent_id":null,
     * "label_tree_id":1,
     * "source_id":null,
     * "label_source_id":null,
     * "uuid":"6d2e6061-9ed1-41df-92f0-4862d0d4b12e",
     * "count":10}]
     *
     * @param int $id Project ID
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getProjectAnnotationLabelCounts($id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('access', $project);

        $imageLabelQuery = DB::table('labels')
        ->join('image_annotation_labels', 'labels.id', '=', 'image_annotation_labels.label_id')
        ->join('image_annotations', 'image_annotation_labels.annotation_id', '=', 'image_annotations.id')
        ->join('images', 'image_annotations.image_id', '=', 'images.id')
        ->join('project_volume', 'images.volume_id', '=', 'project_volume.volume_id')
        ->where('project_volume.project_id','=',$id)
        ->select('labels.*');

        $videoLabelQuery = DB::table('labels')
        ->join('video_annotation_labels', 'labels.id', '=', 'video_annotation_labels.label_id')
        ->join('video_annotations', 'video_annotation_labels.annotation_id', '=', 'video_annotations.id')
        ->join('videos', 'video_annotations.video_id', '=', 'videos.id')
        ->join('project_volume', 'videos.volume_id', '=', 'project_volume.volume_id')
        ->where('project_volume.project_id','=',$id)
        ->select('labels.*');

        $labelColumns = Schema::getColumnListing('labels');
        $union = $videoLabelQuery->unionAll($imageLabelQuery);

        return DB::query()->fromSub($union, 'labels')
        ->select('labels.*', DB::raw('COUNT(labels.id) as count'))
        ->groupBy(array_map(fn($column) => "labels.$column", $labelColumns))
        ->get();
    }
}