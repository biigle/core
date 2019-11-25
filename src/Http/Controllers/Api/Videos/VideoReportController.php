<?php

namespace Biigle\Modules\Reports\Http\Controllers\Api\Videos;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Biigle\Modules\Videos\Video;
use Biigle\Modules\Reports\Report;
use Biigle\Modules\Reports\ReportType;
use Biigle\Modules\Reports\Jobs\GenerateReportJob;
use Biigle\Modules\Reports\Http\Controllers\Api\ReportController;

class VideoReportController extends ReportController
{
    /**
     * Generate a video report.
     *
     * @api {post} videos/:id/reports Request a video report
     * @apiGroup Reports
     * @apiName GenerateVideoReport
     * @apiDescription Accepts only requests for video annotation reports.
     *
     * @apiParam {Number} id The video ID.
     *
     * @apiParam (Required arguments) {Number} type_id The report type ID.
     *
     * @apiParam (Optional arguments) {Boolean} separate_label_trees If `true`, separate annotations with labels of different label trees to different sheets of the spreadsheet.
     * @apiParam (Optional arguments) {Number[]} only_labels Array of label IDs to restrict the report to. Omit or leave empty to take all labels.
     *
     * @apiPermission projectMember
     *
     * @param Request $request
     * @param int $id Video ID
     */
    public function store(Request $request, $id)
    {
        $video = Video::findOrFail($id);
        $this->authorize('access', $video);
        $this->validate($request, [
            'type_id' => [
                'required',
                Rule::in([ReportType::videoAnnotationsCsvId()]),
                'exists:report_types,id',
            ],
        ]);

        $report = new Report;
        $report->source()->associate($video);
        $report->type_id = $request->input('type_id');
        $report->user()->associate($request->user());
        $report->options = $this->getOptions($request);
        $report->save();

        GenerateReportJob::dispatch($report)->onQueue('high');
    }
}
