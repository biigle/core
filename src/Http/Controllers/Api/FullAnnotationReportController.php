<?php

namespace Dias\Modules\Export\Http\Controllers\Api;

use Dias\Project;
use Illuminate\Http\Request;
use Illuminate\Contracts\Auth\Guard;
use Dias\Http\Controllers\Api\Controller;
use Dias\Modules\Export\Jobs\GenerateReportJob;
use Dias\Modules\Export\Support\Reports\Annotations\FullReport;

class FullAnnotationReportController extends Controller
{
    /**
     * Generate a full report
     *
     * @api {post} projects/:id/reports/full Generate a new full report
     * @apiGroup Projects
     * @apiName GenerateFullProjectReport
     * @apiParam (Optional arguments) {Boolean} restrict If `1`, restrict the report to the export area defined for the individual transects.
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The project ID.
     *
     * @param Request $request
     * @param Guard $auth
     * @param int $id project id
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request, Guard $auth, $id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('access', $project);
        $this->validate($request, ['restrict' => 'boolean']);
        $this->dispatch(new GenerateReportJob(
            new FullReport($project, (bool) $request->input('restrict', false)),
            $auth->user()
        ));
    }
}
