<?php

namespace Biigle\Modules\Export\Http\Controllers\Api\Volumes\Annotations;

use Biigle\Modules\Export\Support\Reports\Volumes\Annotations\AreaReport;
use Biigle\Modules\Export\Http\Controllers\Api\Volumes\VolumeReportController;

class AreaReportController extends VolumeReportController
{
    /**
     * The report classname
     *
     * @var string
     */
    protected $report = AreaReport::class;

    /**
     * @api {post} volumes/:id/reports/annotations/area Generate a new annotation area report
     * @apiGroup Volumes
     * @apiName GenerateAreaVolumeAnnotationReport
     * @apiParam (Optional arguments) {Boolean} exportArea If `true`, restrict the report to the export area of the volume.
     * @apiParam (Optional arguments) {Boolean} separateLabelTrees If `true`, separate annotations with labels of different label trees to different sheets of the spreadsheet.
     * @apiParam (Optional arguments) {Number} annotationSession ID of an annotation session of the volume. If given, only annotations belonging to the annotation session are included in the report.
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The volume ID.
     */
}
