<?php

namespace Biigle\Modules\Export\Http\Controllers\Api\Projects\Annotations;

use Biigle\Modules\Export\Support\Reports\Projects\Annotations\BasicReport;
use Biigle\Modules\Export\Http\Controllers\Api\Projects\ProjectReportController;

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
     * @apiParam (Optional arguments) {Boolean} exportArea If `true`, restrict the report to the export area of the individual transects of the project.
     * @apiParam (Optional arguments) {Boolean} separateLabelTrees If `true`, separate annotations with labels of different label trees to different plots for each transect.
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The project ID.
     */
}
