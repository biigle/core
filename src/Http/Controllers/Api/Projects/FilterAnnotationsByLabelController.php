<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api\Projects;

use Biigle\Project;
use Biigle\Annotation;
use Illuminate\Http\Request;
use Biigle\Http\Controllers\Api\Controller;

class FilterAnnotationsByLabelController extends Controller
{
    /**
     * Show all annotations of the project that have a specific label attached.
     *
     * @api {get} projects/:tid/annotations/filter/label/:lid Get annotations with a specific label
     * @apiGroup Projects
     * @apiName ShowProjectsAnnotationsFilterLabels
     * @apiParam {Number} pid The project ID
     * @apiParam {Number} lit The Label ID
     * @apiParam (Optional arguments) {Number} take Number of annotations to return. If this parameter is present, the most recent annotations will be returned first. Default is unlimited and unordered.
     * @apiPermission projectMember
     * @apiDescription Returns a list of annotation IDs
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

        return Annotation::join('annotation_labels', 'annotations.id', '=', 'annotation_labels.annotation_id')
            ->join('images', 'annotations.image_id', '=', 'images.id')
            ->whereIn('images.volume_id', function ($query) use ($pid) {
                $query->select('volume_id')
                    ->from('project_volume')
                    ->where('project_id', $pid);
            })
            ->where('annotation_labels.label_id', $lid)
            ->when(!is_null($take), function ($query) use ($take) {
                return $query->orderBy('annotations.created_at', 'desc')
                    ->take($take);
            })
            ->select('annotations.id', 'annotations.created_at')
            ->distinct()
            ->pluck('annotations.id');
    }
}
