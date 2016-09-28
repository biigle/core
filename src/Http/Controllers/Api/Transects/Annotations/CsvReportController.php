<?php

namespace Dias\Modules\Export\Http\Controllers\Api\Transects\Annotations;

use Dias\Modules\Export\Support\Reports\Transects\Annotations\CsvReport;
use Dias\Modules\Export\Http\Controllers\Api\Transects\TransectReportController;

class CsvReportController extends TransectReportController
{
    /**
     * The report classname
     *
     * @var string
     */
    protected $report = CsvReport::class;

    /**
     * @api {post} transects/:id/reports/annotations/csv Generate a new csv annotation report
     * @apiGroup Transects
     * @apiName GenerateCsvTransectAnnotationReport
     * @apiParam (Optional arguments) {Boolean} exportArea If `1`, restrict the report to the export area of the transect.
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The transect ID.
     */
}
