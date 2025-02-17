<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api\Projects;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Modules\Largo\Traits\CompileFilters;
use Biigle\Project;
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
     * @apiParam (Optional arguments) {Array} shape_id Array of shape ids to use to filter images
     * @apiParam (Optional arguments) {Array} user_id Array of user ids to use to filter values
     * @apiParam (Optional arguments) {Boolean} union Whether the filters should be considered exclusive (AND) or inclusive (OR)
     * @apiPermission projectMember
     * @apiDescription Returns a map of video annotation IDs to their video UUIDs.
     *
     * @param Request $request
     * @param  int  $pid Project ID
     * @param int $lid Label ID
     * @return \Illuminate\Http\Response
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
            'union' => 'boolean',
        ]);

        $take = $request->input('take');
        $shape_ids = $request->input('shape_id');
        $user_ids = $request->input('user_id');
        $union = $request->input('union', 0);

        return VideoAnnotation::join('video_annotation_labels', 'video_annotations.id', '=', 'video_annotation_labels.annotation_id')
            ->join('videos', 'video_annotations.video_id', '=', 'videos.id')
            ->whereIn('videos.volume_id', function ($query) use ($pid) {
                $query->select('volume_id')
                    ->from('project_volume')
                    ->where('project_id', $pid);
            })
            ->where('video_annotation_labels.label_id', $lid)
            ->when(!is_null($user_ids), fn ($query) => $this->compileFilterConditions($query, $union, $user_ids, 'user_id'))
            ->when(!is_null($shape_ids), fn ($query) => $this->compileFilterConditions($query, $union, $shape_ids, 'shape_id'))
            ->when(!is_null($take), function ($query) use ($take) {
                return $query->take($take);
            })
            ->select('videos.uuid', 'video_annotations.id')
            ->distinct()
            ->orderBy('video_annotations.id', 'desc')
            ->pluck('videos.uuid', 'video_annotations.id');
    }
}
