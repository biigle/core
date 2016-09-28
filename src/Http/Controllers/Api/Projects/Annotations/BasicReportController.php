<?php

namespace Dias\Modules\Export\Http\Controllers\Api\Projects\Annotations;

use Dias\Modules\Export\Support\Reports\Projects\Annotations\BasicReport;
use Dias\Modules\Export\Http\Controllers\Api\Projects\ProjectReportController;

class BasicReportController extends ProjectReportController
{
    /**
     * The report classname
     *
     * @var string
     */
    protected $report = BasicReport::class;

    /**
     * @api {post} projects/:id/reports/annotations/basic Generate a new basic annotation report
     * @apiGroup Projects
     * @apiName GenerateBasicProjectAnnotationReport
     * @apiParam (Optional arguments) {Boolean} exportArea If `1`, restrict the report to the export area of the individual transects of the project.
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The project ID.
     */
}
