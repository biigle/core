<?php

namespace Biigle\Modules\Reports\Http\Controllers\Api\Projects;

use Biigle\Project;
use Illuminate\Http\Request;
use Biigle\Modules\Reports\Report;
use Illuminate\Validation\ValidationException;
use Biigle\Modules\Reports\Jobs\GenerateReportJob;
use Biigle\Modules\Reports\Http\Controllers\Api\ReportController;

class ProjectReportController extends ReportController
{
    /**
     * Generate a project report.
     *
     * @api {post} projects/:id/reports Request a project report
     * @apiGroup Reports
     * @apiName GenerateProjectReport
     *
     * @apiParam {Number} id The project ID.
     *
     * @apiParam (Required arguments) {Number} type_id The report type ID.
     *
     * @apiParam (Optional arguments) {Boolean} exportArea If `true`, restrict the report to the export area of the project.
     * @apiParam (Optional arguments) {Boolean} newest_label If `true`, restrict the report to the newest label of each annotation.
     * @apiParam (Optional arguments) {Boolean} separateLabelTrees If `true`, separate annotations with labels of different label trees to different sheets of the spreadsheet.
     *
     * @apiPermission projectMember
     *
     * @param Request $request
     * @param int $id Project ID
     */
    public function store(Request $request, $id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('access', $project);
        $this->validate($request, ['type_id' => 'required|exists:report_types,id']);

        if (!$project->volumes()->exists()) {
            throw ValidationException::withMessages(['type_id' => ['The project must contain volumes.']]);
        }

        $report = new Report;
        $report->source()->associate($project);
        $report->type_id = $request->input('type_id');
        $report->user()->associate($request->user());
        $report->options = $this->getOptions($request);
        $report->save();

        GenerateReportJob::dispatch($report)->onQueue('high');
    }
}
