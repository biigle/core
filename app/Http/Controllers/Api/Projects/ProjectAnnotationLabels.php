<?php

namespace Biigle\Http\Controllers\Api\Projects;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Project;
use Biigle\Traits\CompileFilters;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProjectAnnotationLabels extends Controller
{
    use CompileFilters;

    /**
     * Get all image labels and annotation count for a given project
     *
     * @api {get} projects/:id/label-count Get annotation labels with a annotation count
     * @apiGroup Projects
     * @apiName GetProjectAnnotationLabelCounts
     * @apiParam {Number} id The Project ID
     * @apiParam (Optional arguments) {Array} shape Array of shape ids to use to filter annotations
     * @apiParam (Optional arguments) {Array} user_id Array of user ids to use to filter annotations
     * @apiParam (Optional arguments) {Array} filename Array of filename patterns to use to filter annotations
     * @apiParam (Optional arguments) {Array} volume_id Array of volume ids to use to filter annotations
     * @apiParam (Optional arguments) {Boolean} union Whether the filters should be considered inclusive (OR) or exclusive (AND)
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
     * @param Request $request
     * @param int $id Project ID
     * @return \Illuminate\Support\Collection
     */
    public function getProjectAnnotationLabelCounts(Request $request, $id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('access', $project);

        $this->validate($request, [
            'shape' => 'array',
            'shape.*' => 'integer',
            'user_id' => 'array',
            'user_id.*' => 'integer',
            'filename' => 'array',
            'filename.*' => 'string',
            'volume_id' => 'array',
            'volume_id.*' => 'integer',
            'union' => 'boolean',
        ]);

        $filters = [
            'shape' => $request->input('shape'),
            'user_id' => $request->input('user_id'),
            'filename' => $request->input('filename'),
            'volume_id' => $request->input('volume_id'),
        ];
        $filters = array_filter($filters);
        $union = $request->input('union', false);

        // Count the annotation labels per label first and join the labels only once
        // with the (much smaller) result.
        $imageCountQuery = DB::table('image_annotation_labels')
            ->join('image_annotations', 'image_annotation_labels.annotation_id', '=', 'image_annotations.id')
            ->join('images', 'image_annotations.image_id', '=', 'images.id')
            ->whereIn('images.volume_id', function ($query) use ($id) {
                $query->select('volume_id')
                    ->from('project_volume')
                    ->where('project_id', $id);
            })
            ->when(!empty($filters), fn ($query) => $this->compileFilterConditions($query, $union, $filters))
            ->select('image_annotation_labels.label_id')
            ->selectRaw('count(*) as count')
            ->groupBy('image_annotation_labels.label_id');

        $videoCountQuery = DB::table('video_annotation_labels')
            ->join('video_annotations', 'video_annotation_labels.annotation_id', '=', 'video_annotations.id')
            ->join('videos', 'video_annotations.video_id', '=', 'videos.id')
            ->whereIn('videos.volume_id', function ($query) use ($id) {
                $query->select('volume_id')
                    ->from('project_volume')
                    ->where('project_id', $id);
            })
            ->when(!empty($filters), fn ($query) => $this->compileFilterConditions($query, $union, $filters))
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
