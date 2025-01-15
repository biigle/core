<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api\Projects;

use Biigle\Project;
use Biigle\VideoAnnotation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Biigle\Http\Controllers\Api\Controller;

class FilterVideoAnnotationsByLabelController extends Controller
{
    /**
     * Show all video annotations of the project that have a specific label attached.
     *
     * @api {get} projects/:tid/video-annotations/filter/label/:lid Get video annotations with a label
     * @apiGroup Projects
     * @apiName ShowProjectsVideoAnnotationsFilterLabels
     * @apiParam {Number} pid The project ID
     * @apiParam {Number} lit The Label ID
     * @apiParam (Optional arguments) {Number} take Number of video annotations to return. If this parameter is present, the most recent annotations will be returned first. Default is unlimited.
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
        $this->validate($request, ['take' => 'integer']);
        $take = $request->input('take');

        return VideoAnnotation::join('video_annotation_labels', 'video_annotations.id', '=', 'video_annotation_labels.annotation_id')
            ->join('videos', 'video_annotations.video_id', '=', 'videos.id')
            ->whereIn('videos.volume_id', function ($query) use ($pid) {
                $query->select('volume_id')
                    ->from('project_volume')
                    ->where('project_id', $pid);
            })
            ->where('video_annotation_labels.label_id', $lid)
            ->when(!is_null($take), function ($query) use ($take) {
                return $query->take($take);
            })
            ->select('videos.uuid', 'video_annotations.id')
            ->distinct()
            ->orderBy('video_annotations.id', 'desc')
            ->pluck('videos.uuid', 'video_annotations.id');
    }

    /**
     * Get all video labels with uuids and annotation count for a given project
     * 
     * @api {get} 
     * @apiGroup Projects
     * @apiName test
     * @apiParam {Number} id The Project ID
     * @apiPermission user
     * @apiDescription Returns a collection of project video labels, video UUIDs, and annotation label counts
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
    public function getProjectsAnnotationLabels($id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('access', $project);

        return DB::table('labels')
        ->join('video_annotation_labels', 'labels.id', '=', 'video_annotation_labels.label_id')
        ->join('video_annotations', 'video_annotation_labels.annotation_id', '=', 'video_annotations.id')
        ->join('videos', 'video_annotations.video_id', '=', 'videos.id')
        ->join('project_volume', 'videos.volume_id', '=', 'project_volume.volume_id')
        ->where('project_volume.project_id','=',$id)
        ->select('labels.*', DB::raw('COUNT(labels.id) as count'))
        ->groupBy('labels.id')
        ->get();
    }
}
