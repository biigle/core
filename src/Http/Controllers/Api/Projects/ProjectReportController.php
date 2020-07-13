<?php

namespace Biigle\Modules\Reports\Http\Controllers\Api\Projects;

use Biigle\Modules\Reports\Http\Controllers\Api\ReportController;
use Biigle\Modules\Reports\Jobs\GenerateReportJob;
use Biigle\Modules\Reports\Report;
use Biigle\Modules\Reports\ReportType;
use Biigle\Project;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

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
     * @apiParam (Optional arguments) {Number[]} only_labels Array of label IDs to restrict the report to. Omit or leave empty to take all labels.
     * @apiParam (Optional arguments) {Boolean} aggregate_child_labels If `true`, add the abundance of child labels to the abundance of their parent labels and omit the child labels. This is only valid for the Basic, Extended and Abundance reports. Labels that are excluded with `only_labels` are not counted.
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
        $this->validate($request, ['type_id' => 'required|id|exists:report_types,id']);

        if (intval($request->input('type_id')) === ReportType::videoAnnotationsCsvId()) {
            if (!$project->videos()->exists()) {
                throw ValidationException::withMessages(['type_id' => ['The project must contain videos.']]);
            }
        } elseif (!$project->volumes()->exists()) {
            throw ValidationException::withMessages(['type_id' => ['The project must contain volumes.']]);
        }

        $report = new Report;
        $report->source()->associate($project);
        $report->type_id = $request->input('type_id');
        $report->user()->associate($request->user());
        $report->options = $this->getOptions($request);
        $report->save();

        $queue = config('reports.generate_report_queue');
        GenerateReportJob::dispatch($report)->onQueue($queue);
    }
}
