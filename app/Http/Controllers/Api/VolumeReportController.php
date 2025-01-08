<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Requests\StoreVolumeReport;
use Biigle\Jobs\GenerateReportJob;
use Biigle\Report;

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
     * @apiParam (Optional arguments) {Boolean} export_area If `true`, restrict the report to the export area of the volume. Only available for image annotation reports and the iFDO report.
     * @apiParam (Optional arguments) {Boolean} newest_label If `true`, restrict the report to the newest label of each annotation.
     * @apiParam (Optional arguments) {Boolean} separate_label_trees If `true`, separate annotations with labels of different label trees to different files or sheets of the spreadsheet. Cannot be used together with `separate_users`. Not available for the iFDO report.
     * @apiParam (Optional arguments) {Boolean} separate_users If `true`, separate annotations with labels of different users to different files or sheets of the spreadsheet. Cannot be used together with `separate_label_trees`. Not available for the iFDO report.
     * @apiParam (Optional arguments) {Number} annotation_session_id ID of an annotation session of the volume. If given, only annotations belonging to the annotation session are included in the report. Not available for the iFDO report.
     * @apiParam (Optional arguments) {Number[]} only_labels Array of label IDs to restrict the report to. Omit or leave empty to take all labels.
     * @apiParam (Optional arguments) {Boolean} aggregate_child_labels If `true`, add the abundance of child labels to the abundance of their parent labels and omit the child labels. This is only valid for the abundance report. Labels that are excluded with `only_labels` are not counted.
     * @apiParam (Optional arguments) {Boolean} disable_notifications If `true`, suppress notification to the user on report completion.
     * @apiParam (Optional arguments) {Boolean} strip_ifdo If `true`, remove annotation information from the original iFDO file before it is populated with BIIGLE annotations. Only available for the iFDO report.
     *
     * @apiPermission projectMember
     *
     * @param StoreVolumeReport $request
     * @param int $id Volume ID
     *
     * @return mixed
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

        if ($this->isAutomatedRequest()) {
            return $report;
        }
    }
}
