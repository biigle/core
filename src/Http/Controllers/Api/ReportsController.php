<?php

namespace Dias\Modules\Export\Http\Controllers\Api;

use Dias\Http\Controllers\Api\Controller;
use Dias\Project;
use Dias\Modules\Export\Jobs\GenerateBasicReport;
use Dias\Modules\Export\Jobs\GenerateExtendedReport;
use Dias\Modules\Export\Jobs\GenerateFullReport;

class ReportsController extends Controller
{
    /**
     * Generate a basic report
     *
     * @api {post} projects/:id/reports/basic Generate a new report
     * @apiGroup Projects
     * @apiName GenerateBasicProjectReport
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The project ID.
     *
     * @param int $id project id
     * @return \Illuminate\Http\Response
     */
    public function basic($id)
    {
        $project = Project::findOrFail($id);
        $this->requireCanSee($project);
        $this->dispatch(new GenerateBasicReport($project));
        echo "Job submitted please wait";
    }
    
    /**
     * Generate a extended report
     *
     * @api {post} projects/:id/reports/extended Generate a new report
     * @apiGroup Projects
     * @apiName GenerateExtendedProjectReport
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The project ID.
     *
     * @param int $id project id
     * @return \Illuminate\Http\Response
     */
    public function extended($id)
    {
        $project = Project::findOrFail($id);
        $this->requireCanSee($project);
        $this->dispatch(new GenerateExtendedReport($project));
        echo "Job submitted please wait";
    }
    /**
     * Generate a full report
     *
     * @api {post} projects/:id/reports/full Generate a new report
     * @apiGroup Projects
     * @apiName GenerateFullProjectReport
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The project ID.
     *
     * @param int $id project id
     * @return \Illuminate\Http\Response
     */
    public function full($id)
    {
        $project = Project::findOrFail($id);
        $this->requireCanSee($project);
        $this->dispatch(new GenerateFullReport($project));
        echo "Job submitted please wait";
    }
}
