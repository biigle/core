<?php

namespace Dias\Modules\Export\Http\Controllers\Api\Transects\Annotations;

use Dias\Modules\Export\Support\Reports\Transects\Annotations\BasicReport;
use Dias\Modules\Export\Http\Controllers\Api\Transects\TransectReportController;

class BasicReportController extends TransectReportController
{
    /**
     * The report classname
     *
     * @var string
     */
    protected $report = BasicReport::class;

    /**
     * @api {post} transects/:id/reports/annotations/basic Generate a new basic annotation report
     * @apiGroup Transects
     * @apiName GenerateBasicTransectAnnotationReport
     * @apiParam (Optional arguments) {Boolean} exportArea If `1`, restrict the report to the export area of the transect.
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The transect ID.
     */
}
