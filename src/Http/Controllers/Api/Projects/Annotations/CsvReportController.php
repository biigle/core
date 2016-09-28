<?php

namespace Dias\Modules\Export\Http\Controllers\Api\Projects\Annotations;

use Dias\Modules\Export\Support\Reports\Projects\Annotations\CsvReport;
use Dias\Modules\Export\Http\Controllers\Api\Projects\ProjectReportController;

class CsvReportController extends ProjectReportController
{
    /**
     * The report classname
     *
     * @var string
     */
    protected $report = CsvReport::class;

    /**
     * @api {post} projects/:id/reports/annotations/csv Generate a new csv annotation report
     * @apiGroup Projects
     * @apiName GenerateCsvProjectAnnotationReport
     * @apiParam (Optional arguments) {Boolean} exportArea If `1`, restrict the report to the export area of the individual transects of the project.
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The project ID.
     */
}
