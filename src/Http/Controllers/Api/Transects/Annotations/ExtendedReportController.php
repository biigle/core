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
     * @apiParam (Optional arguments) {Boolean} exportArea If `1`, restrict the report to the export area of the transect.
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The transect ID.
     */
}
