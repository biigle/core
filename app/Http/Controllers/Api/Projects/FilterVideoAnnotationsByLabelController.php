<?php

namespace Biigle\Http\Controllers\Api\Projects;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Project;
use Biigle\Traits\CompileFilters;
use Biigle\VideoAnnotation;
use Illuminate\Http\Request;

class FilterVideoAnnotationsByLabelController extends Controller
{
    use CompileFilters;

    /**
     * Show all video annotations of the project that have a specific label attached.
     *
     * @api {get} projects/:pid/video-annotations/filter/label/:lid Get video annotations with a label
     * @apiGroup Projects
     * @apiName ShowProjectsVideoAnnotationsFilterLabels
     * @apiParam {Number} pid The project ID
     * @apiParam {Number} lid The Label ID
     * @apiParam (Optional arguments) {Number} take Number of video annotations to return. If this parameter is present, the most recent annotations will be returned first. Default is unlimited.
     * @apiParam (Optional arguments) {Array} shape_id Array of shape ids to use to filter videos
     * @apiParam (Optional arguments) {Array} user_id Array of user ids to use to filter values
     * @apiParam (Optional arguments) {Array} filename Array of filename patterns to use to filter annotations
     * @apiParam (Optional arguments) {Boolean} union Whether the filters should be considered inclusive (OR) or exclusive (AND)
     * @apiPermission projectMember
     * @apiDescription Returns a map of video annotation IDs to their video UUIDs.
     *
     * @param Request $request
     * @param  int  $pid Project ID
     * @param int $lid Label ID
     * @return \Illuminate\Support\Collection
     */
    public function index(Request $request, $pid, $lid)
    {
        $project = Project::findOrFail($pid);
        $this->authorize('access', $project);

        $this->validate($request, [
            'take' => 'integer',
            'shape_id' => 'array',
            'shape_id.*' => 'integer',
            'user_id' => 'array',
            'user_id.*' => 'integer',
            'filename' => 'array',
            'filename.*' => 'string',
            'union' => 'boolean',
        ]);

        $take = $request->input('take');
        $filters = [
            'shape_id' => $request->input('shape_id'),
            'user_id' => $request->input('user_id'),
            'filename' => $request->input('filename'),
        ];
        $filters = array_filter($filters);
        $union = $request->input('union', false);

        return VideoAnnotation::join('video_annotation_labels', 'video_annotations.id', '=', 'video_annotation_labels.annotation_id')
            ->join('videos', 'video_annotations.video_id', '=', 'videos.id')
            ->whereIn('videos.volume_id', function ($query) use ($pid) {
                $query->select('volume_id')
                    ->from('project_volume')
                    ->where('project_id', $pid);
            })
            ->where('video_annotation_labels.label_id', $lid)
            ->when(!empty($filters), fn ($query) => $this->compileFilterConditions($query, $union, $filters))
            ->when(!is_null($take), fn ($query) => $query->take($take))
            ->select('videos.uuid', 'video_annotations.id')
            ->distinct()
            ->orderBy('video_annotations.id', 'desc')
            ->pluck('videos.uuid', 'video_annotations.id');
    }
}
