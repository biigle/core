<?php

namespace Dias\Modules\Ate\Http\Controllers\Api;

use Dias\Project;
use Dias\Transect;
use Dias\Annotation;
use Illuminate\Http\Request;
use Dias\Http\Controllers\Api\Controller;

class ProjectsAnnotationsController extends Controller
{
    /**
     * Show all annotations of the project that have a specific label attached
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
    public function filter(Request $request, $pid, $lid)
    {
        $project = Project::findOrFail($pid);
        $this->authorize('access', $project);
        $this->validate($request, ['take' => 'integer']);
        $take = $request->input('take');

        return Annotation::join('annotation_labels', 'annotations.id', '=', 'annotation_labels.annotation_id')
            ->whereIn('annotations.image_id', function ($query) use ($pid) {
                $query->select('id')
                    ->from('images')
                    ->whereIn('transect_id', function ($query) use ($pid) {
                        $query->select('transect_id')
                            ->from('project_transect')
                            ->where('project_id', $pid);
                    });
            })
            ->where('annotation_labels.label_id', $lid)
            ->when($take !== null, function ($query) use ($take) {
                return $query->orderBy('annotations.created_at', 'desc')
                    ->take($take);
            })
            ->pluck('annotations.id');
    }

}
