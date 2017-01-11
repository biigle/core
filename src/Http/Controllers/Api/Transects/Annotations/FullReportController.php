<?php

namespace Biigle\Modules\Export\Http\Controllers\Api\Transects\Annotations;

use Biigle\Modules\Export\Support\Reports\Transects\Annotations\FullReport;
use Biigle\Modules\Export\Http\Controllers\Api\Transects\TransectReportController;

class FullReportController extends TransectReportController
{
    /**
     * The report classname
     *
     * @var string
     */
    protected $report = FullReport::class;

    /**
     * @api {post} transects/:id/reports/annotations/full Generate a new full annotation report
     * @apiGroup Transects
     * @apiName GenerateFullTransectAnnotationReport
     * @apiParam (Optional arguments) {Boolean} exportArea If `true`, restrict the report to the export area of the transect.
     * @apiParam (Optional arguments) {Boolean} separateLabelTrees If `true`, separate annotations with labels of different label trees to different sheets of the spreadsheet.
     * @apiParam (Optional arguments) {Number} annotationSession ID of an annotation session of the transect. If given, only annotations belonging to the annotation session are included in the report.
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The transect ID.
     */
}
