<?php

namespace Biigle\Modules\Export\Http\Controllers\Api\Projects\Annotations;

use Biigle\Modules\Export\Support\Reports\Projects\Annotations\ExtendedReport;
use Biigle\Modules\Export\Http\Controllers\Api\Projects\ProjectReportController;

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
     * @apiParam (Optional arguments) {Boolean} exportArea If `true`, restrict the report to the export area of the individual transects of the project.
     * @apiParam (Optional arguments) {Boolean} separateLabelTrees If `true`, separate annotations with labels of different label trees to different sheets of the spreadsheet for each transect.
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The project ID.
     */
}
