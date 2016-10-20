<?php

namespace Dias\Modules\Export\Http\Controllers\Api\Transects\Annotations;

use Dias\Modules\Export\Support\Reports\Transects\Annotations\ExtendedReport;
use Dias\Modules\Export\Http\Controllers\Api\Transects\TransectReportController;

class ExtendedReportController extends TransectReportController
{
    /**
     * The report classname
     *
     * @var string
     */
    protected $report = ExtendedReport::class;

    /**
     * @api {post} transects/:id/reports/annotations/extended Generate a new extended annotation report
     * @apiGroup Transects
     * @apiName GenerateExtendedTransectAnnotationReport
     * @apiParam (Optional arguments) {Boolean} exportArea If `true`, restrict the report to the export area of the transect.
     * @apiParam (Optional arguments) {Boolean} separateLabelTrees If `true`, separate annotations with labels of different label trees to different sheets of the spreadsheet.
     * @apiParam (Optional arguments) {Number} annotationSession ID of an annotation session of the transect. If given, only annotations belonging to the annotation session are included in the report.
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The transect ID.
     */
}
