<?php

namespace Biigle\Modules\Export\Http\Controllers\Api\Volumes\Annotations;

use Biigle\Modules\Export\Support\Reports\Volumes\Annotations\BasicReport;
use Biigle\Modules\Export\Http\Controllers\Api\Volumes\VolumeReportController;

class BasicReportController extends VolumeReportController
{
    /**
     * The report classname.
     *
     * @var string
     */
    protected $report = BasicReport::class;

    /*
     * @api {post} volumes/:id/reports/annotations/basic Generate a new basic annotation report
     * @apiGroup Volumes
     * @apiName GenerateBasicVolumeAnnotationReport
     * @apiParam (Optional arguments) {Boolean} exportArea If `true`, restrict the report to the export area of the volume.
     * @apiParam (Optional arguments) {Boolean} separateLabelTrees If `true`, separate annotations with labels of different label trees to different plots.
     * @apiParam (Optional arguments) {Number} annotationSession ID of an annotation session of the volume. If given, only annotations belonging to the annotation session are included in the report.
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The volume ID.
     */
}
