<?php

namespace Dias\Modules\Export\Http\Controllers\Api\Projects\Annotations;

use Dias\Modules\Export\Support\Reports\Projects\Annotations\ExtendedReport;
use Dias\Modules\Export\Http\Controllers\Api\Projects\ProjectReportController;

class ExtendedReportController extends ProjectReportController
{
    /**
     * The report classname
     *
     * @var string
     */
    protected $report = ExtendedReport::class;

    /**
     * @api {post} projects/:id/reports/annotations/extended Generate a new extended annotation report
     * @apiGroup Projects
     * @apiName GenerateExtendedProjectAnnotationReport
     * @apiParam (Optional arguments) {Boolean} exportArea If `1`, restrict the report to the export area of the individual transects of the project.
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The project ID.
     */
}
