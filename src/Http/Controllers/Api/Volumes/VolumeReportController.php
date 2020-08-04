<?php

namespace Biigle\Modules\Reports\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Modules\Reports\Http\Requests\StoreVolumeReport;
use Biigle\Modules\Reports\Jobs\GenerateReportJob;
use Biigle\Modules\Reports\Report;

class VolumeReportController extends Controller
{
    /**
     * Generate a volume report.
     *
     * @api {post} volumes/:id/reports Request a volume report
     * @apiGroup Reports
     * @apiName GenerateVolumeReport
     * @apiDescription Accepts only requests for annotation and image label reports.
     *
     * @apiParam {Number} id The volume ID.
     *
     * @apiParam (Required arguments) {Number} type_id The report type ID.
     *
     * @apiParam (Optional arguments) {Boolean} export_area If `true`, restrict the report to the export area of the volume. Only available for image annotation reports.
     * @apiParam (Optional arguments) {Boolean} newest_label If `true`, restrict the report to the newest label of each annotation.
     * @apiParam (Optional arguments) {Boolean} separate_label_trees If `true`, separate annotations with labels of different label trees to different sheets of the spreadsheet.
     * @apiParam (Optional arguments) {Number} annotation_session_id ID of an annotation session of the volume. If given, only annotations belonging to the annotation session are included in the report.
     * @apiParam (Optional arguments) {Number[]} only_labels Array of label IDs to restrict the report to. Omit or leave empty to take all labels.
     * @apiParam (Optional arguments) {Boolean} aggregate_child_labels If `true`, add the abundance of child labels to the abundance of their parent labels and omit the child labels. This is only valid for the Basic, Extended and Abundance reports. Labels that are excluded with `only_labels` are not counted.
     *
     * @apiPermission projectMember
     *
     * @param StoreVolumeReport $request
     * @param int $id Volume ID
     */
    public function store(StoreVolumeReport $request, $id)
    {
        $report = new Report;
        $report->source()->associate($request->volume);
        $report->type_id = $request->input('type_id');
        $report->user()->associate($request->user());
        $report->options = $request->getOptions();
        $report->save();

        $queue = config('reports.generate_report_queue');
        GenerateReportJob::dispatch($report)->onQueue($queue);
    }
}
