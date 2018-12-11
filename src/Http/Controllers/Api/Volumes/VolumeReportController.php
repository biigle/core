<?php

namespace Biigle\Modules\Reports\Http\Controllers\Api\Volumes;

use Biigle\Volume;
use Illuminate\Http\Request;
use Biigle\Modules\Reports\Http\Controllers\Api\ReportController;

class VolumeReportController extends ReportController
{
    /**
     * @api {post} volumes/:id/reports Request a volume report
     * @apiGroup Reports
     * @apiName GenerateVolumeReport
     *
     * @apiParam {Number} id The volume ID.
     *
     * @apiParam (Required arguments) {Number} type_id The report type ID.
     *
     * @apiParam (Optional arguments) {Boolean} export_area If `true`, restrict the report to the export area of the volume.
     * @apiParam (Optional arguments) {Boolean} newest_label If `true`, restrict the report to the newest label of each annotation.
     * @apiParam (Optional arguments) {Boolean} separate_label_trees If `true`, separate annotations with labels of different label trees to different sheets of the spreadsheet.
     * @apiParam (Optional arguments) {Number} annotation_session_id ID of an annotation session of the volume. If given, only annotations belonging to the annotation session are included in the report.
     *
     * @apiPermission projectMember
     *
     */

    /**
     * Get the options of the requested report.
     *
     * @param Request $request
     * @return array
     */
    public function getOptions(Request $request)
    {
        $options = parent::getOptions($request);

        $this->validate($request, [
            'annotation_session_id' => "nullable|exists:annotation_sessions,id,volume_id,{$this->source->id}",
        ]);

        return array_merge($options, [
            'annotationSession' => $request->input('annotation_session_id'),
        ]);
    }

    /**
     * Get the source to generate the report for.
     *
     * @param int $id
     * @return mixed
     */
    protected function getSource($id)
    {
        return Volume::findOrFail($id);
    }
}
