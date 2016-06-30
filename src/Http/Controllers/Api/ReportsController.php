<?php

namespace Dias\Modules\Export\Http\Controllers\Api;

use Dias\Http\Controllers\Api\Controller;
use Dias\Project;
use Dias\Modules\Export\Jobs\GenerateBasicReport;
use Dias\Modules\Export\Jobs\GenerateExtendedReport;
use Dias\Modules\Export\Jobs\GenerateFullReport;
use Dias\Modules\Export\Support\Reports\Report;

class ReportsController extends Controller
{
    /**
     * Generate a basic report
     *
     * @api {get} projects/:id/reports/basic Generate a new report
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
        $this->authorize('access', $project);
        $this->dispatch(new GenerateBasicReport($project, $this->user));
    }

    /**
     * Generate a extended report
     *
     * @api {get} projects/:id/reports/extended Generate a new report
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
        $this->authorize('access', $project);
        $this->dispatch(new GenerateExtendedReport($project, $this->user));
    }
    /**
     * Generate a full report
     *
     * @api {get} projects/:id/reports/full Generate a new report
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
        $this->authorize('access', $project);
        $this->dispatch(new GenerateFullReport($project, $this->user));
    }
    /**
     * Retrieve report from filesystem
     *
     * @api {get} reports/:uid/:filename
     * @apiGroup Files
     * @apiName RetrieveProjectReport
     *
     * @apiParam {string} uid The report uid.
     * @apiParam {string} filename Filename of the downloaded file.
     *
     * @param string $uid report uid
     * @param string $filename Download filename
     * @return \Illuminate\Http\Response
     */
    public function show($uid, $filename)
    {
        $report = new Report($uid);
        if ($report->exists()) {
            return response()
                ->download($report->path, $filename)
                ->deleteFileAfterSend(true);
        } else {
            abort(404);
        }
    }
}
