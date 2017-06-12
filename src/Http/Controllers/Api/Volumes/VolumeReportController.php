<?php

namespace Biigle\Modules\Export\Http\Controllers\Api\Volumes;

use Biigle\Volume;
use Illuminate\Http\Request;
use Biigle\Modules\Export\Http\Controllers\Api\ReportController;

class VolumeReportController extends ReportController
{
    /*
     * @api {post} volumes/:vid/reports/:tid Generate a new volume report
     * @apiGroup Volumes
     * @apiName GenerateVolumeReport
     * @apiParam (Optional arguments) {Boolean} exportArea If `true`, restrict the report to the export area of the volume.
     * @apiParam (Optional arguments) {Boolean} separateLabelTrees If `true`, separate annotations with labels of different label trees to different sheets of the spreadsheet.
     * @apiParam (Optional arguments) {Number} annotationSession ID of an annotation session of the volume. If given, only annotations belonging to the annotation session are included in the report.
     * @apiPermission projectMember
     *
     * @apiParam {Number} vid The volume ID.
     * @apiParam {Number} tid The report type ID.
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
            'annotationSession' => "nullable|exists:annotation_sessions,id,volume_id,{$this->source->id}",
        ]);

        return array_merge($options, [
            'annotationSession' => $request->input('annotationSession'),
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
