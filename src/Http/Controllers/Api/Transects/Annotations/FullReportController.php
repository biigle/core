<?php

namespace Dias\Modules\Export\Http\Controllers\Api\Transects\Annotations;

use Dias\Modules\Export\Support\Reports\Transects\Annotations\FullReport;
use Dias\Modules\Export\Http\Controllers\Api\Transects\TransectReportController;

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
     * @apiParam (Optional arguments) {Boolean} exportArea If `1`, restrict the report to the export area of the transect.
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The transect ID.
     */
}
